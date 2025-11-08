const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const parentSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: [true, 'Please provide a first name'],
    trim: true
  },
  lastname: {
    type: String,
    required: [true, 'Please provide a last name'],
    trim: true
  },
  familyname: {
    type: String,
    required: [true, 'Please provide a family name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  notificationPreference: {
    type: String,
    enum: ['email', 'sms', 'both', 'none'],
    default: 'email'
  },
  password: {
    type: String,
    required: function() {
      // Password only required for local auth (not OAuth)
      return this.authProvider === 'local' || !this.authProvider;
    },
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['parent', 'admin'],
    default: 'parent'
  },
  // Family relationship fields
  parentRole: {
    type: String,
    enum: ['mom', 'dad', 'parent'],
    default: 'parent'
  },
  familyMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent'
  }],
  // OAuth fields
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  avatar: {
    type: String
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  }
}, {
  timestamps: true
});

// Hash password before saving
parentSchema.pre('save', async function(next) {
  // Only hash the password if it's new or modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
parentSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

const Parent = mongoose.model('Parent', parentSchema);

module.exports = Parent;