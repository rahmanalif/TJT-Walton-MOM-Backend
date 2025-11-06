const express = require('express');
const router = express.Router();
const {
  createGroceryItem,
  getGroceryList,
  updateGroceryItem,
  deleteGroceryItem
} = require('../controllers/grocery.controller');
const { protect } = require('../middleware/auth.middleware');

router.route('/')
  .post(protect, createGroceryItem)
  .get(protect, getGroceryList);

router.route('/:id')
  .put(protect, updateGroceryItem)
  .delete(protect, deleteGroceryItem);

module.exports = router;