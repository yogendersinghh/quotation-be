const express = require('express');
const router = express.Router();
const defaultMessageController = require('../controllers/defaultMessageController');

// Create
router.post('/', defaultMessageController.createDefaultMessage);

// Get All
router.get('/', defaultMessageController.getAllDefaultMessages);

// Update by ID
router.put('/:id', defaultMessageController.updateDefaultMessage);

module.exports = router; 