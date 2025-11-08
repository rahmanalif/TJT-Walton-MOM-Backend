const express = require('express');
const router = express.Router();
const {
  sendTeenInvitation,
  verifyInvitationCode,
  getSentInvitations,
  resendInvitation,
  cancelInvitation
} = require('../controllers/teenInvitation.controller');
const { protect } = require('../middleware/auth.middleware');

// Public routes
router.post('/verify', verifyInvitationCode);

// Protected routes (require parent authentication)
router.post('/send', protect, sendTeenInvitation);
router.get('/sent', protect, getSentInvitations);
router.post('/:id/resend', protect, resendInvitation);
router.delete('/:id', protect, cancelInvitation);

module.exports = router;
