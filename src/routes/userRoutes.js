const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getAllUsers, 
  updateUser, 
  deleteUser 
} = require('../controllers/userController');
const { auth, isAdmin } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');
const pagination = require('../middleware/pagination');

// Public routes
router.post('/register', auth, isAdmin, registerUser);
router.post('/login', loginUser);

// Protected routes
router.get('/', auth, checkRole(['admin', 'manager']), pagination, getAllUsers);

// Admin only routes
router.post('/:id', auth, isAdmin, updateUser);
router.delete('/:id', auth, isAdmin, deleteUser);

module.exports = router; 