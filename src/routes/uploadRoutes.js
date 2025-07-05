const express = require('express');
const router = express.Router();
const { uploadImage, uploadSignature, handleUploadError, upload } = require('../controllers/uploadController');
const { auth, isAdmin } = require('../middleware/auth');
const uploadSignatureMiddleware = require('../middleware/signatureUpload');

// Upload product image (admin only)
router.post('/product-image', auth, isAdmin, upload.single('image'), uploadImage);

// Upload signature (authenticated users)
router.post('/signature', auth, uploadSignatureMiddleware.single('signature'), uploadSignature);

// Error handling middleware
router.use(handleUploadError);

module.exports = router; 