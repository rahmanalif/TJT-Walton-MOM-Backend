const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  // Event title
  title: {
    type: String,
    required: [true, 'Please provide an event title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },

  // Event description
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },

  // Location (optional)
  location: {
    type: String,
    trim: true,
    maxlength: [500, 'Location cannot be more than 500 characters']
  },

  // All day event flag
  allDayEvent: {
    type: Boolean,
    default: false
  },

  // Start date
  startDate: {
    type: Date,
    required: [true, 'Please provide a start date']
  },

  // Start time (stored as string HH:MM format)
  startTime: {
    type: String,
    validate: {
      validator: function(v) {
        // Only validate if not an all-day event
        if (this.allDayEvent) return true;
        return !v || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Please provide a valid time in HH:MM format'
    }
  },

  // End date
  endDate: {
    type: Date,
    required: [true, 'Please provide an end date'],
    validate: {
      validator: function(v) {
        // End date should be >= start date
        return !this.startDate || v >= this.startDate;
      },
      message: 'End date must be after or equal to start date'
    }
  },

  // End time (stored as string HH:MM format)
  endTime: {
    type: String,
    validate: {
      validator: function(v) {
        // Only validate if not an all-day event
        if (this.allDayEvent) return true;
        return !v || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Please provide a valid time in HH:MM format'
    }
  },

  // Privacy and sharing settings
  visibility: {
    type: String,
    enum: {
      values: ['shared', 'busy', 'private'],
      message: '{VALUE} is not a valid visibility option'
    },
    default: 'shared',
    required: true
  },

  // Assigned family members (if visibility is shared, can optionally share with specific members)
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent'
  }],

  // Select all flag (for UI convenience)
  assignedToAll: {
    type: Boolean,
    default: false
  },

  // Creator of the event
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',
    required: true
  }
}, {
  timestamps: true
});

// Pre-save hook to handle all-day events
EventSchema.pre('save', function(next) {
  if (this.allDayEvent) {
    // For all-day events, set times to null
    this.startTime = null;
    this.endTime = null;
  } else {
    // For timed events, ensure times are provided
    if (!this.startTime) {
      return next(new Error('Start time is required for non all-day events'));
    }
    if (!this.endTime) {
      return next(new Error('End time is required for non all-day events'));
    }
  }
  next();
});

// Index for faster queries
EventSchema.index({ createdBy: 1, startDate: 1 });
EventSchema.index({ assignedTo: 1, startDate: 1 });

module.exports = mongoose.model('Event', EventSchema);
