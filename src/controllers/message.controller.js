const Message = require('../models/Message.model');
const Parent = require('../models/Parent.model');
const { sendEmail, sendSms } = require('../services/notification.service');

/**
 * Send a message to a family member
 * POST /api/messages/send
 */
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.parent._id;
    const { recipientId, recipientType, subject, message, deliveryMethod } = req.body;

    // Validate required fields
    if (!recipientId || !recipientType || !subject || !message || !deliveryMethod) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: recipientId, recipientType, subject, message, deliveryMethod'
      });
    }

    // Validate recipient type
    const validRecipientTypes = ['Parent', 'Teen', 'Child'];
    if (!validRecipientTypes.includes(recipientType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid recipient type. Must be one of: ${validRecipientTypes.join(', ')}`
      });
    }

    // Validate delivery method
    const validDeliveryMethods = ['in-app', 'sms', 'email', 'all'];
    if (!validDeliveryMethods.includes(deliveryMethod)) {
      return res.status(400).json({
        success: false,
        message: `Invalid delivery method. Must be one of: ${validDeliveryMethods.join(', ')}`
      });
    }

    // Get sender information
    const sender = await Parent.findById(senderId);
    if (!sender) {
      return res.status(404).json({
        success: false,
        message: 'Sender not found'
      });
    }

    // Get recipient information based on type
    const Child = require('../models/Child.model');
    const Teen = require('../models/Teen.model');

    let recipient;
    let recipientName;
    let recipientEmail;
    let recipientPhone;

    if (recipientType === 'Parent') {
      recipient = await Parent.findById(recipientId);
      if (!recipient) {
        return res.status(404).json({
          success: false,
          message: 'Parent recipient not found'
        });
      }
      recipientName = `${recipient.firstname} ${recipient.lastname}`;
      recipientEmail = recipient.email;
      recipientPhone = recipient.phoneNumber;

      // Check if recipient is a family member
      const isFamilyMember = sender.familyMembers.some(
        memberId => memberId.toString() === recipientId.toString()
      );

      if (!isFamilyMember && recipientId.toString() !== senderId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only send messages to family members'
        });
      }
    } else if (recipientType === 'Teen') {
      recipient = await Teen.findById(recipientId);
      if (!recipient) {
        return res.status(404).json({
          success: false,
          message: 'Teen recipient not found'
        });
      }
      recipientName = `${recipient.firstname} ${recipient.lastname}`;
      recipientEmail = recipient.email;
      recipientPhone = recipient.phoneNumber;

      // Check if teen belongs to this parent or their family
      if (recipient.parent.toString() !== senderId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only send messages to teens in your family'
        });
      }
    } else if (recipientType === 'Child') {
      recipient = await Child.findById(recipientId);
      if (!recipient) {
        return res.status(404).json({
          success: false,
          message: 'Child recipient not found'
        });
      }
      recipientName = recipient.name;
      recipientEmail = recipient.email;
      recipientPhone = recipient.phoneNumber;

      // Check if child belongs to this parent
      const isParentChild = recipient.family && recipient.family.toString() === senderId.toString();

      // Check if parent is in the parent array (for merged families)
      let isInParentArray = false;
      if (recipient.parent) {
        if (Array.isArray(recipient.parent)) {
          isInParentArray = recipient.parent.some(p => p.toString() === senderId.toString());
        } else {
          isInParentArray = recipient.parent.toString() === senderId.toString();
        }
      }

      if (!isParentChild && !isInParentArray) {
        return res.status(403).json({
          success: false,
          message: 'You can only send messages to children in your family'
        });
      }
    }

    // Create the message
    const newMessage = new Message({
      sender: senderId,
      senderModel: 'Parent',
      senderName: `${sender.firstname} ${sender.lastname}`,
      recipient: recipientId,
      recipientModel: recipientType,
      recipientName,
      subject,
      message,
      deliveryMethod,
      familyName: sender.familyname,
      deliveryStatus: {
        inApp: { sent: false },
        sms: { sent: false },
        email: { sent: false }
      }
    });

    // Handle in-app delivery
    if (deliveryMethod === 'in-app' || deliveryMethod === 'all') {
      newMessage.deliveryStatus.inApp.sent = true;
      newMessage.deliveryStatus.inApp.sentAt = new Date();
    }

    // Handle SMS delivery
    if (deliveryMethod === 'sms' || deliveryMethod === 'all') {
      if (recipientPhone) {
        try {
          const smsBody = `${subject}\n\n${message}\n\n- ${sender.firstname} ${sender.lastname}`;
          await sendSms({
            to: recipientPhone,
            body: smsBody
          });
          newMessage.deliveryStatus.sms.sent = true;
          newMessage.deliveryStatus.sms.sentAt = new Date();
        } catch (error) {
          console.error('SMS delivery failed:', error);
          newMessage.deliveryStatus.sms.error = error.message;
        }
      } else {
        newMessage.deliveryStatus.sms.error = 'Recipient has no phone number';
      }
    }

    // Handle Email delivery
    if (deliveryMethod === 'email' || deliveryMethod === 'all') {
      if (recipientEmail) {
        try {
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">New Message from ${sender.firstname} ${sender.lastname}</h2>
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #555; margin-top: 0;">${subject}</h3>
                <p style="color: #666; line-height: 1.6; white-space: pre-wrap;">${message}</p>
              </div>
              <p style="color: #888; font-size: 12px;">
                This message was sent via TJT Walton Family App
              </p>
            </div>
          `;

          await sendEmail({
            to: recipientEmail,
            subject: `Family Message: ${subject}`,
            text: `${subject}\n\n${message}\n\n- ${sender.firstname} ${sender.lastname}`,
            html: emailHtml
          });
          newMessage.deliveryStatus.email.sent = true;
          newMessage.deliveryStatus.email.sentAt = new Date();
        } catch (error) {
          console.error('Email delivery failed:', error);
          newMessage.deliveryStatus.email.error = error.message;
        }
      } else {
        newMessage.deliveryStatus.email.error = 'Recipient has no email address';
      }
    }

    // Save the message
    await newMessage.save();

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message: newMessage,
        deliveryStatus: {
          inApp: newMessage.deliveryStatus.inApp.sent,
          sms: newMessage.deliveryStatus.sms.sent,
          email: newMessage.deliveryStatus.email.sent,
          errors: {
            sms: newMessage.deliveryStatus.sms.error,
            email: newMessage.deliveryStatus.email.error
          }
        }
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

/**
 * Get inbox messages for the current user
 * GET /api/messages/inbox
 */
exports.getInbox = async (req, res) => {
  try {
    const userId = req.parent._id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const query = {
      recipient: userId,
      isDeleted: false
    };

    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const messages = await Message.find(query)
      .populate('sender', 'firstname lastname email avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Message.countDocuments(query);
    const unreadCount = await Message.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      data: {
        messages,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        },
        unreadCount
      }
    });
  } catch (error) {
    console.error('Get inbox error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve inbox',
      error: error.message
    });
  }
};

/**
 * Get sent messages for the current user
 * GET /api/messages/sent
 */
exports.getSentMessages = async (req, res) => {
  try {
    const userId = req.parent._id;
    const { page = 1, limit = 20 } = req.query;

    const messages = await Message.find({
      sender: userId,
      isDeleted: false
    })
      .populate('recipient', 'firstname lastname email avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Message.countDocuments({
      sender: userId,
      isDeleted: false
    });

    res.status(200).json({
      success: true,
      data: {
        messages,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get sent messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve sent messages',
      error: error.message
    });
  }
};

/**
 * Get a conversation between the current user and another user
 * GET /api/messages/conversation/:userId
 */
exports.getConversation = async (req, res) => {
  try {
    const currentUserId = req.parent._id;
    const { userId } = req.params;

    // Check if the other user exists and is a family member
    const otherUser = await Parent.findById(userId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const messages = await Message.getConversation(currentUserId, userId);

    res.status(200).json({
      success: true,
      data: {
        messages,
        otherUser: {
          _id: otherUser._id,
          firstname: otherUser.firstname,
          lastname: otherUser.lastname,
          email: otherUser.email,
          avatar: otherUser.avatar
        }
      }
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversation',
      error: error.message
    });
  }
};

/**
 * Mark a message as read
 * PUT /api/messages/:messageId/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.parent._id;
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if the current user is the recipient
    if (message.recipient.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only mark your own messages as read'
      });
    }

    if (message.isRead) {
      return res.status(200).json({
        success: true,
        message: 'Message already marked as read',
        data: { message }
      });
    }

    await message.markAsRead();

    res.status(200).json({
      success: true,
      message: 'Message marked as read',
      data: { message }
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark message as read',
      error: error.message
    });
  }
};

/**
 * Delete a message (soft delete)
 * DELETE /api/messages/:messageId
 */
exports.deleteMessage = async (req, res) => {
  try {
    const userId = req.parent._id;
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if the current user is the sender or recipient
    const isSender = message.sender.toString() === userId.toString();
    const isRecipient = message.recipient.toString() === userId.toString();

    if (!isSender && !isRecipient) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedBy = userId;
    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message
    });
  }
};

/**
 * Get unread message count
 * GET /api/messages/unread/count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.parent._id;
    const count = await Message.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
};

/**
 * Get available family members to send messages to
 * GET /api/messages/family-members
 */
exports.getFamilyMembers = async (req, res) => {
  try {
    const userId = req.parent._id;
    const Child = require('../models/Child.model');
    const Teen = require('../models/Teen.model');

    // Get current user and their linked family members
    const user = await Parent.findById(userId)
      .populate('familyMembers', 'firstname lastname email avatar phoneNumber role')
      .populate('teenAccounts', 'firstname lastname email avatar phoneNumber accountRole');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Build allowed parent ids (self + any linked family members)
    const allowedParentIds = [user._id, ...(user.familyMembers || [])].map(p => p._id ? p._id : p).map(String);

    // Get children where the child's `family` or `parent` reference points to any allowed parent id
    const children = await Child.find({
      $or: [
        { family: { $in: allowedParentIds } },
        { parent: { $in: allowedParentIds } }
      ]
    });

    // Get teens where the teen's parent is any allowed parent id
    const teens = await Teen.find({ parent: { $in: allowedParentIds } });

    // Include current user + linked parents, children and teens
    const parentEntries = [
      {
        id: user._id,
        name: `${user.firstname} ${user.lastname}`,
        email: user.email,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar,
        type: 'Parent',
        role: user.role || 'parent'
      },
      ...user.familyMembers.map(parent => ({
        id: parent._id,
        name: `${parent.firstname} ${parent.lastname}`,
        email: parent.email,
        phoneNumber: parent.phoneNumber,
        avatar: parent.avatar,
        type: 'Parent',
        role: parent.role || 'parent'
      }))
    ];

    const childEntries = children.map(child => ({
      id: child._id,
      name: child.name,
      email: child.email,
      phoneNumber: child.phoneNumber,
      colorCode: child.colorCode,
      type: 'Child',
      role: child.role
    }));

    const teenEntries = teens.map(teen => ({
      id: teen._id,
      name: `${teen.firstname} ${teen.lastname}`,
      email: teen.email,
      phoneNumber: teen.phoneNumber,
      avatar: teen.avatar,
      type: 'Teen',
      role: teen.accountRole
    }));

    // Merge and deduplicate by id to prevent duplicates when someone appears in multiple lists
    const combined = [...parentEntries, ...childEntries, ...teenEntries];
    const seen = new Set();
    const familyMembers = combined.filter(item => {
      const id = item.id.toString();
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    res.status(200).json({
      success: true,
      data: {
        familyMembers
      }
    });
  } catch (error) {
    console.error('Get family members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get family members',
      error: error.message
    });
  }
};
