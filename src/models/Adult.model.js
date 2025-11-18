const mongoose = require('mongoose');

const adultSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide the adult's name"],
    trim: true
  },
  role: {
    type: String,
    enum: ['grandparent', 'caregiver', 'relative', 'other'],
    default: 'other'
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  notificationPreference: {
    type: String,
    enum: ['sms', 'email', 'both', 'none'],
    default: 'none'
  },
  colorCode: {
    type: String,
    default: '#8b5cf6'
  },
  family: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent'
  },
  familyname: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const Adult = mongoose.model('Adult', adultSchema);

module.exports = Adult;
