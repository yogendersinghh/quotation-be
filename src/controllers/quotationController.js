const Quotation = require('../models/Quotation');
const Product = require('../models/Product');
const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs').promises;
const Client = require('../models/Client'); // Added import for Client model

// Utility to generate and attach PDF
async function generateAndAttachPDF(quotation) {
  // Repopulate for fresh data
  await quotation.populate([
    { path: 'client', select: 'name email position phone' },
    { path: 'products.product', populate: { path: 'model', model: 'Model' } },
    { path: 'relatedProducts', select: 'title image description price productImage name' },
    { path: 'suggestedProducts', select: 'title image description price productImage name' },
    { path: 'createdBy' }
  ]);
  const templatePath = path.join(__dirname, '../views/quotation.ejs');
  const templateContent = await fs.readFile(templatePath, 'utf8');
  const htmlContent = ejs.render(templateContent, {
    quotation,
    client: quotation.client,
    user: quotation.createdBy,
    BASE_URL: process.env.BASE_URL
  });
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  const headerTemplate = `
    <div style="width:100%;padding:0 32px;box-sizing:border-box;">
      <div style="display:flex;align-items:flex-start;gap:10px;">
        <div>
          <div style='font-size:18px;font-weight:bold;color:#222;'>FIVE STAR TECHNOLOGIES</div>
          <div style='font-size:10px;color:#111;'>
            Address: C-177, Sector-10, Noida - 201301<br>
            Ph: (0120)4548366, email: info@fstindia.in, fivestartech.net@gmail.com<br>
            website: www.fstindia.in
          </div>
          <div style='font-size:12px;color:#003366;font-weight:bold;margin-top:2px;'>
            FIVE STAR helps industries to efficiently manage <span style='color:#003366;'>LIGHT I AIR I ENERGY</span> in partnership with leading brands of India
          </div>
        </div>
      </div>
    </div>
  `;
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '120px', right: '20mm', bottom: '20mm', left: '20mm' },
    displayHeaderFooter: true,
    headerTemplate: headerTemplate,
    footerTemplate: '<span></span>'
  });
  await browser.close();
  const pdfsDir = path.join(__dirname, '../../public/pdfs');
  await fs.mkdir(pdfsDir, { recursive: true });
  const fileName = `quotation-${quotation.quotationRefNumber}-${Date.now()}.pdf`;
  const filePath = path.join(pdfsDir, fileName);
  await fs.writeFile(filePath, pdfBuffer);
  quotation.pdfFileName = fileName;
  await quotation.save();
}

// Create a new quotation
const createQuotation = async (req, res) => {
  try {
    const {
      title,
      client,
      subject,
      formalMessage,
      products, // Array of product objects with details
      machineInstallation,
      notes,
      billingDetails,
      supply,
      installationAndCommissioning,
      termsAndConditions,
      signatureImage,
      totalAmount,
      relatedProducts,
      suggestedProducts,
      GST // <-- Add GST here
    } = req.body;

    // Validate products exist and required fields
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'At least one product is required' });
    }
    for (const product of products) {
      if (!product.product) {
        return res.status(400).json({ error: 'Product ID is required for each product' });
      }
      if (!product.title || !product.make || !product.model || product.qty == null || product.unitPrice == null || product.totalAmount == null) {
        return res.status(400).json({ error: 'Each product must have title, make, model, qty, unitPrice, and totalAmount' });
      }
      // Validate product exists
      const productExists = await Product.findById(product.product);
      if (!productExists) {
        return res.status(400).json({ error: `Product with ID ${product.product} not found` });
      }
    }

    // Store all product details in the quotation
    const quotation = new Quotation({
      title,
      client,
      subject,
      formalMessage,
      products, // Store the array of product objects as received
      machineInstallation,
      notes,
      billingDetails,
      supply,
      installationAndCommissioning,
      termsAndConditions,
      signatureImage,
      totalAmount,
      relatedProducts,
      suggestedProducts,
      GST, // <-- Store GST
      createdBy: req.user._id
    });

    await quotation.save();
    await quotation.populate([
      { path: 'client', select: 'name email position phone' },
      { path: 'products.product', select: 'name description price' },
      { path: 'relatedProducts', select: 'title image description price productImage name' },
      { path: 'suggestedProducts', select: 'title image description price productImage name' },
      { path: 'createdBy', select: 'name email' }
    ]);
    await generateAndAttachPDF(quotation);
    res.status(201).json({
      message: 'Quotation created successfully',
      quotation
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all quotations with pagination and filters
const getAllQuotations = async (req, res) => {
  try {
    const { page, limit, skip, sort } = req.pagination;
    const {
      client,
      month,
      converted,
      status,
      userId,
      search,
      companyName
    } = req.query;

    // Build filter object
    const filter = {};
    if (userId) {
      filter.createdBy = userId;
    }

    // Add search filter if provided
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    // Add client filter if provided
    if (companyName) {
      const clientDocs = await Client.find({ companyName: companyName }).select('_id');
      const clientIds = clientDocs.map(c => c._id.toString());

      if (client) {
        // Check if the client is in the company
        if (clientIds.includes(client)) {
          filter.client = client;
        } else {
          // No matching client for this company, return empty result or error
          return res.json({ quotations: [], message: 'Selected client does not belong to the specified company.' });
        }
      } else {
        filter.client = { $in: clientIds };
      }
    } else if (client) {
      filter.client = client;
    }

    // Add fromMonth filter if provided
    if (req.query.fromMonth) {
      const [fromYear, fromMonthNum] = req.query.fromMonth.split('-');
      const fromDate = new Date(fromYear, fromMonthNum - 1, 1);
      if (!filter.createdAt) {
        filter.createdAt = {};
      }
      filter.createdAt.$gte = fromDate;
    }

    // Add toMonth filter if provided
    if (req.query.toMonth) {
      const [toYear, toMonthNum] = req.query.toMonth.split('-');
      // Set to last millisecond of the month
      const toDate = new Date(toYear, toMonthNum, 0, 23, 59, 59, 999);
      if (!filter.createdAt) {
        filter.createdAt = {};
      }
      filter.createdAt.$lte = toDate;
    }

    // Add conversion status filter if provided
    if (converted) {
      filter.converted = converted;
    }

    // Add status filter if provided
    if (status) {
      filter.status = status;
    }

    // Get total count with filters
    const total = await Quotation.countDocuments(filter);

    // Get paginated quotations with filters
    const quotations = await Quotation.find(filter)
      .populate([
        { path: 'client', select: 'name email position phone' },
        { path: 'products.product', select: 'name description price' },
        { path: 'createdBy', select: 'name email' }
      ])
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.json({
      quotations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        client,
        month,
        converted,
        status,
        search,
        companyName
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get quotation by ID
const getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate([
        { path: 'client', select: 'name email position phone' },
        { path: 'products.product', select: 'name description price' },
        { path: 'createdBy', select: 'name email' }
      ]);

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    res.json(quotation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update quotation
const updateQuotation = async (req, res) => {
  try {
    const {
      title,
      client,
      subject,
      formalMessage,
      products,
      machineInstallation,
      notes,
      billingDetails,
      supply,
      installationAndCommissioning,
      termsAndConditions,
      signatureImage,
      totalAmount,
      converted,
      relatedProducts,
      suggestedProducts
    } = req.body;

    // Check if quotation exists
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }
    // Remove old PDF if exists
    if (quotation.pdfFileName) {
      const oldPath = path.join(__dirname, '../../public/pdfs', quotation.pdfFileName);
      try { await fs.unlink(oldPath); } catch (e) { /* ignore if not found */ }
    }
    // Update fields
    quotation.title = title;
    quotation.client = client;
    quotation.subject = subject;
    quotation.formalMessage = formalMessage;
    quotation.products = products;
    quotation.machineInstallation = machineInstallation;
    quotation.notes = notes;
    quotation.billingDetails = billingDetails;
    quotation.supply = supply;
    quotation.installationAndCommissioning = installationAndCommissioning;
    quotation.termsAndConditions = termsAndConditions;
    quotation.signatureImage = signatureImage;
    quotation.totalAmount = totalAmount;
    quotation.converted = converted;
    quotation.relatedProducts = relatedProducts;
    quotation.suggestedProducts = suggestedProducts;
    await quotation.save();
    await quotation.populate([
      { path: 'client', select: 'name email position phone' },
      { path: 'products.product', select: 'name description price' },
      { path: 'relatedProducts', select: 'title image description price productImage name' },
      { path: 'suggestedProducts', select: 'title image description price productImage name' },
      { path: 'createdBy', select: 'name email' }
    ]);
    await generateAndAttachPDF(quotation);
    res.json({
      message: 'Quotation updated successfully',
      quotation
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete quotation
const deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findByIdAndDelete(req.params.id);
    
    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    res.json({ message: 'Quotation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update quotation status (Admin only) - handles both approve and reject
const updateQuotationStatus = async (req, res) => {
  try {
    const { action } = req.body;
    const quotation = await Quotation.findById(req.params.id);
    
    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    // Check if quotation is in draft status
    if (quotation.status !== 'draft') {
      return res.status(400).json({ 
        error: 'Only draft quotations can have their status updated',
        currentStatus: quotation.status 
      });
    }

    // Validate action
    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ 
        error: 'Invalid action. Must be either "approve" or "reject"' 
      });
    }

    // Determine new status based on action
    const newStatus = action === 'approve' ? 'accepted' : 'rejected';

    // Update quotation status
    const updatedQuotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      { status: newStatus },
      { new: true }
    ).populate([
      { path: 'client', select: 'name email position phone' },
      { path: 'products.product', select: 'name description price' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.json({
      message: `Quotation ${action}d successfully`,
      quotation: updatedQuotation
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all quotations for admin (without user filtering)
const getAllQuotationsForAdmin = async (req, res) => {
  try {
    const { page, limit, skip, sort } = req.pagination;
    const {
      client,
      fromMonth,
      toMonth,
      converted,
      status,
      search
    } = req.query;

    // Build filter object - admin can see all quotations
    const filter = {};

    // Add search filter if provided
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    // Add client filter if provided
    if (client) {
      filter.client = client;
    }

    // Add month filter if provided

    // Add fromMonth filter if provided
    if (fromMonth) {
      const [fromYear, fromMonthNum] = fromMonth.split('-');
      const fromDate = new Date(fromYear, fromMonthNum - 1, 1);
      if (!filter.createdAt) {
        filter.createdAt = {};
      }
      filter.createdAt.$gte = fromDate;
    }

    // Add toMonth filter if provided
    if (toMonth) {
      const [toYear, toMonthNum] = toMonth.split('-');
      // Set to last millisecond of the month
      const toDate = new Date(toYear, toMonthNum, 0, 23, 59, 59, 999);
      if (!filter.createdAt) {
        filter.createdAt = {};
      }
      filter.createdAt.$lte = toDate;
    }

    // Add conversion status filter if provided
    if (converted) {
      filter.converted = converted;
    }

    // Add status filter if provided
    if (status) {
      filter.status = status;
    }

    // Get total count with filters
    const total = await Quotation.countDocuments(filter);

    // Get paginated quotations with filters
    const quotations = await Quotation.find(filter)
      .populate([
        { path: 'client', select: 'name email position phone' },
        { path: 'products.product', select: 'name description price' },
        { path: 'createdBy', select: 'name email' }
      ])
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.json({
      quotations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        client,
        month,
        converted,
        status,
        search
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createQuotation,
  getAllQuotations,
  getAllQuotationsForAdmin,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
  updateQuotationStatus
}; 



