const express = require('express');
const router = express.Router();
const { 
  createQuotation, 
  getAllQuotations, 
  getAllQuotationsForAdmin,
  getQuotationById, 
  updateQuotation, 
  deleteQuotation,
  updateQuotationStatus
} = require('../controllers/quotationController');
const { auth } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');
const pagination = require('../middleware/pagination');
const uploadSignature = require('../middleware/signatureUpload');

// All routes require authentication
router.use(auth);

// Upload signature
router.post('/upload-signature', uploadSignature.single('signature'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No signature file uploaded' });
  }
  res.json({
    message: 'Signature uploaded successfully',
    signaturePath: req.file.path,
    filename: req.file.filename
  });
});

// Admin-only routes
router.get('/admin/all', checkRole(['admin']), pagination, getAllQuotationsForAdmin);
router.patch('/admin/:id/status', checkRole(['admin']), updateQuotationStatus);
// User routes (admin and manager)
router.use(checkRole(['admin', 'manager']));

// Quotation routes
router.get('/', pagination, getAllQuotations);
router.post('/', createQuotation);
router.get('/:id', getQuotationById);
router.put('/:id', updateQuotation);
router.delete('/:id', deleteQuotation);

module.exports = router; 