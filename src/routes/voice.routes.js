const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { transcribeAudio, createTaskFromVoice, createNoteFromVoice } = require('../controllers/voice.controller');
const { protect } = require('../middleware/auth.middleware');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'voice-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept audio files only
  const allowedMimes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'audio/m4a',
    'audio/x-m4a',
    'audio/mp4'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only audio files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

// All routes require authentication
router.use(protect);

// @route   POST /api/voice/transcribe
// @desc    Transcribe audio to text
// @access  Private
router.post('/transcribe', upload.single('audio'), transcribeAudio);

// @route   POST /api/voice/create-task
// @desc    Transcribe audio and create a task
// @access  Private
router.post('/create-task', upload.single('audio'), createTaskFromVoice);

// @route   POST /api/voice/create-note
// @desc    Transcribe audio and create a note
// @access  Private
router.post('/create-note', upload.single('audio'), createNoteFromVoice);

module.exports = router;
