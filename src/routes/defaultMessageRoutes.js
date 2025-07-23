const express = require('express');
const router = express.Router();
const defaultMessageController = require('../controllers/defaultMessageController');

// Create

// Get All
router.get('/', defaultMessageController.getAllDefaultMessages);

router.post('/', defaultMessageController.createDefaultMessage);
// Update by ID
router.post('/:id', defaultMessageController.updateDefaultMessage);

module.exports = router; 