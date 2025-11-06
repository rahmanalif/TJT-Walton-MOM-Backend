const Parent = require('../models/Parent.model');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (parentId) => {
  return jwt.sign(
    { id: parentId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 7 days
  );
};

// @desc    Register/Signup new parent
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res) => {
  try {
    const { firstname, lastname, familyname, email, password } = req.body;

    // Check if parent already exists
    const existingParent = await Parent.findOne({ email });
    if (existingParent) {
      return res.status(400).json({
        success: false,
        message: 'Parent with this email already exists'
      });
    }

    // Create new parent
    const parent = await Parent.create({
      firstname,
      lastname,
      familyname,
      email,
      password
    });

    // Generate token
    const token = generateToken(parent._id);

    // Return parent data (without password) and token
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        parent: {
          id: parent._id,
          firstname: parent.firstname,
          lastname: parent.lastname,
          familyname: parent.familyname,
          email: parent.email,
          role: parent.role,
          createdAt: parent.createdAt
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

    res.status(500).json({
      success: false,
      message: 'Error creating account',
      error: error.message
    });
  }
};

// @desc    Login/Signin parent
// @route   POST /api/auth/signin
// @access  Public
exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find parent by email (include password since it's select: false in model)
    const parent = await Parent.findOne({ email }).select('+password');

    if (!parent) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if password matches
    const isPasswordCorrect = await parent.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(parent._id);

    // Return parent data (without password) and token
    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        parent: {
          id: parent._id,
          firstname: parent.firstname,
          lastname: parent.lastname,
          familyname: parent.familyname,
          email: parent.email,
          role: parent.role
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// @desc    Get current logged in parent
// @route   GET /api/auth/me
// @access  Private (requires token)
exports.getMe = async (req, res) => {
  try {
    // req.parent is set by the auth middleware
    const parent = await Parent.findById(req.parent.id);

    res.status(200).json({
      success: true,
      data: {
        id: parent._id,
        firstname: parent.firstname,
        lastname: parent.lastname,
        familyname: parent.familyname,
        email: parent.email,
        role: parent.role,
        createdAt: parent.createdAt,
        updatedAt: parent.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching parent data',
      error: error.message
    });
  }
};
