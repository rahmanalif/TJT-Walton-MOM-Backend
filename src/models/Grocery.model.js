const mongoose = require('mongoose');

const grocerySchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: [true, 'Please provide an item name'],
    trim: true
  },
  quantity: {
    type: String
  },
  category: {
    type: String,
    enum: ['Produce', 'Meat', 'Dairy', 'Pantry', 'Frozen', 'Other'],
    default: 'Other'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',
    required: true
  },
  meal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meal'
  }
}, {
  timestamps: true
});

const Grocery = mongoose.model('Grocery', grocerySchema);

module.exports = Grocery;