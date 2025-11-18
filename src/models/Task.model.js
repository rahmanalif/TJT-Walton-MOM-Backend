const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  assignedTo: [{
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'assignedTo.memberType'
    },
    memberType: {
      type: String,
      required: true,
      enum: ['Parent', 'Teen', 'Child', 'Adult']
    }
  }],
  points: {
    type: Number,
    enum: [5, 10, 15, 20, 25, 30, 50]
  },
  dueDate: {
    type: Date
  },
  dueTime: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',
    required: true
  }
}, {
  timestamps: true
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;