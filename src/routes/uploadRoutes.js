const express = require('express');
const router = express.Router();
const { uploadImage, uploadSignature, handleUploadError, uploadDataSheetOrCatalog,upload } = require('../controllers/uploadController');
const { auth, isAdmin } = require('../middleware/auth');
const uploadSignatureMiddleware = require('../middleware/signatureUpload');
const multer = require('multer');
const path = require('path');
const fs = require("fs")

// Dynamic storage destination based on 'type' in the request body
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const type = req.query.type;
    let folder;
    if (type === 'datasheet') folder = 'public/datasheet';
    else if (type === 'catalog') folder = 'public/catalog';
    if (folder) {
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
      }
    }
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const sheetUpload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB in bytes
  }
});

// Upload product image (admin only)
router.post('/product-image', auth, isAdmin, upload.single('image'), uploadImage);

// Upload signature (authenticated users)
router.post('/signature', auth, uploadSignatureMiddleware.single('signature'), uploadSignature);

// Route for uploading data sheet or catalog
router.post('/datasheet-or-catalog', sheetUpload.single('file'), handleUploadError, uploadDataSheetOrCatalog);

// Error handling middleware
router.use(handleUploadError);

module.exports = router; 