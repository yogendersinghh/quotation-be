const upload = require('../middleware/upload');

// Handle single image upload
const uploadImage = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return the filename
    res.json({
      message: 'File uploaded successfully',
      filename: req.file.filename,
      path: `/products/${req.file.filename}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Handle signature upload
const uploadSignature = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No signature file uploaded' });
    }
    res.json({
      message: 'Signature uploaded successfully',
      signaturePath: req.file.path,
      filename: req.file.filename
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size should be less than 5MB' });
    }
    return res.status(400).json({ error: error.message });
  }
  next(error);
};

module.exports = {
  uploadImage,
  uploadSignature,
  handleUploadError,
  upload
}; 