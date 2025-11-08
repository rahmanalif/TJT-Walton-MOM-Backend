const mongoose = require('mongoose');
const crypto = require('crypto');

const teenInvitationSchema = new mongoose.Schema({
  // Parent who is sending the invitation
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',
    required: [true, 'Please provide the parent']
  },
  // Teen's information
  teenName: {
    type: String,
    required: [true, 'Please provide the teen\'s name'],
    trim: true
  },
  // Account role (child 8-12, teen 13-17, young adult 18+)
  accountRole: {
    type: String,
    enum: ['child', 'teen', 'young-adult'],
    required: [true, 'Please provide an account role']
  },
  // Invitation delivery method
  invitationMethod: {
    type: String,
    enum: ['email', 'sms'],
    required: [true, 'Please provide an invitation method']
  },
  // Contact information based on method
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    required: function() {
      return this.invitationMethod === 'email';
    }
  },
  phoneNumber: {
    type: String,
    trim: true,
    required: function() {
      return this.invitationMethod === 'sms';
    }
  },
  // 6-digit verification code
  verificationCode: {
    type: String,
    required: true
  },
  // Status of invitation
  status: {
    type: String,
    enum: ['pending', 'verified', 'expired', 'used'],
    default: 'pending'
  },
  // Expiration time (codes expire in 30 minutes)
  expiresAt: {
    type: Date,
    required: true,
    default: () => Date.now() + 30 * 60 * 1000 // 30 minutes from now
  },
  // When the code was verified
  verifiedAt: {
    type: Date
  },
  // The teen account created with this invitation
  teenAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teen'
  },
  // Family name
  familyName: {
    type: String,
    required: [true, 'Please provide the family name'],
    trim: true
  },
  // Number of times code was attempted
  attemptCount: {
    type: Number,
    default: 0
  },
  // Max attempts allowed
  maxAttempts: {
    type: Number,
    default: 5
  }
}, {
  timestamps: true
});

// Generate 6-digit verification code before saving
teenInvitationSchema.pre('validate', function(next) {
  if (this.isNew && !this.verificationCode) {
    // Generate 6-digit code
    this.verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  }
  next();
});

// Check if invitation is expired
teenInvitationSchema.methods.isExpired = function() {
  return this.status === 'expired' || new Date() > this.expiresAt;
};

// Mark invitation as expired
teenInvitationSchema.methods.markAsExpired = async function() {
  this.status = 'expired';
  await this.save();
};

// Verify the code
teenInvitationSchema.methods.verifyCode = async function(code) {
  // Check if expired
  if (this.isExpired()) {
    throw new Error('Verification code has expired');
  }

  // Check if already used
  if (this.status === 'used') {
    throw new Error('This invitation code has already been used');
  }

  // Check max attempts
  if (this.attemptCount >= this.maxAttempts) {
    await this.markAsExpired();
    throw new Error('Maximum verification attempts exceeded');
  }

  // Increment attempt count
  this.attemptCount += 1;
  await this.save();

  // Check if code matches
  if (this.verificationCode !== code) {
    throw new Error('Invalid verification code');
  }

  // Mark as verified
  this.status = 'verified';
  this.verifiedAt = new Date();
  await this.save();

  return true;
};

// Index for faster queries
teenInvitationSchema.index({ verificationCode: 1 });
teenInvitationSchema.index({ email: 1, status: 1 });
teenInvitationSchema.index({ phoneNumber: 1, status: 1 });
teenInvitationSchema.index({ expiresAt: 1 });
teenInvitationSchema.index({ parent: 1 });

const TeenInvitation = mongoose.model('TeenInvitation', teenInvitationSchema);

module.exports = TeenInvitation;
