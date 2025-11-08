const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const teenSchema = new mongoose.Schema({
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
  email: {
    type: String,
    lowercase: true,
    trim: true,
    sparse: true, // Allow null but must be unique if provided
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  phoneNumber: {
    type: String,
    trim: true,
    sparse: true // Allow null but must be unique if provided
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  // Account role based on age
  accountRole: {
    type: String,
    enum: ['child', 'teen', 'young-adult'],
    required: [true, 'Please provide an account role']
  },
  // Age for validation
  age: {
    type: Number,
    required: [true, 'Please provide age'],
    min: 8,
    max: 25
  },
  // Date of birth
  dateOfBirth: {
    type: Date,
    required: [true, 'Please provide date of birth']
  },
  // Parent who invited this teen
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',
    required: [true, 'Teen must be associated with a parent']
  },
  familyname: {
    type: String,
    required: [true, 'Please provide a family name'],
    trim: true
  },
  // Profile settings
  avatar: {
    type: String
  },
  displayName: {
    type: String,
    trim: true
  },
  colorCode: {
    type: String,
    default: '#3b82f6'
  },
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  // Settings (simplified version of parent settings)
  settings: {
    notifications: {
      pushEnabled: {
        type: Boolean,
        default: true
      }
    },
    appearance: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'blue-light'],
        default: 'light'
      }
    },
    privacy: {
      shareActivityStatus: {
        type: Boolean,
        default: true
      }
    }
  },
  // Last login tracking
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Validate age matches account role
teenSchema.pre('validate', function(next) {
  if (this.age && this.accountRole) {
    const { age, accountRole } = this;

    if (accountRole === 'child' && (age < 8 || age > 12)) {
      return next(new Error('Child account role requires age between 8-12'));
    }
    if (accountRole === 'teen' && (age < 13 || age > 17)) {
      return next(new Error('Teen account role requires age between 13-17'));
    }
    if (accountRole === 'young-adult' && (age < 18 || age > 25)) {
      return next(new Error('Young adult account role requires age between 18-25'));
    }
  }
  next();
});

// Ensure either email or phone number is provided
teenSchema.pre('validate', function(next) {
  if (!this.email && !this.phoneNumber) {
    return next(new Error('Please provide either email or phone number'));
  }
  next();
});

// Hash password before saving
teenSchema.pre('save', async function(next) {
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
teenSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Calculate age from date of birth
teenSchema.methods.calculateAge = function() {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

const Teen = mongoose.model('Teen', teenSchema);

module.exports = Teen;
