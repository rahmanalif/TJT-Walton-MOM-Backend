const express = require('express');
const router = express.Router();
const {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote
} = require('../controllers/note.controller');
const { protect } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

// @route   POST /api/notes
// @desc    Create a new note
// @access  Private
router.post('/', createNote);

// @route   GET /api/notes
// @desc    Get all notes
// @access  Private
router.get('/', getNotes);

// @route   GET /api/notes/:id
// @desc    Get a single note
// @access  Private
router.get('/:id', getNoteById);

// @route   PUT /api/notes/:id
// @desc    Update a note
// @access  Private
router.put('/:id', updateNote);

// @route   DELETE /api/notes/:id
// @desc    Delete a note
// @access  Private
router.delete('/:id', deleteNote);

module.exports = router;
