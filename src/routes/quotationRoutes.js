const express = require('express');
const router = express.Router();
const { createQuotation, getAllQuotations, getQuotationById, updateQuotation, deleteQuotation } = require('../controllers/quotationController');
const { auth } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');
const pagination = require('../middleware/pagination');
const uploadSignature = require('../middleware/signatureUpload');

// All routes require authentication
router.use(auth);
router.use(checkRole(['admin', 'manager']));

// Upload signature
router.post('/upload-signature', uploadSignature.single('signature'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No signature file uploaded' });
  }
  res.json({
    message: 'Signature uploaded successfully',
    signaturePath: req.file.path
  });
});

// Quotation routes
router.post('/', createQuotation);
router.get('/', pagination, getAllQuotations);
router.get('/:id', getQuotationById);
router.put('/:id', updateQuotation);
router.delete('/:id', deleteQuotation);

module.exports = router; 