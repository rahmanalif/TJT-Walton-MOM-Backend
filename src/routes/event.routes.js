const express = require('express');
const router = express.Router();
const {
  createEvent,
  getAllEvents,
  getEventsByDateRange,
  getEventById,
  updateEvent,
  deleteEvent,
  getFamilyMembers
} = require('../controllers/event.controller');
const { protect } = require('../middleware/auth.middleware');

// Protect all routes
router.use(protect);

// Routes
router.route('/')
  .post(createEvent)    // POST /api/events - Create new event
  .get(getAllEvents);   // GET /api/events - Get all events for current user

router.route('/range')
  .get(getEventsByDateRange);  // GET /api/events/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD

router.route('/family-members')
  .get(getFamilyMembers);  // GET /api/events/family-members - Get family members for assignment

router.route('/:id')
  .get(getEventById)    // GET /api/events/:id - Get single event
  .put(updateEvent)     // PUT /api/events/:id - Update event
  .delete(deleteEvent); // DELETE /api/events/:id - Delete event

module.exports = router;
