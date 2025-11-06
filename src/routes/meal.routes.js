const express = require('express');
const router = express.Router();
const {
  createMeal,
  getMeals,
  getMealById,
  updateMeal,
  deleteMeal
} = require('../controllers/meal.controller');
const { addIngredientsToGroceryList } = require('../controllers/grocery.controller');
const { protect } = require('../middleware/auth.middleware');

router.route('/')
  .post(protect, createMeal)
  .get(protect, getMeals);

router.route('/:id')
  .get(protect, getMealById)
  .put(protect, updateMeal)
  .delete(protect, deleteMeal);

router.route('/:id/add-to-grocery-list')
  .post(protect, addIngredientsToGroceryList);

module.exports = router;