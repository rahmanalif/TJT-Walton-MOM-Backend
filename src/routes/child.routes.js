const express = require('express');
const router = express.Router();
const {
  createChild,
  getAllChildren,
  getFamilyMembers,
  deleteChild
} = require('../controllers/child.controller.js');
const { protect } = require('../middleware/auth.middleware');

// Protect all routes
router.use(protect);

// Routes
router.route('/')
  .post(createChild)    // POST /api/children - Create new child
  .get(getAllChildren);   // GET /api/children - Get all children for current user's family

router.route('/family-members')
  .get(getFamilyMembers);  // GET /api/children/family-members - Get all family members

router.route('/:id')
  .delete(deleteChild); // DELETE /api/children/:id - Delete a child

module.exports = router;
