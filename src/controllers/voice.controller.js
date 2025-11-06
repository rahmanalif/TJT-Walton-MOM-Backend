const { AssemblyAI } = require('assemblyai');
const fs = require('fs');
const Task = require('../models/Task.model');
const Note = require('../models/Note.model');

// Initialize AssemblyAI client
const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY
});

// @desc    Transcribe audio using AssemblyAI
// @route   POST /api/voice/transcribe
// @access  Private
exports.transcribeAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an audio file'
      });
    }

    // Upload the audio file to AssemblyAI
    const transcript = await client.transcripts.transcribe({
      audio: req.file.path
    });

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);

    if (transcript.status === 'error') {
      return res.status(500).json({
        success: false,
        message: 'Error transcribing audio',
        error: transcript.error
      });
    }

    res.status(200).json({
      success: true,
      data: {
        text: transcript.text
      }
    });
  } catch (error) {
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Transcription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error transcribing audio',
      error: error.message
    });
  }
};

// @desc    Create a task from transcribed audio
// @route   POST /api/voice/create-task
// @access  Private
exports.createTaskFromVoice = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an audio file'
      });
    }

    // Transcribe the audio using AssemblyAI
    const transcript = await client.transcripts.transcribe({
      audio: req.file.path
    });

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);

    if (transcript.status === 'error') {
      return res.status(500).json({
        success: false,
        message: 'Error transcribing audio',
        error: transcript.error
      });
    }

    // Extract additional task data from request body
    const { title, priority, assignedTo, points, dueDate, dueTime } = req.body;

    // Create task with transcribed text as description
    const task = await Task.create({
      title: title || 'Voice Task',
      description: transcript.text,
      priority: priority || 'Medium',
      assignedTo,
      points: points ? parseInt(points) : undefined,
      dueDate,
      dueTime,
      createdBy: req.parent.id
    });

    res.status(201).json({
      success: true,
      data: {
        task,
        transcription: transcript.text
      }
    });
  } catch (error) {
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Create task from voice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating task from voice',
      error: error.message
    });
  }
};

// @desc    Create a note from transcribed audio
// @route   POST /api/voice/create-note
// @access  Private
exports.createNoteFromVoice = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an audio file'
      });
    }

    // Transcribe the audio using AssemblyAI
    const transcript = await client.transcripts.transcribe({
      audio: req.file.path
    });

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);

    if (transcript.status === 'error') {
      return res.status(500).json({
        success: false,
        message: 'Error transcribing audio',
        error: transcript.error
      });
    }

    // Extract title from request body or generate from first few words
    const { title } = req.body;
    const autoTitle = transcript.text.split(' ').slice(0, 5).join(' ') + '...';

    // Create note with transcribed text
    const note = await Note.create({
      title: title || autoTitle,
      content: transcript.text,
      createdBy: req.parent.id,
      isVoiceNote: true
    });

    res.status(201).json({
      success: true,
      data: {
        note,
        transcription: transcript.text
      }
    });
  } catch (error) {
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Create note from voice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating note from voice',
      error: error.message
    });
  }
};
