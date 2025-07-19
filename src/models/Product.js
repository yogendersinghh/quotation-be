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
    type: String,
    required: true
  },
  make: {
    type: String,
    required: true
  },
  quality: {
    type: String,
    enum: ['economy', 'standard', 'premium', 'super premium'],
    required: true
  },
  dataSheet: {
    type: String,
    trim: true
  },
  catalog: {
    type: String,
    trim: true
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