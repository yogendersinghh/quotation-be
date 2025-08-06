const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productImage: {
    type: String,
    required: false
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: false
  },
  make: {
    type: String,
    required: false
  },
  quality: {
    type: String,
    enum: ['economy', 'standard', 'premium', 'super premium'],
    required: false
  },
  dataSheet: {
    type: String,
    trim: true,
    required: false
  },
  catalog: {
    type: String,
    trim: true,
    required: false
  },
  type: {
    type: String,
    trim: true,
    required: false
  },
  features: [{
    type: String,
    trim: true
  }],
  price: {
    type: Number,
    required: false,
    min: 0
  },
  warranty: {
    type: String,
    required: false
  },
  specification: {
    type: String,
    trim: true,
    required: false
  },
  termsAndCondition: {
    type: String,
    trim: true,
    required: false
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  }],
  notes: {
    type: String,
    trim: true,
    required: false
  },
  description: {
    type: String,
    trim: true,
    required: false
  }
}, {
  timestamps: true
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product; 