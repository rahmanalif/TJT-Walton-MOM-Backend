const jwt = require('jsonwebtoken');
const Parent = require('../models/Parent.model');
const Teen = require('../models/Teen.model');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Extract token from "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please login to access this resource'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check for parent
      let user = await Parent.findById(decoded.id);
      let role = 'parent';

      // If not a parent, check for teen
      if (!user) {
        user = await Teen.findById(decoded.id);
        role = 'teen';
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Token invalid'
        });
      }

      req.user = user;
      req.user.role = role;
      // for backward compatibility
      if (role === 'parent') {
        req.parent = user;
      } else {
        req.teen = user;
      }


      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid or has expired'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    });
  }
};

// Authorize specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this resource`
      });
    }
    next();
  };
};
