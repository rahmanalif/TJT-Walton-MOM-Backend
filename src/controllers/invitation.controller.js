const Invitation = require('../models/Invitation.model');
const Parent = require('../models/Parent.model');
const { sendEmail } = require('../services/notification.service');

// @desc    Send invitation to a parent to join family
// @route   POST /api/invitations/send
// @access  Private (authenticated parent)
exports.sendInvitation = async (req, res) => {
  try {
    const { email, role } = req.body;
    const inviterId = req.parent._id; // Using req.parent from auth middleware

    // Validate required fields
    if (!email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and role for the invitation'
      });
    }

    // Validate role
    if (!['mom', 'dad', 'parent'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be one of: mom, dad, parent'
      });
    }

    // Get inviter details
    const inviter = await Parent.findById(inviterId);
    if (!inviter) {
      return res.status(404).json({
        success: false,
        message: 'Inviter not found'
      });
    }

    // Check if the email is the same as inviter's email
    if (email.toLowerCase() === inviter.email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot invite yourself'
      });
    }

    // Check if invitee is already a registered parent
    const existingParent = await Parent.findOne({ email: email.toLowerCase() });
    if (existingParent) {
      // Check if they're already family members
      if (inviter.familyMembers.includes(existingParent._id)) {
        return res.status(400).json({
          success: false,
          message: 'This parent is already part of your family'
        });
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await Invitation.findOne({
      invitedEmail: email.toLowerCase(),
      invitedBy: inviterId,
      status: 'pending'
    });

    if (existingInvitation && !existingInvitation.isExpired()) {
      return res.status(400).json({
        success: false,
        message: 'An active invitation already exists for this email'
      });
    }

    // Create new invitation
    const invitation = await Invitation.create({
      invitedBy: inviterId,
      invitedEmail: email.toLowerCase(),
      invitedRole: role,
      familyName: inviter.familyname
    });

    // Generate invitation link
    const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invitation/${invitation.token}`;

    // Send invitation email
    const emailSubject = `${inviter.firstname} ${inviter.lastname} invited you to join their family on TJT Walton`;
    const emailText = `
Hello!

${inviter.firstname} ${inviter.lastname} has invited you to join their family (${inviter.familyname}) as ${role} on TJT Walton.

Click the link below to accept the invitation:
${invitationLink}

This invitation will expire in 7 days.

If you did not expect this invitation, you can safely ignore this email.

Best regards,
TJT Walton Team
    `;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Family Invitation</h1>
    </div>
    <div class="content">
      <h2>Hello!</h2>
      <p><strong>${inviter.firstname} ${inviter.lastname}</strong> has invited you to join their family <strong>${inviter.familyname}</strong> as <strong>${role}</strong> on TJT Walton.</p>
      <p>Click the button below to accept the invitation:</p>
      <a href="${invitationLink}" class="button">Accept Invitation</a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #3b82f6;">${invitationLink}</p>
      <p><small>This invitation will expire in 7 days.</small></p>
      <p style="margin-top: 30px;">If you did not expect this invitation, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>Best regards,<br>TJT Walton Team</p>
    </div>
  </div>
</body>
</html>
    `;

    try {
      await sendEmail({
        to: email,
        subject: emailSubject,
        text: emailText,
        html: emailHtml
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Continue even if email fails - user can still see invitation in their account
    }

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: {
        invitation: {
          id: invitation._id,
          email: invitation.invitedEmail,
          role: invitation.invitedRole,
          status: invitation.status,
          expiresAt: invitation.expiresAt
        }
      }
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending invitation',
      error: error.message
    });
  }
};

// @desc    Get all invitations sent by current user
// @route   GET /api/invitations/sent
// @access  Private
exports.getSentInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find({ invitedBy: req.parent._id })
      .sort('-createdAt')
      .select('-token');

    res.status(200).json({
      success: true,
      count: invitations.length,
      data: invitations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sent invitations',
      error: error.message
    });
  }
};

// @desc    Get all invitations received by current user's email
// @route   GET /api/invitations/received
// @access  Private
exports.getReceivedInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find({
      invitedEmail: req.parent.email,
      status: 'pending'
    })
      .populate('invitedBy', 'firstname lastname familyname email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: invitations.length,
      data: invitations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching received invitations',
      error: error.message
    });
  }
};

// @desc    Get invitation by token (for public access)
// @route   GET /api/invitations/token/:token
// @access  Public
exports.getInvitationByToken = async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({ token })
      .populate('invitedBy', 'firstname lastname familyname email avatar');

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    if (invitation.isExpired()) {
      await invitation.markAsExpired();
      return res.status(400).json({
        success: false,
        message: 'This invitation has expired'
      });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This invitation has already been ${invitation.status}`
      });
    }

    res.status(200).json({
      success: true,
      data: {
        invitation: {
          invitedEmail: invitation.invitedEmail,
          invitedRole: invitation.invitedRole,
          familyName: invitation.familyName,
          inviter: invitation.invitedBy,
          expiresAt: invitation.expiresAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching invitation',
      error: error.message
    });
  }
};

// @desc    Accept invitation
// @route   POST /api/invitations/accept/:token
// @access  Public/Private (can be used by both registered and new users)
exports.acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({ token })
      .populate('invitedBy', 'firstname lastname familyname email familyMembers');

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    if (invitation.isExpired()) {
      await invitation.markAsExpired();
      return res.status(400).json({
        success: false,
        message: 'This invitation has expired'
      });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This invitation has already been ${invitation.status}`
      });
    }

    // Find or create the invited parent
    let invitedParent = await Parent.findOne({ email: invitation.invitedEmail });

    if (!invitedParent) {
      // If parent doesn't exist, they need to register first
      return res.status(400).json({
        success: false,
        message: 'Please create an account first to accept this invitation',
        data: {
          redirectTo: 'register',
          email: invitation.invitedEmail,
          role: invitation.invitedRole,
          familyName: invitation.familyName,
          token: token
        }
      });
    }

    // Update the invited parent's family information
    if (!invitedParent.familyMembers.includes(invitation.invitedBy._id)) {
      invitedParent.familyMembers.push(invitation.invitedBy._id);
    }
    invitedParent.parentRole = invitation.invitedRole;
    invitedParent.familyname = invitation.familyName;
    await invitedParent.save();

    // Update the inviter's family members
    const inviter = invitation.invitedBy;
    if (!inviter.familyMembers.includes(invitedParent._id)) {
      inviter.familyMembers.push(invitedParent._id);
      await inviter.save();
    }

    // Update invitation status
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    invitation.acceptedBy = invitedParent._id;
    await invitation.save();

    res.status(200).json({
      success: true,
      message: 'Invitation accepted successfully',
      data: {
        family: {
          familyName: invitation.familyName,
          role: invitation.invitedRole,
          members: invitedParent.familyMembers.length + 1
        }
      }
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting invitation',
      error: error.message
    });
  }
};

// @desc    Decline invitation
// @route   POST /api/invitations/decline/:token
// @access  Public
exports.declineInvitation = async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({ token });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This invitation has already been ${invitation.status}`
      });
    }

    invitation.status = 'declined';
    await invitation.save();

    res.status(200).json({
      success: true,
      message: 'Invitation declined successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error declining invitation',
      error: error.message
    });
  }
};

// @desc    Cancel invitation (by sender)
// @route   DELETE /api/invitations/:id
// @access  Private
exports.cancelInvitation = async (req, res) => {
  try {
    const invitation = await Invitation.findOne({
      _id: req.params.id,
      invitedBy: req.parent._id
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or you are not authorized to cancel it'
      });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an invitation that has been ${invitation.status}`
      });
    }

    await invitation.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Invitation cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling invitation',
      error: error.message
    });
  }
};
