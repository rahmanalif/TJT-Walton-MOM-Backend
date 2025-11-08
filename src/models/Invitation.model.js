const mongoose = require('mongoose');
const crypto = require('crypto');

const invitationSchema = new mongoose.Schema({
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',
    required: [true, 'Please provide the inviter']
  },
  invitedEmail: {
    type: String,
    required: [true, 'Please provide an email for the invitation'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  invitedRole: {
    type: String,
    enum: ['mom', 'dad', 'parent'],
    required: [true, 'Please provide a role for the invited parent']
  },
  familyName: {
    type: String,
    required: [true, 'Please provide the family name'],
    trim: true
  },
  token: {
    type: String,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days from now
  },
  acceptedAt: {
    type: Date
  },
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent'
  }
}, {
  timestamps: true
});

// Generate unique invitation token before saving
invitationSchema.pre('validate', function(next) {
  if (this.isNew && !this.token) {
    this.token = crypto.randomBytes(32).toString('hex');
  }
  next();
});

// Check if invitation is expired
invitationSchema.methods.isExpired = function() {
  return this.status === 'expired' || new Date() > this.expiresAt;
};

// Mark invitation as expired
invitationSchema.methods.markAsExpired = async function() {
  this.status = 'expired';
  await this.save();
};

// Index for faster queries
invitationSchema.index({ token: 1 });
invitationSchema.index({ invitedEmail: 1, status: 1 });
invitationSchema.index({ expiresAt: 1 });

const Invitation = mongoose.model('Invitation', invitationSchema);

module.exports = Invitation;
