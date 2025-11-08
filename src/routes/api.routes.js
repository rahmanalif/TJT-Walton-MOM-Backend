const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const parentRoutes = require('./parent.routes');
const outfitRoutes = require('./outfit.routes');
const taskRoutes = require('./task.routes');
const mealRoutes = require('./meal.routes');
const groceryRoutes = require('./grocery.routes');
const noteRoutes = require('./note.routes');
const voiceRoutes = require('./voice.routes');
const eventRoutes = require('./event.routes');
const childRoutes = require('./child.routes');
const invitationRoutes = require('./invitation.routes');
const mergeRequestRoutes = require('./mergeRequest.routes');
const passwordVaultRoutes = require('./passwordVault.routes');
const settingsRoutes = require('./settings.routes');
const teenInvitationRoutes = require('./teenInvitation.routes');
const teenAuthRoutes = require('./teenAuth.routes');
const messageRoutes = require('./message.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/parents', parentRoutes);
router.use('/outfit', outfitRoutes);
router.use('/tasks', taskRoutes);
router.use('/meals', mealRoutes);
router.use('/groceries', groceryRoutes);
router.use('/notes', noteRoutes);
router.use('/voice', voiceRoutes);
router.use('/events', eventRoutes);
router.use('/children', childRoutes);
router.use('/invitations', invitationRoutes);
router.use('/merge-requests', mergeRequestRoutes);
router.use('/password-vault', passwordVaultRoutes);
router.use('/settings', settingsRoutes);
router.use('/teen-invitations', teenInvitationRoutes);
router.use('/teen-auth', teenAuthRoutes);
router.use('/messages', messageRoutes);

module.exports = router;
