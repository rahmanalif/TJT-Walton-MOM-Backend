const express = require('express');
const router = express.Router();
const {
  registerTeen,
  loginTeen,
  getMe,
  updateProfile,
  changePassword
} = require('../controllers/teenAuth.controller');
const { protectTeen } = require('../middleware/teenAuth.middleware');

// Public routes
router.post('/register', registerTeen);
router.post('/login', loginTeen);

// Protected routes (require teen authentication)
router.get('/me', protectTeen, getMe);
router.put('/profile', protectTeen, updateProfile);
router.put('/change-password', protectTeen, changePassword);

module.exports = router;
