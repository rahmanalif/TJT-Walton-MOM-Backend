const express = require('express');
const router = express.Router();
const {
  getTeens,
  getTeenById,
  updateTeen,
  deleteTeen
} = require('../controllers/teen.controller');
const { protect } = require('../middleware/auth.middleware');

router.route('/')
  .get(protect, getTeens);

router.route('/:id')
  .get(protect, getTeenById)
  .put(protect, updateTeen)
  .delete(protect, deleteTeen);

module.exports = router;
