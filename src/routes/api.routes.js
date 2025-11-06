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

// Mount routes
router.use('/auth', authRoutes);
router.use('/parents', parentRoutes);
router.use('/outfit', outfitRoutes);
router.use('/tasks', taskRoutes);
router.use('/meals', mealRoutes);
router.use('/groceries', groceryRoutes);
router.use('/notes', noteRoutes);
router.use('/voice', voiceRoutes);

module.exports = router;
