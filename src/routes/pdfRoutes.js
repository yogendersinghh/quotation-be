const express = require('express');
const router = express.Router();
const {
    generateQuotationPDF,
    generateAndSavePDF,
    previewQuotation
} = require('../controllers/pdfController');

// Generate and download PDF directly
router.get('/download/:quotationId', generateQuotationPDF);

// Generate PDF and save to file system
router.get('/save/:quotationId', generateAndSavePDF);

// Preview quotation as HTML
router.get('/preview/:quotationId', previewQuotation);

module.exports = router; 