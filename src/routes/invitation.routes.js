const express = require('express');
const router = express.Router();
const {
  sendInvitation,
  getSentInvitations,
  getReceivedInvitations,
  getInvitationByToken,
  acceptInvitation,
  declineInvitation,
  cancelInvitation
} = require('../controllers/invitation.controller');
const { protect } = require('../middleware/auth.middleware');

// Public routes (no authentication required)
router.get('/token/:token', getInvitationByToken);
router.post('/accept/:token', acceptInvitation);
router.post('/decline/:token', declineInvitation);

// Protected routes (require authentication)
router.post('/send', protect, sendInvitation);
router.get('/sent', protect, getSentInvitations);
router.get('/received', protect, getReceivedInvitations);
router.delete('/:id', protect, cancelInvitation);

module.exports = router;
