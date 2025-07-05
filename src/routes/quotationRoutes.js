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

// All routes require authentication
router.use(auth);

// Admin-only routes
router.get('/admin/all', checkRole(['admin']), pagination, getAllQuotationsForAdmin);
router.patch('/admin/:id/status', checkRole(['admin']), updateQuotationStatus);
// User routes (admin and manager)
router.use(checkRole(['admin', 'manager']));

// Quotation routes
router.post('/', createQuotation);
router.get('/', pagination, getAllQuotations);
router.get('/:id', getQuotationById);
router.put('/:id', updateQuotation);
router.delete('/:id', deleteQuotation);

module.exports = router; 