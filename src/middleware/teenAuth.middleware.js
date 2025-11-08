const jwt = require('jsonwebtoken');
const Teen = require('../models/Teen.model');

// Protect teen routes - verify JWT token for teens
exports.protectTeen = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please login.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if token is for a teen account
      if (decoded.type !== 'teen') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token type. Teen token required.'
        });
      }

      // Get teen from token
      const teen = await Teen.findById(decoded.id);

      if (!teen) {
        return res.status(401).json({
          success: false,
          message: 'Teen account not found'
        });
      }

      // Check if account is active
      if (!teen.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Your account has been deactivated. Please contact your parent.'
        });
      }

      // Attach teen to request object
      req.teen = teen;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid or has expired'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error authenticating teen',
      error: error.message
    });
  }
};

// Optional middleware to check if teen is of specific account role
exports.restrictToRole = (...roles) => {
  return (req, res, next) => {
    if (!req.teen) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (!roles.includes(req.teen.accountRole)) {
      return res.status(403).json({
        success: false,
        message: `This feature is only available for ${roles.join(', ')} accounts`
      });
    }

    next();
  };
};

// Middleware to verify teen belongs to specific parent
exports.verifyParentOwnership = async (req, res, next) => {
  try {
    if (!req.parent || !req.teen) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if the teen belongs to the parent
    if (req.teen.parent.toString() !== req.parent._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this teen account'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error verifying ownership',
      error: error.message
    });
  }
};
