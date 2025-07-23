const express = require('express');
const router = express.Router();
const { createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { auth, isAdmin } = require('../middleware/auth');

// Create category (admin only)
router.post('/', auth, isAdmin, createCategory);

// Get all categories
router.get('/', getAllCategories);

// Get category by ID
router.get('/:id', getCategoryById);
// Update category (admin only)
router.post('/:id', auth, isAdmin, updateCategory);

// Delete category (admin only)
router.delete('/:id', auth, isAdmin, deleteCategory);

module.exports = router; 