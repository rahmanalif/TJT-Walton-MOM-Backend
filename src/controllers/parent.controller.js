const Parent = require('../models/Parent.model');

// @desc    Get all parents
// @route   GET /api/parents
// @access  Public
exports.getAllParents = async (req, res) => {
  try {
    const parents = await Parent.find().select('-password');
    res.status(200).json({
      success: true,
      count: parents.length,
      data: parents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching parents',
      error: error.message
    });
  }
};

// @desc    Get single parent
// @route   GET /api/parents/:id
// @access  Public
exports.getParentById = async (req, res) => {
  try {
    const parent = await Parent.findById(req.params.id).select('-password');

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
      });
    }

    res.status(200).json({
      success: true,
      data: parent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching parent',
      error: error.message
    });
  }
};

// @desc    Create new parent
// @route   POST /api/parents
// @access  Public
exports.createParent = async (req, res) => {
  try {
    const parent = await Parent.create(req.body);

    res.status(201).json({
      success: true,
      data: parent
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating parent',
      error: error.message
    });
  }
};

// @desc    Update parent
// @route   PUT /api/parents/:id
// @access  Public
exports.updateParent = async (req, res) => {
  try {
    const parent = await Parent.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
      });
    }

    res.status(200).json({
      success: true,
      data: parent
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating parent',
      error: error.message
    });
  }
};

// @desc    Delete parent
// @route   DELETE /api/parents/:id
// @access  Public
exports.deleteParent = async (req, res) => {
  try {
    const parent = await Parent.findByIdAndDelete(req.params.id);

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Parent deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting parent',
      error: error.message
    });
  }
};