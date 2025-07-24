const express = require('express');
const router = express.Router();
const { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct } = require('../controllers/productController');
const { auth, isAdmin } = require('../middleware/auth');
const pagination = require('../middleware/pagination');

// Create product (admin only)
router.post('/', auth, isAdmin, createProduct);

// Get all products
router.get('/', pagination, getAllProducts);

// Get product by ID
router.get('/:id', getProductById);

// Update product (admin only)
router.post('/:id', auth, isAdmin, updateProduct);

// Delete product (admin only)
router.post('/:id/delete', auth, isAdmin, deleteProduct);

module.exports = router; 