const Teen = require('../models/Teen.model');
const TeenInvitation = require('../models/TeenInvitation.model');
const Parent = require('../models/Parent.model');
const jwt = require('jsonwebtoken');

// Generate JWT Token for teen
const generateToken = (teenId) => {
  return jwt.sign(
    { id: teenId, type: 'teen' }, // Add type to distinguish from parent tokens
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// @desc    Register new teen account with invitation code
// @route   POST /api/teen-auth/register
// @access  Public
exports.registerTeen = async (req, res) => {
  try {
    const {
      verificationCode,
      email,
      phoneNumber,
      password,
      firstname,
      lastname,
      dateOfBirth
    } = req.body;

    // Validate required fields
    if (!verificationCode || !password || !firstname || !lastname || !dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: 'Please provide verification code, password, first name, last name, and date of birth'
      });
    }

    if (!email && !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either email or phone number'
      });
    }

    // Find invitation by code and contact info
    const query = {
      verificationCode,
      status: 'verified' // Must be verified first
    };
    if (email) query.email = email.toLowerCase();
    if (phoneNumber) query.phoneNumber = phoneNumber;

    const invitation = await TeenInvitation.findOne(query).populate('parent', 'familyname');

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or unverified invitation code. Please verify your code first.'
      });
    }

    // Check if invitation is expired
    if (invitation.isExpired()) {
      return res.status(400).json({
        success: false,
        message: 'This invitation has expired'
      });
    }

    // Check if already used
    if (invitation.status === 'used') {
      return res.status(400).json({
        success: false,
        message: 'This invitation has already been used'
      });
    }

    // Calculate age from date of birth
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // Validate age matches account role
    const { accountRole } = invitation;
    if (accountRole === 'child' && (age < 8 || age > 12)) {
      return res.status(400).json({
        success: false,
        message: 'Child account role requires age between 8-12'
      });
    }
    if (accountRole === 'teen' && (age < 13 || age > 17)) {
      return res.status(400).json({
        success: false,
        message: 'Teen account role requires age between 13-17'
      });
    }
    if (accountRole === 'young-adult' && (age < 18 || age > 25)) {
      return res.status(400).json({
        success: false,
        message: 'Young adult account role requires age between 18-25'
      });
    }

    // Check if teen already exists
    if (email) {
      const existingTeen = await Teen.findOne({ email: email.toLowerCase() });
      if (existingTeen) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists'
        });
      }
    }

    if (phoneNumber) {
      const existingTeen = await Teen.findOne({ phoneNumber });
      if (existingTeen) {
        return res.status(400).json({
          success: false,
          message: 'An account with this phone number already exists'
        });
      }
    }

    // Create teen account
    const teen = await Teen.create({
      firstname,
      lastname,
      email: email ? email.toLowerCase() : undefined,
      phoneNumber: phoneNumber || undefined,
      password,
      accountRole,
      age,
      dateOfBirth: birthDate,
      parent: invitation.parent._id,
      familyname: invitation.familyName
    });

    // Mark invitation as used
    invitation.status = 'used';
    invitation.teenAccount = teen._id;
    await invitation.save();

    // Add teen to parent's teenAccounts array
    const parent = await Parent.findById(invitation.parent._id);
    if (parent && !parent.teenAccounts.includes(teen._id)) {
      parent.teenAccounts.push(teen._id);
      await parent.save();
    }

    // Generate token
    const token = generateToken(teen._id);

    res.status(201).json({
      success: true,
      message: 'Teen account created successfully',
      data: {
        teen: {
          id: teen._id,
          firstname: teen.firstname,
          lastname: teen.lastname,
          email: teen.email,
          phoneNumber: teen.phoneNumber,
          accountRole: teen.accountRole,
          age: teen.age,
          familyname: teen.familyname,
          createdAt: teen.createdAt
        },
        token
      }
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    console.error('Error registering teen:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating teen account',
      error: error.message
    });
  }
};

// @desc    Login teen
// @route   POST /api/teen-auth/login
// @access  Public
exports.loginTeen = async (req, res) => {
  try {
    const { email, phoneNumber, password } = req.body;

    // Validate input
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a password'
      });
    }

    if (!email && !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either email or phone number'
      });
    }

    // Find teen by email or phone number
    const query = {};
    if (email) query.email = email.toLowerCase();
    if (phoneNumber) query.phoneNumber = phoneNumber;

    const teen = await Teen.findOne(query).select('+password');

    if (!teen) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!teen.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact your parent.'
      });
    }

    // Check if password matches
    const isPasswordCorrect = await teen.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    teen.lastLogin = new Date();
    await teen.save();

    // Generate token
    const token = generateToken(teen._id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        teen: {
          id: teen._id,
          firstname: teen.firstname,
          lastname: teen.lastname,
          email: teen.email,
          phoneNumber: teen.phoneNumber,
          accountRole: teen.accountRole,
          age: teen.age,
          familyname: teen.familyname,
          lastLogin: teen.lastLogin
        },
        token
      }
    });
  } catch (error) {
    console.error('Error logging in teen:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// @desc    Get current logged in teen
// @route   GET /api/teen-auth/me
// @access  Private (requires teen token)
exports.getMe = async (req, res) => {
  try {
    // req.teen is set by the auth middleware
    const teen = await Teen.findById(req.teen.id).populate('parent', 'firstname lastname familyname email');

    if (!teen) {
      return res.status(404).json({
        success: false,
        message: 'Teen not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: teen._id,
        firstname: teen.firstname,
        lastname: teen.lastname,
        email: teen.email,
        phoneNumber: teen.phoneNumber,
        accountRole: teen.accountRole,
        age: teen.age,
        dateOfBirth: teen.dateOfBirth,
        familyname: teen.familyname,
        parent: teen.parent,
        avatar: teen.avatar,
        displayName: teen.displayName,
        colorCode: teen.colorCode,
        isActive: teen.isActive,
        settings: teen.settings,
        lastLogin: teen.lastLogin,
        createdAt: teen.createdAt,
        updatedAt: teen.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching teen data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching teen data',
      error: error.message
    });
  }
};

// @desc    Update teen profile
// @route   PUT /api/teen-auth/profile
// @access  Private (requires teen token)
exports.updateProfile = async (req, res) => {
  try {
    const allowedUpdates = ['displayName', 'avatar', 'colorCode'];
    const updates = {};

    // Only allow specific fields to be updated
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const teen = await Teen.findByIdAndUpdate(
      req.teen.id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: teen
    });
  } catch (error) {
    console.error('Error updating teen profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// @desc    Change teen password
// @route   PUT /api/teen-auth/change-password
// @access  Private (requires teen token)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    const teen = await Teen.findById(req.teen.id).select('+password');

    // Verify current password
    const isPasswordCorrect = await teen.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    teen.password = newPassword;
    await teen.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
};
