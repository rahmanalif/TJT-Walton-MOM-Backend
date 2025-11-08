const mongoose = require('mongoose');

const mergeRequestSchema = new mongoose.Schema({
  // The parent who sends the merge request
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',
    required: true
  },

  // The partner who receives the merge request
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',
    required: true
  },

  // Email of the recipient for validation
  recipientEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },

  // Status of the merge request
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },

  // Optional message from requester
  message: {
    type: String,
    maxlength: 500
  },

  // Timestamp when request was approved/rejected
  respondedAt: {
    type: Date
  },

  // Response message from recipient
  responseMessage: {
    type: String,
    maxlength: 500
  },

  // Track if the families have been merged
  mergeCompleted: {
    type: Boolean,
    default: false
  },

  // Store merge metadata
  mergeDetails: {
    childrenMerged: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Child' }],
    eventsMerged: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    mergedAt: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
mergeRequestSchema.index({ requester: 1, status: 1 });
mergeRequestSchema.index({ recipient: 1, status: 1 });
mergeRequestSchema.index({ recipientEmail: 1 });

// Prevent duplicate pending requests
mergeRequestSchema.index(
  { requester: 1, recipient: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

// Virtual to check if request is still pending
mergeRequestSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

// Virtual to check if request was approved
mergeRequestSchema.virtual('isApproved').get(function() {
  return this.status === 'approved';
});

// Method to approve the request
mergeRequestSchema.methods.approve = function(responseMessage = '') {
  this.status = 'approved';
  this.respondedAt = new Date();
  this.responseMessage = responseMessage;
  return this.save();
};

// Method to reject the request
mergeRequestSchema.methods.reject = function(responseMessage = '') {
  this.status = 'rejected';
  this.respondedAt = new Date();
  this.responseMessage = responseMessage;
  return this.save();
};

// Method to cancel the request (by requester)
mergeRequestSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

// Method to mark merge as completed
mergeRequestSchema.methods.completeMerge = function(childrenIds, eventsIds) {
  this.mergeCompleted = true;
  this.mergeDetails = {
    childrenMerged: childrenIds,
    eventsMerged: eventsIds,
    mergedAt: new Date()
  };
  return this.save();
};

const MergeRequest = mongoose.model('MergeRequest', mergeRequestSchema);

module.exports = MergeRequest;
