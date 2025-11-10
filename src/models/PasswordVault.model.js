const mongoose = require('mongoose');

const passwordVaultSchema = new mongoose.Schema({
  // Title of the password entry
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },

  // Category
  category: {
    type: String,
    enum: ['streaming', 'booking', 'school', 'shopping', 'utilities', 'social media', 'work', 'other'],
    required: [true, 'Please provide a category'],
    lowercase: true
  },

  // Website link
  websiteLink: {
    type: String,
    trim: true,
    maxlength: [500, 'Website link cannot be more than 500 characters']
  },

  // Username
  username: {
    type: String,
    trim: true,
    maxlength: [200, 'Username cannot be more than 200 characters']
  },

  // Email
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },

  // Password (stored as plain text - in production, consider encryption)
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    maxlength: [500, 'Password cannot be more than 500 characters']
  },

  // Optional notes
  notes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Notes cannot be more than 2000 characters']
  },

  // Favorite flag
  isFavorite: {
    type: Boolean,
    default: false
  },

  // Creator (only parents can create)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',
    required: true
  },

  // Family name for filtering (deprecated - now using linked familyMembers on Parent model)
  familyname: {
    type: String,
    trim: true
  },

  // Shared with family members (array of IDs that can reference Parent, Teen, or Child)
  // Note: For querying, we check if the ID exists in sharedWith array
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId
  }],

  // Share with all family members flag
  sharedWithAll: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
passwordVaultSchema.index({ createdBy: 1, category: 1 });
passwordVaultSchema.index({ isFavorite: 1 });
passwordVaultSchema.index({ sharedWith: 1 });

const PasswordVault = mongoose.model('PasswordVault', passwordVaultSchema);

module.exports = PasswordVault;
