const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { protect } = require('../middleware/auth.middleware');

// All message routes require authentication
router.use(protect);

// Send a message
router.post('/send', messageController.sendMessage);

// Get inbox messages
router.get('/inbox', messageController.getInbox);

// Get sent messages
router.get('/sent', messageController.getSentMessages);

// Get unread message count
router.get('/unread/count', messageController.getUnreadCount);

// Get family members available for messaging
router.get('/family-members', messageController.getFamilyMembers);

// Get conversation with a specific user
router.get('/conversation/:userId', messageController.getConversation);

// Mark a message as read
router.put('/:messageId/read', messageController.markAsRead);

// Delete a message (soft delete)
router.delete('/:messageId', messageController.deleteMessage);

module.exports = router;
