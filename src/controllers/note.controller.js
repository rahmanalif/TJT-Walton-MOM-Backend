const Note = require('../models/Note.model');

// @desc    Create a new note
// @route   POST /api/notes
// @access  Private
exports.createNote = async (req, res) => {
  try {
    const { title, content } = req.body;

    const note = await Note.create({
      title,
      content,
      createdBy: req.parent.id,
      isVoiceNote: false
    });

    res.status(201).json({
      success: true,
      data: note
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    res.status(400).json({
      success: false,
      message: 'Error creating note',
      error: error.message
    });
  }
};

// @desc    Get all notes
// @route   GET /api/notes
// @access  Private
exports.getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ createdBy: req.parent.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notes.length,
      data: notes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notes',
      error: error.message
    });
  }
};

// @desc    Get a single note
// @route   GET /api/notes/:id
// @access  Private
exports.getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: `Note not found with id of ${req.params.id}`
      });
    }

    // Ensure parent owns the note
    if (note.createdBy.toString() !== req.parent.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to view this note'
      });
    }

    res.status(200).json({
      success: true,
      data: note
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: `Note not found with id of ${req.params.id}`
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error fetching note',
      error: error.message
    });
  }
};

// @desc    Update a note
// @route   PUT /api/notes/:id
// @access  Private
exports.updateNote = async (req, res) => {
  try {
    let note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: `Note not found with id of ${req.params.id}`
      });
    }

    // Ensure parent owns the note
    if (note.createdBy.toString() !== req.parent.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this note'
      });
    }

    note = await Note.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: note
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: `Note not found with id of ${req.params.id}`
      });
    }
    res.status(400).json({
      success: false,
      message: 'Error updating note',
      error: error.message
    });
  }
};

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Private
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: `Note not found with id of ${req.params.id}`
      });
    }

    // Ensure parent owns the note
    if (note.createdBy.toString() !== req.parent.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this note'
      });
    }

    await note.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: `Note not found with id of ${req.params.id}`
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error deleting note',
      error: error.message
    });
  }
};
