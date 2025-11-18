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
  // Profile settings
  displayName: {
    type: String,
    trim: true
  },
  // App settings
  settings: {
    mindfulUsage: {
      enabled: {
        type: Boolean,
        default: false
      },
      reminderInterval: {
        type: Number,
        default: 20, // minutes
        enum: [10, 15, 20, 30, 40, 45] // User can choose from these options
      },
      breakDuration: {
        type: Number,
        default: 5, // minutes
        min: 2,
        max: 15
      },
      dailyUsageGoal: {
        type: Number,
        default: 120, // minutes
        min: 30,
        max: 300
        // Increment: 15 minutes (enforced in frontend slider)
      }
    },
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
    profile: {
      timeFormat: {
        type: String,
        enum: ['12-hour', '24-hour'],
        default: '12-hour'
      }
    },
    privacy: {
      shareActivityStatus: {
        type: Boolean,
        default: true,
        description: 'Let family members see when you are active'
      },
      locationSharing: {
        type: Boolean,
        default: false,
        description: 'Share your location for family coordination'
      },
      usageAnalytics: {
        type: Boolean,
        default: true,
        description: 'Help improve the app by sharing usage data'
      },
      marketingCommunications: {
        type: Boolean,
        default: false,
        description: 'Receive updates about new features'
      },
      dataBackupToCloud: {
        type: Boolean,
        default: true,
        description: 'Automatically backup your family data'
      }
    },
    security: {
      twoFactorEnabled: {
        type: Boolean,
        default: false,
        description: 'Add an extra layer of security to your account'
      },
      loginNotifications: {
        type: Boolean,
        default: true,
        description: 'Get notified when someone logs into your account'
      },
      autoLockApp: {
        type: Boolean,
        default: false,
        description: 'Automatically lock app after 15 minutes of inactivity'
      },
      autoLockTimeout: {
        type: Number,
        default: 15, // minutes
        min: 1,
        max: 60
      }
    }
  },
  // Active sessions tracking
  activeSessions: [{
    deviceName: {
      type: String,
      required: true
    },
    deviceType: {
      type: String,
      enum: ['web', 'mobile', 'tablet', 'desktop'],
      default: 'web'
    },
    lastActive: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String,
    sessionToken: String,
    isCurrentDevice: {
      type: Boolean,
      default: false
    }
  }],
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
    enum: ['teen'],
    default: 'teen'
  },
  // Family relationship fields
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent'
  },
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

const Teen = mongoose.model('Teen', teenSchema);

module.exports = Teen;