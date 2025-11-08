const Child = require('../models/Child.model');
const Parent = require('../models/Parent.model');
const { sendNotification } = require('../services/notification.service');

// @desc    Create new child
// @route   POST /api/children
// @access  Private
exports.createChild = async (req, res) => {
  try {
    const {
      name,
      role,
      phoneNumber,
      email,
      notificationPreference,
      colorCode
    } = req.body;

    const parent = req.parent;

    // Prepare child data
    const childData = {
      name,
      role,
      phoneNumber,
      email,
      notificationPreference,
      colorCode,
      family: parent.id,
      familyname: parent.familyname
    };

    const child = await Child.create(childData);

    // Send notification
    if (child.notificationPreference !== 'none') {
      await sendNotification({
        user: child,
        subject: 'Welcome to the family!',
        text: `Hi ${child.name}, you have been added to the ${parent.familyname} family.`,
        html: `<p>Hi ${child.name}, you have been added to the <strong>${parent.familyname}</strong> family.</p>`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Child created successfully',
      data: child
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get all children for current user's family
// @route   GET /api/children
// @access  Private
exports.getAllChildren = async (req, res) => {
  try {
    const children = await Child.find({ familyname: req.parent.familyname });

    res.status(200).json({
      success: true,
      count: children.length,
      data: children
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get all family members for current user's family
// @route   GET /api/children/family-members
// @access  Private
exports.getFamilyMembers = async (req, res) => {
  try {
    console.log("Fetching family members for family:", req.parent.familyname);

    // Get all parents with the same family name
    const parents = await Parent.find({
      familyname: req.parent.familyname
    }).select('firstname lastname email avatar role');

    console.log("Found parents:", parents);

    // Get all children with the same family name
    const children = await Child.find({
      familyname: req.parent.familyname
    }).select('name role colorCode');

    console.log("Found children:", children);

    const familyMembers = [...parents, ...children];
    console.log("Final family members list:", familyMembers);

    res.status(200).json({
      success: true,
      count: familyMembers.length,
      data: familyMembers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete a child
// @route   DELETE /api/children/:id
// @access  Private
exports.deleteChild = async (req, res) => {
  try {
    const child = await Child.findById(req.params.id);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Ensure parent is in the same family
    if (child.familyname !== req.parent.familyname) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this child'
      });
    }

    await child.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Child deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
