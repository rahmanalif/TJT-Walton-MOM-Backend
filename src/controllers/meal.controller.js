const Meal = require('../models/Meal.model');

// @desc    Create a new meal
// @route   POST /api/meals
// @access  Private
exports.createMeal = async (req, res) => {
  try {
    const { day, mealType, mealName, ingredients, notes } = req.body;

    const meal = await Meal.create({
      day,
      mealType,
      mealName,
      ingredients,
      notes,
      createdBy: req.parent.id
    });

    res.status(201).json({
      success: true,
      data: meal
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    res.status(400).json({
      success: false,
      message: 'Error creating meal',
      error: error.message
    });
  }
};

// @desc    Get all meals
// @route   GET /api/meals
// @access  Private
exports.getMeals = async (req, res) => {
  try {
    const meals = await Meal.find({ createdBy: req.parent.id });

    res.status(200).json({
      success: true,
      count: meals.length,
      data: meals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching meals',
      error: error.message
    });
  }
};

// @desc    Get a single meal
// @route   GET /api/meals/:id
// @access  Private
exports.getMealById = async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: `Meal not found with id of ${req.params.id}`
      });
    }

    // Ensure parent owns the meal
    if (meal.createdBy.toString() !== req.parent.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to view this meal'
      });
    }

    res.status(200).json({
      success: true,
      data: meal
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: `Meal not found with id of ${req.params.id}`
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error fetching meal',
      error: error.message
    });
  }
};

// @desc    Update a meal
// @route   PUT /api/meals/:id
// @access  Private
exports.updateMeal = async (req, res) => {
  try {
    let meal = await Meal.findById(req.params.id);

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: `Meal not found with id of ${req.params.id}`
      });
    }

    // Ensure parent owns the meal
    if (meal.createdBy.toString() !== req.parent.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this meal'
      });
    }

    meal = await Meal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: meal
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: `Meal not found with id of ${req.params.id}`
      });
    }
    res.status(400).json({
      success: false,
      message: 'Error updating meal',
      error: error.message
    });
  }
};

// @desc    Delete a meal
// @route   DELETE /api/meals/:id
// @access  Private
exports.deleteMeal = async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: `Meal not found with id of ${req.params.id}`
      });
    }

    // Ensure parent owns the meal
    if (meal.createdBy.toString() !== req.parent.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this meal'
      });
    }

    await meal.remove();

    res.status(200).json({
      success: true,
      message: 'Meal deleted successfully'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: `Meal not found with id of ${req.params.id}`
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error deleting meal',
      error: error.message
    });
  }
};