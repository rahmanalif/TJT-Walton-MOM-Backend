const MergeRequest = require('../models/MergeRequest.model');
const Parent = require('../models/Parent.model');
const Child = require('../models/Child.model');
const Event = require('../models/Event.model');
const { sendNotification } = require('../services/notification.service');

/**
 * Send a merge request to a partner
 * POST /api/merge-requests/send
 */
exports.sendMergeRequest = async (req, res) => {
  try {
    const requesterId = req.parent._id; // From auth middleware
    const { partnerEmail, message } = req.body;

    // Validate input
    if (!partnerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Partner email is required'
      });
    }

    // Check if trying to merge with self
    const requester = await Parent.findById(requesterId);
    if (requester.email.toLowerCase() === partnerEmail.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot send a merge request to yourself'
      });
    }

    // Find the partner by email
    const recipient = await Parent.findOne({
      email: partnerEmail.toLowerCase()
    });

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'No parent found with this email address'
      });
    }

    // Check if there's already a pending request between these two parents
    const existingRequest = await MergeRequest.findOne({
      $or: [
        { requester: requesterId, recipient: recipient._id, status: 'pending' },
        { requester: recipient._id, recipient: requesterId, status: 'pending' }
      ]
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'There is already a pending merge request between you and this partner'
      });
    }

    // Check if families are already merged
    const alreadyMerged = await MergeRequest.findOne({
      $or: [
        { requester: requesterId, recipient: recipient._id, status: 'approved', mergeCompleted: true },
        { requester: recipient._id, recipient: requesterId, status: 'approved', mergeCompleted: true }
      ]
    });

    if (alreadyMerged) {
      return res.status(400).json({
        success: false,
        message: 'Your families are already merged'
      });
    }

    // Create the merge request
    const mergeRequest = new MergeRequest({
      requester: requesterId,
      recipient: recipient._id,
      recipientEmail: partnerEmail.toLowerCase(),
      message: message || ''
    });

    await mergeRequest.save();

    // Send notification to the recipient
    await sendNotification({
      user: recipient,
      subject: 'Family Merge Request',
      text: `${requester.firstname} ${requester.lastname} has sent you a family merge request. ${message ? 'Message: ' + message : ''}`,
      html: `
        <h2>Family Merge Request</h2>
        <p><strong>${requester.firstname} ${requester.lastname}</strong> (${requester.email}) has sent you a family merge request.</p>
        ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
        <p>Log in to your account to approve or reject this request.</p>
      `
    });

    res.status(201).json({
      success: true,
      message: 'Merge request sent successfully',
      data: {
        mergeRequest: {
          id: mergeRequest._id,
          recipient: {
            name: `${recipient.firstname} ${recipient.lastname}`,
            email: recipient.email
          },
          status: mergeRequest.status,
          createdAt: mergeRequest.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Error sending merge request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send merge request',
      error: error.message
    });
  }
};

/**
 * Get all merge requests (sent and received)
 * GET /api/merge-requests
 */
exports.getMergeRequests = async (req, res) => {
  try {
    const parentId = req.parent._id;
    const { type, status } = req.query;

    console.log('Get merge requests - Parent ID:', parentId);

    let query = {};

    // Filter by type (sent or received)
    if (type === 'sent') {
      query.requester = parentId;
    } else if (type === 'received') {
      query.recipient = parentId;
    } else {
      // Get both sent and received
      query.$or = [
        { requester: parentId },
        { recipient: parentId }
      ];
    }

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    console.log('Query:', JSON.stringify(query));

    const mergeRequests = await MergeRequest.find(query)
      .populate('requester', 'firstname lastname email')
      .populate('recipient', 'firstname lastname email')
      .sort({ createdAt: -1 });

    console.log('Found merge requests:', mergeRequests.length);

    res.json({
      success: true,
      data: {
        mergeRequests: mergeRequests.map(mr => ({
          id: mr._id,
          requester: mr.requester,
          recipient: mr.recipient,
          message: mr.message,
          status: mr.status,
          responseMessage: mr.responseMessage,
          mergeCompleted: mr.mergeCompleted,
          createdAt: mr.createdAt,
          respondedAt: mr.respondedAt,
          isSentByMe: mr.requester._id.toString() === parentId
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching merge requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch merge requests',
      error: error.message
    });
  }
};

/**
 * Approve a merge request and merge families
 * POST /api/merge-requests/:id/approve
 */
exports.approveMergeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const recipientId = req.parent._id;
    const { responseMessage } = req.body;

    console.log('Approve merge request - ID:', id);
    console.log('Recipient ID:', recipientId);

    // Validate ObjectId format
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid merge request ID format'
      });
    }

    // Find the merge request
    const mergeRequest = await MergeRequest.findById(id)
      .populate('requester', 'firstname lastname email')
      .populate('recipient', 'firstname lastname email');

    console.log('Merge request found:', mergeRequest ? 'Yes' : 'No');

    if (!mergeRequest) {
      return res.status(404).json({
        success: false,
        message: 'Merge request not found'
      });
    }

    console.log('Merge request recipient ID:', mergeRequest.recipient._id.toString());
    console.log('Logged in parent ID:', recipientId.toString());
    console.log('IDs match:', mergeRequest.recipient._id.toString() === recipientId.toString());

    // Verify the user is the recipient
    if (mergeRequest.recipient._id.toString() !== recipientId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to approve this request'
      });
    }

    // Check if already responded
    if (mergeRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This request has already been ${mergeRequest.status}`
      });
    }

    // Approve the request
    await mergeRequest.approve(responseMessage);

    // Perform the family merge
    const mergeResult = await mergeFamilies(
      mergeRequest.requester._id,
      mergeRequest.recipient._id
    );

    // Update merge request with merge details
    await mergeRequest.completeMerge(
      mergeResult.childrenIds,
      mergeResult.eventsIds
    );

    // Notify the requester about approval
    await sendNotification({
      user: mergeRequest.requester,
      subject: 'Family Merge Request Approved!',
      text: `${mergeRequest.recipient.firstname} ${mergeRequest.recipient.lastname} has approved your family merge request. ${mergeResult.childrenCount} children and ${mergeResult.eventsCount} events have been merged.`,
      html: `
        <h2>Family Merge Request Approved!</h2>
        <p><strong>${mergeRequest.recipient.firstname} ${mergeRequest.recipient.lastname}</strong> has approved your family merge request.</p>
        <p><strong>Merge Summary:</strong></p>
        <ul>
          <li>Children merged: ${mergeResult.childrenCount}</li>
          <li>Events merged: ${mergeResult.eventsCount}</li>
        </ul>
        <p>You can now view and manage all family data together!</p>
      `
    });

    res.json({
      success: true,
      message: 'Merge request approved and families merged successfully',
      data: {
        mergeRequest: {
          id: mergeRequest._id,
          status: mergeRequest.status,
          mergeCompleted: mergeRequest.mergeCompleted
        },
        mergeResult: {
          childrenMerged: mergeResult.childrenCount,
          eventsMerged: mergeResult.eventsCount
        }
      }
    });
  } catch (error) {
    console.error('Error approving merge request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve merge request',
      error: error.message
    });
  }
};

/**
 * Reject a merge request
 * POST /api/merge-requests/:id/reject
 */
exports.rejectMergeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const recipientId = req.parent._id;
    const { responseMessage } = req.body;

    // Find the merge request
    const mergeRequest = await MergeRequest.findById(id)
      .populate('requester', 'firstname lastname email')
      .populate('recipient', 'firstname lastname email');

    if (!mergeRequest) {
      return res.status(404).json({
        success: false,
        message: 'Merge request not found'
      });
    }

    // Verify the user is the recipient
    if (mergeRequest.recipient._id.toString() !== recipientId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to reject this request'
      });
    }

    // Check if already responded
    if (mergeRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This request has already been ${mergeRequest.status}`
      });
    }

    // Reject the request
    await mergeRequest.reject(responseMessage);

    // Notify the requester about rejection
    await sendNotification({
      user: mergeRequest.requester,
      subject: 'Family Merge Request Declined',
      text: `${mergeRequest.recipient.firstname} ${mergeRequest.recipient.lastname} has declined your family merge request. ${responseMessage ? 'Response: ' + responseMessage : ''}`,
      html: `
        <h2>Family Merge Request Declined</h2>
        <p><strong>${mergeRequest.recipient.firstname} ${mergeRequest.recipient.lastname}</strong> has declined your family merge request.</p>
        ${responseMessage ? `<p><strong>Their response:</strong> ${responseMessage}</p>` : ''}
      `
    });

    res.json({
      success: true,
      message: 'Merge request rejected',
      data: {
        mergeRequest: {
          id: mergeRequest._id,
          status: mergeRequest.status,
          respondedAt: mergeRequest.respondedAt
        }
      }
    });
  } catch (error) {
    console.error('Error rejecting merge request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject merge request',
      error: error.message
    });
  }
};

/**
 * Cancel a merge request (by requester)
 * POST /api/merge-requests/:id/cancel
 */
exports.cancelMergeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const requesterId = req.parent._id;

    // Find the merge request
    const mergeRequest = await MergeRequest.findById(id);

    if (!mergeRequest) {
      return res.status(404).json({
        success: false,
        message: 'Merge request not found'
      });
    }

    // Verify the user is the requester
    if (mergeRequest.requester.toString() !== requesterId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this request'
      });
    }

    // Check if already responded
    if (mergeRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This request has already been ${mergeRequest.status}`
      });
    }

    // Cancel the request
    await mergeRequest.cancel();

    res.json({
      success: true,
      message: 'Merge request cancelled',
      data: {
        mergeRequest: {
          id: mergeRequest._id,
          status: mergeRequest.status
        }
      }
    });
  } catch (error) {
    console.error('Error cancelling merge request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel merge request',
      error: error.message
    });
  }
};

/**
 * Helper function to merge two families
 * @private
 */
async function mergeFamilies(requesterParentId, recipientParentId) {
  // Get all children from both parents
  const requesterChildren = await Child.find({ parent: requesterParentId });
  const recipientChildren = await Child.find({ parent: recipientParentId });

  // Add recipient as parent to requester's children
  // Add requester as parent to recipient's children
  const childrenIds = [];

  for (const child of requesterChildren) {
    if (!child.parent.includes(recipientParentId)) {
      child.parent.push(recipientParentId);
      await child.save();
    }
    childrenIds.push(child._id);
  }

  for (const child of recipientChildren) {
    if (!child.parent.includes(requesterParentId)) {
      child.parent.push(requesterParentId);
      await child.save();
    }
    childrenIds.push(child._id);
  }

  // Get all events from both parents
  const allChildrenIds = [...requesterChildren.map(c => c._id), ...recipientChildren.map(c => c._id)];
  const events = await Event.find({ child: { $in: allChildrenIds } });
  const eventsIds = events.map(e => e._id);

  return {
    childrenIds,
    eventsIds,
    childrenCount: childrenIds.length,
    eventsCount: eventsIds.length
  };
}

module.exports = exports;
