const mongoose = require('mongoose');

const childSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide the family member's name"],
    trim: true
  },
  role: {
    type: String,
    enum: ['mom', 'dad', 'child', 'teen', 'grandparents', 'caregiver', 'other'],
    required: [true, "Please provide a role"]
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
    default: '#3b82f6'
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

const Child = mongoose.model('Child', childSchema);

module.exports = Child;
