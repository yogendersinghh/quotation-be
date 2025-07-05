const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productImage: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Model',
    required: true
  },
  type: {
    type: String,
    trim: true
  },
  features: [{
    type: String,
    trim: true
  }],
  price: {
    type: Number,
    required: true,
    min: 0
  },
  warranty: {
    type: String,
    required: true
  },
  quality: {
    type: String,
    trim: true
  },
  specification: {
    type: String,
    trim: true
  },
  termsAndCondition: {
    type: String,
    trim: true
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  }],
  notes: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product; 