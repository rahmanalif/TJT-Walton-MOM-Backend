const express = require('express');
const router = express.Router();
const {
  signup,
  signin,
  getMe
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// Public routes
router.post('/signup', signup);
router.post('/signin', signin);

// Protected routes (require authentication)
router.get('/me', protect, getMe);

module.exports = router;
