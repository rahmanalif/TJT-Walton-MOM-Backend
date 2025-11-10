const Grocery = require('../models/Grocery.model');
const Meal = require('../models/Meal.model');

// @desc    Create a new grocery item
// @route   POST /api/groceries
// @access  Private
exports.createGroceryItem = async (req, res) => {
  try {
    const { itemName, quantity, category } = req.body;

    const groceryItem = await Grocery.create({
      itemName,
      quantity,
      category,
      createdBy: req.parent.id
    });

    res.status(201).json({
      success: true,
      data: groceryItem
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
      message: 'Error creating grocery item',
      error: error.message
    });
  }
};

// @desc    Get all grocery items
// @route   GET /api/groceries
// @access  Private
exports.getGroceryList = async (req, res) => {
  try {
    const groceryList = await Grocery.find({ createdBy: req.parent.id });

    res.status(200).json({
      success: true,
      count: groceryList.length,
      data: groceryList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching grocery list',
      error: error.message
    });
  }
};

// @desc    Update a grocery item
// @route   PUT /api/groceries/:id
// @access  Private
exports.updateGroceryItem = async (req, res) => {
  try {
    let groceryItem = await Grocery.findById(req.params.id);

    if (!groceryItem) {
      return res.status(404).json({
        success: false,
        message: `Grocery item not found with id of ${req.params.id}`
      });
    }

    // Ensure parent owns the grocery item
    if (groceryItem.createdBy.toString() !== req.parent.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this grocery item'
      });
    }

    groceryItem = await Grocery.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: groceryItem
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
        message: `Grocery item not found with id of ${req.params.id}`
      });
    }
    res.status(400).json({
      success: false,
      message: 'Error updating grocery item',
      error: error.message
    });
  }
};

// @desc    Delete a grocery item
// @route   DELETE /api/groceries/:id
// @access  Private
exports.deleteGroceryItem = async (req, res) => {
  try {
    const groceryItem = await Grocery.findById(req.params.id);

    if (!groceryItem) {
      return res.status(404).json({
        success: false,
        message: `Grocery item not found with id of ${req.params.id}`
      });
    }

    // Ensure parent owns the grocery item
    if (groceryItem.createdBy.toString() !== req.parent.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this grocery item'
      });
    }

    await groceryItem.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Grocery item deleted successfully'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: `Grocery item not found with id of ${req.params.id}`
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error deleting grocery item',
      error: error.message
    });
  }
};

// @desc    Add ingredients from a meal to the grocery list
// @route   POST /api/meals/:id/add-to-grocery-list
// @access  Private
exports.addIngredientsToGroceryList = async (req, res) => {
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
        message: 'Not authorized to add ingredients from this meal'
      });
    }

    const ingredients = meal.ingredients.split(',').map(item => item.trim());

    const groceryItems = ingredients.map(item => ({
      itemName: item,
      createdBy: req.parent.id,
      meal: meal._id
    }));

    await Grocery.insertMany(groceryItems);

    res.status(201).json({
      success: true,
      message: 'Ingredients added to grocery list'
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
      message: 'Error adding ingredients to grocery list',
      error: error.message
    });
  }
};