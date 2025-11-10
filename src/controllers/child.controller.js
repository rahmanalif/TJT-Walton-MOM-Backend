// Endpoint: GET /api/children/family-members
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
      // NOTE: we intentionally do NOT rely on familyname for membership.
      // Children are linked to a parent via the `family` reference (ObjectId).
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
  // Allowed parent ids are the current parent plus any merged family members
  const allowedParentIds = [req.parent._id, ...(req.parent.familyMembers || [])].map(id => id.toString());

  // Find children whose `family` field is one of the allowed parent ids
  const children = await Child.find({ family: { $in: allowedParentIds } });

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
    // Get current parent document with familyMembers and teenAccounts
    const current = await Parent.findById(req.parent._id)
      .populate('familyMembers', 'firstname lastname email avatar role')
      .populate('teenAccounts', 'firstname lastname email avatar accountRole');

    // Build allowed parent id list (self + merged parents)
    const parentIds = [current._id, ...(current.familyMembers || [])].map(p => p._id ? p._id.toString() : p.toString());

    // Get children whose `family` reference points to any of these parents
    const childrenList = await Child.find({ family: { $in: parentIds } }).select('name role colorCode');

    // Combine parents and children into a single flat list for the API
    const parents = current.familyMembers.map(p => ({
      id: p._id,
      firstname: p.firstname,
      lastname: p.lastname,
      email: p.email,
      avatar: p.avatar,
      role: p.role || 'parent'
    }));

    const familyMembers = [
      // include current parent as well
      {
        id: current._id,
        firstname: current.firstname,
        lastname: current.lastname,
        email: current.email,
        avatar: current.avatar,
        role: current.role || 'parent'
      },
      ...parents,
      ...childrenList.map(c => ({
        id: c._id,
        name: c.name,
        role: c.role,
        colorCode: c.colorCode,
        type: 'Child'
      }))
    ];

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

    // Ensure the requesting parent is associated with this child.
    // A child belongs to a parent via the `family` reference, or (for merged families)
    // may include multiple parents in an array stored on the child as `parent`.
    const allowedParentIdsToCheck = [req.parent._id, ...(req.parent.familyMembers || [])].map(id => id.toString());

    let isAuthorized = false;
    if (child.family && allowedParentIdsToCheck.includes(child.family.toString())) {
      isAuthorized = true;
    }

    // Support legacy/merged schema where `child.parent` can be an array of parent ids
    if (!isAuthorized && child.parent) {
      if (Array.isArray(child.parent)) {
        isAuthorized = child.parent.some(p => allowedParentIdsToCheck.includes(p.toString()));
      } else {
        isAuthorized = allowedParentIdsToCheck.includes(child.parent.toString());
      }
    }

    if (!isAuthorized) {
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
