const express = require('express');
const router = express.Router();
const { uploadImage, handleUploadError, upload } = require('../controllers/uploadController');
const { auth, isAdmin } = require('../middleware/auth');

// Upload product image (admin only)
router.post('/product-image', auth, isAdmin, upload.single('image'), uploadImage);

// Error handling middleware
router.use(handleUploadError);

module.exports = router; 