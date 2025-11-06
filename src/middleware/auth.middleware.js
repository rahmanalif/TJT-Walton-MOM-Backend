const jwt = require('jsonwebtoken');
const Parent = require('../models/Parent.model');

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

      // Get parent from token (exclude password)
      req.parent = await Parent.findById(decoded.id);

      if (!req.parent) {
        return res.status(401).json({
          success: false,
          message: 'Parent not found. Token invalid'
        });
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
    if (!roles.includes(req.parent.role)) {
      return res.status(403).json({
        success: false,
        message: `Parent role '${req.parent.role}' is not authorized to access this resource`
      });
    }
    next();
  };
};
