const Quotation = require('../models/Quotation');
const Product = require('../models/Product');
const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs').promises;
const Client = require('../models/Client'); // Added import for Client model
const ExcelJS = require('exceljs'); // Add at the top

// Utility to generate and attach PDF
async function generateAndAttachPDF(quotation) {
  // Repopulate for fresh data
  await quotation.populate([
    { path: 'client', select: 'name email position phone' },
    { path: 'createdBy' }
  ]);
  console.log("quotation",JSON.stringify(quotation,null,2))
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
// Expected products format:
// products: [
//   {
//     image: "image_url",
//     price: 1000,
//     product: "product_id", // optional - reference to Product model
//     quantity: 2,
//     specification: "Product specification",
//     title: "Product Title",
//     model: "Model Number",
//     total: 2000,
//     unit: "Nos"
//     // notes and termsAndConditions will be automatically fetched from the Product model in DB
//   }
// ]
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
      GST, // <-- Add GST here
      gstPercentage
    } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!client) {
      return res.status(400).json({ error: 'Client is required' });
    }

    // Validate client exists
    const clientExists = await Client.findById(client);
    if (!clientExists) {
      return res.status(400).json({ error: 'Client not found' });
    }

    // Validate products and fetch product notes/terms from DB if provided
    if (products && Array.isArray(products) && products.length > 0) {
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        // Validate product exists if product ID is provided
        if (product.product) {
          const productExists = await Product.findById(product.product);
          if (!productExists) {
            return res.status(400).json({ error: `Product with ID ${product.product} not found` });
          }
          
          // Fetch notes and terms from the product in DB
          products[i].notes = productExists.notes || '';
          products[i].termsAndConditions = productExists.termsAndCondition || '';
        }
      }
    }

    // Calculate total amount from products (price * quantity for each product) only if products are provided
    let calculatedTotalAmount = 0;
    if (products && Array.isArray(products) && products.length > 0) {
      calculatedTotalAmount = products.reduce((sum, product) => {
        const productTotal = (product.price || 0) * (product.quantity || 0);
        return sum + productTotal;
      }, 0);
    }

    // Add machine installation total if it exists
    if (machineInstallation && machineInstallation.total) {
      calculatedTotalAmount += machineInstallation.total;
    }

    // Store all product details in the quotation
    const quotation = new Quotation({
      title,
      client,
      subject,
      formalMessage,
      products: products || [], // Store the array of product objects as received
      machineInstallation,
      notes,
      billingDetails,
      supply,
      installationAndCommissioning,
      termsAndConditions,
      signatureImage,
      totalAmount: calculatedTotalAmount,
      relatedProducts: relatedProducts || [],
      suggestedProducts: suggestedProducts || [],
      GST, // <-- Store GST
      gstPercentage,
      createdBy: req.user._id
    });

    await quotation.save();
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
      companyName,
      companyCode,
      companyStage,
      createdBy
    } = req.query;

    // Build filter object
    const filter = {};
    
    // Handle createdBy filtering
    if (createdBy) {
      // If createdBy is provided in query, use it (admin can filter by any user)
      filter.createdBy = createdBy;
    } else if (!req.user || req.user.role !== 'admin') {
      // For non-admin users, always filter by their own ID
      filter.createdBy = req.user._id;
    }
    // If admin and no createdBy/userId provided, show all quotations

    // Add search filter if provided
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    // Add client filter if provided
    if (companyName || companyCode || companyStage) {
      let clientFilter = {};
      
      if (companyName) {
        clientFilter.companyName = companyName;
      }
      
      if (companyCode) {
        clientFilter.companyCode = companyCode;
      }
      
      if (companyStage) {
        clientFilter.companyStage = companyStage;
      }
      
      const clientDocs = await Client.find(clientFilter).select('_id');
      const clientIds = clientDocs.map(c => c._id.toString());

      if (client) {
        // Check if the client is in the filtered results
        if (clientIds.includes(client)) {
          filter.client = client;
        } else {
          // No matching client for this company/company code/stage, return empty result or error
          return res.json({ quotations: [], message: 'Selected client does not belong to the specified company/company code/stage.' });
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

    // Debug: Log user role and filter
    console.log('🔍 Debug - User role:', req.user?.role);
    console.log('🔍 Debug - Final filter:', filter);
    console.log('🔍 Debug - Total quotations found:', total);
    
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
        companyName,
        companyCode,
        companyStage,
        createdBy
      },
      userRole: req.user?.role,
      isAdmin: req.user?.role === 'admin'
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
// Expected products format (same as create):
// products: [
//   {
//     image: "image_url",
//     price: 1000,
//     product: "product_id", // optional - reference to Product model
//     quantity: 2,
//     specification: "Product specification",
//     title: "Product Title",
//     model: "Model Number",
//     total: 2000,
//     unit: "Nos"
//     // notes and termsAndConditions will be automatically fetched from the Product model in DB
//   }
// ]
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
      relatedProducts,
      suggestedProducts,
      GST,
      gstPercentage
    } = req.body;

    // Check if quotation exists
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    // Validate required fields if provided
    if (title !== undefined && (!title || !title.trim())) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (client !== undefined) {
      if (!client) {
        return res.status(400).json({ error: 'Client is required' });
      }
      // Validate client exists
      const clientExists = await Client.findById(client);
      if (!clientExists) {
        return res.status(400).json({ error: 'Client not found' });
      }
    }

    // Validate products and fetch product notes/terms from DB if provided
    if (products !== undefined && Array.isArray(products) && products.length > 0) {
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        // Validate product exists if product ID is provided
        if (product.product) {
          const productExists = await Product.findById(product.product);
          if (!productExists) {
            return res.status(400).json({ error: `Product with ID ${product.product} not found` });
          }
          
          // Fetch notes and terms from the product in DB
          products[i].notes = productExists.notes || '';
          products[i].termsAndConditions = productExists.termsAndCondition || '';
        }
      }
    }
    
    // Calculate total amount from products (price * quantity for each product) only if products are provided
    let calculatedTotalAmount = 0;
    if (products !== undefined) {
      if (Array.isArray(products) && products.length > 0) {
        calculatedTotalAmount = products.reduce((sum, product) => {
          const productTotal = (product.price || 0) * (product.quantity || 0);
          return sum + productTotal;
        }, 0);
      } else {
        calculatedTotalAmount = 0;
      }
    }

    // Add machine installation total if it exists
    if (machineInstallation && machineInstallation.total) {
      calculatedTotalAmount += machineInstallation.total;
    }
    
    // Remove old PDF if exists
    if (quotation.pdfFileName) {
      const oldPath = path.join(__dirname, '../../public/pdfs', quotation.pdfFileName);
      try { await fs.unlink(oldPath); } catch (e) { /* ignore if not found */ }
    }
    
    // Update only the fields that are provided in the payload
    if (title !== undefined) quotation.title = title;
    if (client !== undefined) quotation.client = client;
    if (subject !== undefined) quotation.subject = subject;
    if (formalMessage !== undefined) quotation.formalMessage = formalMessage;
    if (products !== undefined) quotation.products = products;
    if (machineInstallation !== undefined) quotation.machineInstallation = machineInstallation;
    if (notes !== undefined) quotation.notes = notes;
    if (billingDetails !== undefined) quotation.billingDetails = billingDetails;
    if (supply !== undefined) quotation.supply = supply;
    if (installationAndCommissioning !== undefined) quotation.installationAndCommissioning = installationAndCommissioning;
    if (termsAndConditions !== undefined) quotation.termsAndConditions = termsAndConditions;
    if (signatureImage !== undefined) quotation.signatureImage = signatureImage;
    if (relatedProducts !== undefined) quotation.relatedProducts = relatedProducts;
    if (suggestedProducts !== undefined) quotation.suggestedProducts = suggestedProducts;
    if (GST !== undefined) quotation.GST = GST;
    if (gstPercentage !== undefined) quotation.gstPercentage = gstPercentage;
    
    // Always recalculate total amount if products are provided
    if (products !== undefined) {
      quotation.totalAmount = calculatedTotalAmount;
    }
    await quotation.save();

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

// Export quotations to Excel based on filters
const exportQuotationsToExcel = async (req, res) => {
  try {
    const {
      client,
      month,
      converted,
      status,
      userId,
      search,
      companyName,
      companyCode,
      companyStage,
      createdBy,
      fromMonth,
      toMonth
    } = req.query;

    // Build filter object (same as getAllQuotations)
    const filter = {};
    
    // Handle createdBy filtering
    if (createdBy) {
      // If createdBy is provided in query, use it (admin can filter by any user)
      filter.createdBy = createdBy;
    } else if (!req.user || req.user.role !== 'admin') {
      // For non-admin users, always filter by their own ID
      filter.createdBy = req.user._id;
    }
    // If admin and no createdBy/userId provided, show all quotations
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }
    if (companyName || companyCode || companyStage) {
      let clientFilter = {};
      
      if (companyName) {
        clientFilter.companyName = companyName;
      }
      
      if (companyCode) {
        clientFilter.companyCode = companyCode;
      }
      
      if (companyStage) {
        clientFilter.companyStage = companyStage;
      }
      
      const clientDocs = await Client.find(clientFilter).select('_id');
      const clientIds = clientDocs.map(c => c._id.toString());
      if (client) {
        if (clientIds.includes(client)) {
          filter.client = client;
        } else {
          return res.status(400).json({ error: 'Selected client does not belong to the specified company/company code/stage.' });
        }
      } else {
        filter.client = { $in: clientIds };
      }
    } else if (client) {
      filter.client = client;
    }
    if (fromMonth) {
      const [fromYear, fromMonthNum] = fromMonth.split('-');
      const fromDate = new Date(fromYear, fromMonthNum - 1, 1);
      if (!filter.createdAt) filter.createdAt = {};
      filter.createdAt.$gte = fromDate;
    }
    if (toMonth) {
      const [toYear, toMonthNum] = toMonth.split('-');
      const toDate = new Date(toYear, toMonthNum, 0, 23, 59, 59, 999);
      if (!filter.createdAt) filter.createdAt = {};
      filter.createdAt.$lte = toDate;
    }
    if (converted) filter.converted = converted;
    if (status) filter.status = status;

    // Fetch quotations
    const quotations = await Quotation.find(filter)
      .populate([
        { path: 'client', select: 'name email position phone' },
        { path: 'products.product', select: 'name description price' },
        { path: 'createdBy', select: 'name email' }
      ])
      .sort({ createdAt: -1 });

    // Create Excel workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Quotations');

    // Define headers (customize as needed)
    worksheet.columns = [
      { header: 'Quotation Ref', key: 'quotationRefNumber', width: 20 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Client Name', key: 'clientName', width: 25 },
      { header: 'Client Email', key: 'clientEmail', width: 25 },
      { header: 'Subject', key: 'subject', width: 30 },
      { header: 'Total Amount', key: 'totalAmount', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Created By', key: 'createdBy', width: 20 },
      { header: 'Created At', key: 'createdAt', width: 20 }
      // Add more fields as needed
    ];

    // Add rows
    quotations.forEach(q => {
      let clientEmail = '';
      if (Array.isArray(q.client?.email)) {
        clientEmail = q.client.email.join(', ');
      } else if (typeof q.client?.email === 'string') {
        clientEmail = q.client.email;
      }
      worksheet.addRow({
        quotationRefNumber: q.quotationRefNumber,
        title: q.title,
        clientName: q.client?.name || '',
        clientEmail: clientEmail,
        subject: q.subject,
        totalAmount: q.totalAmount,
        status: q.status,
        createdBy: q.createdBy?.name || '',
        createdAt: q.createdAt ? q.createdAt.toISOString().slice(0, 10) : ''
      });
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=quotations.xlsx');

    // Write workbook to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update quotation converted status
const updateQuotationConverted = async (req, res) => {
  try {
    const { converted } = req.body;
    const { id } = req.params;

    // Validate converted value
    const validConvertedValues = ['Under Development', 'Booked', 'Lost'];
    if (!validConvertedValues.includes(converted)) {
      return res.status(400).json({ 
        error: 'Invalid converted value. Must be one of: Under Development, Booked, Lost' 
      });
    }

    // Check if quotation exists
    const quotation = await Quotation.findById(id);
    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    // Update the converted field
    quotation.converted = converted;
    await quotation.save();

    res.json({
      message: 'Quotation converted status updated successfully',
      quotation: {
        id: quotation._id,
        quotationRefNumber: quotation.quotationRefNumber,
        converted: quotation.converted,
        updatedAt: quotation.updatedAt
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
  updateQuotationStatus,
  updateQuotationConverted,
  exportQuotationsToExcel
}; 



