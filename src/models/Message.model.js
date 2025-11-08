const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Sender information
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'senderModel',
    required: [true, 'Sender is required']
  },
  senderModel: {
    type: String,
    required: true,
    enum: ['Parent', 'Teen']
  },
  senderName: {
    type: String,
    required: true
  },
  // Recipient information
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'recipientModel',
    required: [true, 'Recipient is required']
  },
  recipientModel: {
    type: String,
    required: true,
    enum: ['Parent', 'Teen', 'Child']
  },
  recipientName: {
    type: String,
    required: true
  },
  // Message content
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  // Delivery method
  deliveryMethod: {
    type: String,
    enum: ['in-app', 'sms', 'email', 'all'],
    required: [true, 'Delivery method is required'],
    default: 'in-app'
  },
  // Delivery status
  deliveryStatus: {
    inApp: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      read: { type: Boolean, default: false },
      readAt: { type: Date }
    },
    sms: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      error: { type: String }
    },
    email: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      error: { type: String }
    }
  },
  // Message metadata
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  // Family context
  familyName: {
    type: String,
    required: true
  },
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent'
  }
}, {
  timestamps: true
});

// Index for efficient queries
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, isRead: 1 });
messageSchema.index({ familyName: 1, createdAt: -1 });

// Method to mark message as read
messageSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  this.deliveryStatus.inApp.read = true;
  this.deliveryStatus.inApp.readAt = new Date();
  return this.save();
};

// Static method to get unread count for a user
messageSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false,
    isDeleted: false
  });
};

// Static method to get conversation between two users
messageSchema.statics.getConversation = function(user1Id, user2Id) {
  return this.find({
    $or: [
      { sender: user1Id, recipient: user2Id },
      { sender: user2Id, recipient: user1Id }
    ],
    isDeleted: false
  }).sort({ createdAt: 1 });
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
