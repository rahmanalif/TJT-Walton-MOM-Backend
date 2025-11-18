const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  day: {
    type: String,
    required: [true, 'Please provide a day'],
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  mealType: {
    type: String,
    required: [true, 'Please provide a meal type'],
    enum: ['Breakfast', 'Lunch', 'Dinner', 'Snacks']
  },
  mealName: {
    type: String,
    required: [true, 'Please provide a meal name'],
    trim: true
  },
  ingredients: {
    type: String
  },
  notes: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',
    required: true
  }
}, {
  timestamps: true
});

const Meal = mongoose.model('Meal', mealSchema);

module.exports = Meal;

//