const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Please provide note content'],
    trim: true
  },
  title: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',
    required: true
  },
  isVoiceNote: {
    type: Boolean,
    default: false
  },
  audioUrl: {
    type: String
  }
}, {
  timestamps: true
});

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;
