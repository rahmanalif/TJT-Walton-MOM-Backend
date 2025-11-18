const Teen = require('../models/Teen.model');

// @desc    Get all teens
// @route   GET /api/teens
// @access  Private
exports.getTeens = async (req, res) => {
  try {
    const teens = await Teen.find({ parent: req.parent.id });

    res.status(200).json({
      success: true,
      count: teens.length,
      data: teens,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching teens",
      error: error.message,
    });
  }
};

// @desc    Get a single teen
// @route   GET /api/teens/:id
// @access  Private
exports.getTeenById = async (req, res) => {
  try {
    const teen = await Teen.findById(req.params.id);

    if (!teen) {
      return res.status(404).json({
        success: false,
        message: `Teen not found with id of ${req.params.id}`
      });
    }

    // Ensure parent owns the teen
    if (teen.parent.toString() !== req.parent.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to view this teen'
      });
    }

    res.status(200).json({
      success: true,
      data: teen
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: `Teen not found with id of ${req.params.id}`
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error fetching teen',
      error: error.message
    });
  }
};

// @desc    Update a teen
// @route   PUT /api/teens/:id
// @access  Private
exports.updateTeen = async (req, res) => {
  try {
    let teen = await Teen.findById(req.params.id);

    if (!teen) {
      return res.status(404).json({
        success: false,
        message: `Teen not found with id of ${req.params.id}`
      });
    }

    // Ensure parent owns the teen
    if (teen.parent.toString() !== req.parent.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this teen'
      });
    }

    teen = await Teen.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: teen
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
        message: `Teen not found with id of ${req.params.id}`
      });
    }
    res.status(400).json({
      success: false,
      message: 'Error updating teen',
      error: error.message
    });
  }
};

// @desc    Delete a teen
// @route   DELETE /api/teens/:id
// @access  Private
exports.deleteTeen = async (req, res) => {
  try {
    const teen = await Teen.findById(req.params.id);

    if (!teen) {
      return res.status(404).json({
        success: false,
        message: `Teen not found with id of ${req.params.id}`
      });
    }

    // Ensure parent owns the teen
    if (teen.parent.toString() !== req.parent.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this teen'
      });
    }

    await Teen.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Teen deleted successfully'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: `Teen not found with id of ${req.params.id}`
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error deleting teen',
      error: error.message
    });
  }
};
