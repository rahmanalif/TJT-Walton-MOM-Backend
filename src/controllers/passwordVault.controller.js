const PasswordVault = require('../models/PasswordVault.model');
const Parent = require('../models/Parent.model');
const Teen = require('../models/Teen.model');
const Child = require('../models/Child.model');

// @desc    Create new password vault entry
// @route   POST /api/password-vault
// @access  Private (Parents only)
exports.createPasswordEntry = async (req, res) => {
  try {
    const {
      title,
      category,
      websiteLink,
      username,
      email,
      password,
      notes,
      isFavorite,
      sharedWith,
      sharedWithAll
    } = req.body;

    // Ensure only parents can create password entries
    if (req.parent.role !== 'parent' && req.parent.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only parents can create password vault entries'
      });
    }

    // Prepare password entry data
    // We no longer use `familyname` to determine membership. Access is controlled
    // by explicit sharedWith array and linked familyMembers on Parent.
    const passwordData = {
      title,
      category,
      websiteLink,
      username,
      email,
      password,
      notes,
      isFavorite: isFavorite || false,
      createdBy: req.parent.id,
      // familyname: req.parent.familyname, // intentionally omitted
      sharedWithAll: sharedWithAll || false
    };

    // Handle shared with family members
    if (sharedWith && Array.isArray(sharedWith) && !sharedWithAll) {
      passwordData.sharedWith = sharedWith;
    } else {
      passwordData.sharedWith = [];
    }

    // If sharedWithAll is true, get all family members (Parents, Teens, and Children)
    if (sharedWithAll) {
      const current = await Parent.findById(req.parent._id)
        .populate('familyMembers', '_id')
        .populate('teenAccounts', '_id');

      const allIds = [];

      // Add current parent
      allIds.push(current._id);

      // Add linked parent family members
      if (current.familyMembers && current.familyMembers.length > 0) {
        allIds.push(...current.familyMembers.map(m => m._id));
      }

      // Add teen accounts
      if (current.teenAccounts && current.teenAccounts.length > 0) {
        allIds.push(...current.teenAccounts.map(t => t._id));
      }

      // Get all parent IDs for teen lookup
      const allParentIds = [current._id, ...(current.familyMembers || []).map(m => m._id)];

      // Add teens from other linked parents
      const additionalTeens = await Teen.find({
        parent: { $in: allParentIds },
        _id: { $nin: (current.teenAccounts || []).map(t => t._id) }
      }).select('_id');

      if (additionalTeens.length > 0) {
        allIds.push(...additionalTeens.map(t => t._id));
      }

      // Add child profiles
      const childProfiles = await Child.find({
        family: { $in: allParentIds }
      }).select('_id');

      if (childProfiles.length > 0) {
        allIds.push(...childProfiles.map(c => c._id));
      }

      passwordData.sharedWith = allIds;
    }

    const passwordEntry = await PasswordVault.create(passwordData);

    // Populate creator
    await passwordEntry.populate('createdBy', 'firstname lastname email avatar');

    res.status(201).json({
      success: true,
      message: 'Password entry created successfully',
      data: passwordEntry
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

// @desc    Get all password entries for current user
// @route   GET /api/password-vault
// @access  Private
exports.getAllPasswordEntries = async (req, res) => {
  try {
    // Get password entries created by user OR shared with user
    const passwordEntries = await PasswordVault.find({
      $or: [
        { createdBy: req.parent.id },
        { sharedWith: req.parent.id }
      ]
    })
      .populate('createdBy', 'firstname lastname email avatar')
      .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json({
      success: true,
      count: passwordEntries.length,
      data: passwordEntries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get favorite password entries
// @route   GET /api/password-vault/favorites
// @access  Private
exports.getFavoritePasswordEntries = async (req, res) => {
  try {
    const passwordEntries = await PasswordVault.find({
      $or: [
        { createdBy: req.parent.id },
        { sharedWith: req.parent.id }
      ],
      isFavorite: true
    })
      .populate('createdBy', 'firstname lastname email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: passwordEntries.length,
      data: passwordEntries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get password entries by category
// @route   GET /api/password-vault/category/:category
// @access  Private
exports.getPasswordEntriesByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const passwordEntries = await PasswordVault.find({
      $or: [
        { createdBy: req.parent.id },
        { sharedWith: req.parent.id }
      ],
      category: category.toLowerCase()
    })
      .populate('createdBy', 'firstname lastname email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: passwordEntries.length,
      data: passwordEntries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get single password entry by ID
// @route   GET /api/password-vault/:id
// @access  Private
exports.getPasswordEntryById = async (req, res) => {
  try {
    const passwordEntry = await PasswordVault.findById(req.params.id)
      .populate('createdBy', 'firstname lastname email avatar');

    if (!passwordEntry) {
      return res.status(404).json({
        success: false,
        message: 'Password entry not found'
      });
    }

    // Check if user has access to this entry (creator or shared member)
    const isCreator = passwordEntry.createdBy._id.toString() === req.parent.id;
    const isShared = passwordEntry.sharedWith.some(
      memberId => memberId.toString() === req.parent.id
    );

    if (!isCreator && !isShared) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this password entry'
      });
    }

    res.status(200).json({
      success: true,
      data: passwordEntry
    });
  } catch (error) {
    // Handle invalid MongoDB ID
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Password entry not found'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update password entry
// @route   PUT /api/password-vault/:id
// @access  Private (Creator only)
exports.updatePasswordEntry = async (req, res) => {
  try {
    let passwordEntry = await PasswordVault.findById(req.params.id);

    if (!passwordEntry) {
      return res.status(404).json({
        success: false,
        message: 'Password entry not found'
      });
    }

    // Check if user is the creator
    if (passwordEntry.createdBy.toString() !== req.parent.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this password entry'
      });
    }

    const {
      title,
      category,
      websiteLink,
      username,
      email,
      password,
      notes,
      isFavorite,
      sharedWith,
      sharedWithAll
    } = req.body;

    // Prepare update data
    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (category !== undefined) updateData.category = category;
    if (websiteLink !== undefined) updateData.websiteLink = websiteLink;
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (password !== undefined) updateData.password = password;
    if (notes !== undefined) updateData.notes = notes;
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite;
    if (sharedWithAll !== undefined) updateData.sharedWithAll = sharedWithAll;

    // Handle shared with family members update
    if (sharedWith !== undefined && Array.isArray(sharedWith) && !sharedWithAll) {
      updateData.sharedWith = sharedWith;
    }

    // If sharedWithAll is true, get all family member ids (Parents, Teens, and Children)
    if (sharedWithAll) {
      const current = await Parent.findById(req.parent._id)
        .populate('familyMembers', '_id')
        .populate('teenAccounts', '_id');

      const allIds = [];

      // Add current parent
      allIds.push(current._id);

      // Add linked parent family members
      if (current.familyMembers && current.familyMembers.length > 0) {
        allIds.push(...current.familyMembers.map(m => m._id));
      }

      // Add teen accounts
      if (current.teenAccounts && current.teenAccounts.length > 0) {
        allIds.push(...current.teenAccounts.map(t => t._id));
      }

      // Get all parent IDs for teen lookup
      const allParentIds = [current._id, ...(current.familyMembers || []).map(m => m._id)];

      // Add teens from other linked parents
      const additionalTeens = await Teen.find({
        parent: { $in: allParentIds },
        _id: { $nin: (current.teenAccounts || []).map(t => t._id) }
      }).select('_id');

      if (additionalTeens.length > 0) {
        allIds.push(...additionalTeens.map(t => t._id));
      }

      // Add child profiles
      const childProfiles = await Child.find({
        family: { $in: allParentIds }
      }).select('_id');

      if (childProfiles.length > 0) {
        allIds.push(...childProfiles.map(c => c._id));
      }

      updateData.sharedWith = allIds;
    }

    passwordEntry = await PasswordVault.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    )
      .populate('createdBy', 'firstname lastname email avatar');

    res.status(200).json({
      success: true,
      message: 'Password entry updated successfully',
      data: passwordEntry
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

    // Handle invalid MongoDB ID
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Password entry not found'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Toggle favorite status
// @route   PATCH /api/password-vault/:id/favorite
// @access  Private
exports.toggleFavorite = async (req, res) => {
  try {
    const passwordEntry = await PasswordVault.findById(req.params.id);

    if (!passwordEntry) {
      return res.status(404).json({
        success: false,
        message: 'Password entry not found'
      });
    }

    // Check if user has access (creator or shared member)
    const isCreator = passwordEntry.createdBy.toString() === req.parent.id;
    const isShared = passwordEntry.sharedWith.some(
      memberId => memberId.toString() === req.parent.id
    );

    if (!isCreator && !isShared) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this password entry'
      });
    }

    // Only creator can toggle favorite
    if (!isCreator) {
      return res.status(401).json({
        success: false,
        message: 'Only the creator can mark entries as favorite'
      });
    }

    passwordEntry.isFavorite = !passwordEntry.isFavorite;
    await passwordEntry.save();

    await passwordEntry.populate('createdBy', 'firstname lastname email avatar');

    res.status(200).json({
      success: true,
      message: `Password entry ${passwordEntry.isFavorite ? 'added to' : 'removed from'} favorites`,
      data: passwordEntry
    });
  } catch (error) {
    // Handle invalid MongoDB ID
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Password entry not found'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete password entry
// @route   DELETE /api/password-vault/:id
// @access  Private (Creator only)
exports.deletePasswordEntry = async (req, res) => {
  try {
    const passwordEntry = await PasswordVault.findById(req.params.id);

    if (!passwordEntry) {
      return res.status(404).json({
        success: false,
        message: 'Password entry not found'
      });
    }

    // Check if user is the creator
    if (passwordEntry.createdBy.toString() !== req.parent.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this password entry'
      });
    }

    await PasswordVault.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Password entry deleted successfully',
      data: {}
    });
  } catch (error) {
    // Handle invalid MongoDB ID
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Password entry not found'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get family members for sharing
// @route   GET /api/password-vault/family-members
// @access  Private
exports.getFamilyMembers = async (req, res) => {
  try {
    // Use linked family members (merged/invited) rather than matching on family name
    const user = await Parent.findById(req.parent._id)
      .populate('familyMembers', 'firstname lastname email avatar role')
      .populate('teenAccounts', 'firstname lastname email avatar accountRole');

    // Start with the current user
    const members = [
      {
        _id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        avatar: user.avatar,
        role: user.role || 'parent',
        type: 'parent'
      }
    ];

    // Add other parent family members
    if (user.familyMembers && user.familyMembers.length > 0) {
      const parentMembers = user.familyMembers.map(member => ({
        _id: member._id,
        firstname: member.firstname,
        lastname: member.lastname,
        email: member.email,
        avatar: member.avatar,
        role: member.role || 'parent',
        type: 'parent'
      }));
      members.push(...parentMembers);
    }

    // Add teen/child/young-adult accounts
    if (user.teenAccounts && user.teenAccounts.length > 0) {
      const teenMembers = user.teenAccounts.map(teen => ({
        _id: teen._id,
        firstname: teen.firstname,
        lastname: teen.lastname,
        email: teen.email,
        avatar: teen.avatar,
        role: teen.accountRole,
        type: 'teen'
      }));
      members.push(...teenMembers);
    }

    // Also get teen accounts from other linked family members
    const allParentIds = [user._id, ...(user.familyMembers || []).map(m => m._id)];
    const additionalTeens = await Teen.find({
      parent: { $in: allParentIds },
      _id: { $nin: (user.teenAccounts || []).map(t => t._id) }
    }).select('firstname lastname email avatar accountRole');

    if (additionalTeens.length > 0) {
      const additionalTeenMembers = additionalTeens.map(teen => ({
        _id: teen._id,
        firstname: teen.firstname,
        lastname: teen.lastname,
        email: teen.email,
        avatar: teen.avatar,
        role: teen.accountRole,
        type: 'teen'
      }));
      members.push(...additionalTeenMembers);
    }

    // Get child profiles (non-account family members)
    const childProfiles = await Child.find({
      family: { $in: allParentIds }
    }).select('name email phoneNumber role colorCode');

    if (childProfiles.length > 0) {
      const childMembers = childProfiles.map(child => ({
        _id: child._id,
        firstname: child.name,
        lastname: '',
        email: child.email,
        avatar: null,
        role: child.role,
        type: 'child-profile'
      }));
      members.push(...childMembers);
    }

    res.status(200).json({
      success: true,
      count: members.length,
      data: members
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
