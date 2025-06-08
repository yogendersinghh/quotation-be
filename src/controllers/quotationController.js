const Quotation = require('../models/Quotation');
const Product = require('../models/Product');

// Create a new quotation
const createQuotation = async (req, res) => {
  try {
    const {
      quotationRefNumber,
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
      totalAmount
    } = req.body;

    // Check if quotationRefNumber already exists
    const existingQuotation = await Quotation.findOne({ quotationRefNumber });
    if (existingQuotation) {
      return res.status(400).json({ error: 'Quotation reference number already exists' });
    }

    // Validate products exist
    for (const product of products) {
      const productExists = await Product.findById(product.product);
      if (!productExists) {
        return res.status(400).json({ error: `Product with ID ${product.product} not found` });
      }
    }

    const quotation = new Quotation({
      quotationRefNumber,
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
      createdBy: req.user._id
    });

    await quotation.save();
    await quotation.populate([
      { path: 'client', select: 'name email position' },
      { path: 'products.product', select: 'name description price' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json({
      message: 'Quotation created successfully',
      quotation
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all quotations with pagination
const getAllQuotations = async (req, res) => {
  try {
    const { page, limit, skip, sort } = req.pagination;

    // Get total count
    const total = await Quotation.countDocuments();

    // Get paginated quotations
    const quotations = await Quotation.find()
      .populate([
        { path: 'client', select: 'name email position' },
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
        { path: 'client', select: 'name email position' },
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
      quotationRefNumber,
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
      status
    } = req.body;

    // Check if quotation exists
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    // If quotationRefNumber is being updated, check if it already exists
    if (quotationRefNumber && quotationRefNumber !== quotation.quotationRefNumber) {
      const existingQuotation = await Quotation.findOne({ quotationRefNumber });
      if (existingQuotation) {
        return res.status(400).json({ error: 'Quotation reference number already exists' });
      }
    }

    // Validate products exist if being updated
    if (products) {
      for (const product of products) {
        const productExists = await Product.findById(product.product);
        if (!productExists) {
          return res.status(400).json({ error: `Product with ID ${product.product} not found` });
        }
      }
    }

    // Update quotation
    const updatedQuotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      {
        quotationRefNumber,
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
        status
      },
      { new: true }
    ).populate([
      { path: 'client', select: 'name email position' },
      { path: 'products.product', select: 'name description price' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.json({
      message: 'Quotation updated successfully',
      quotation: updatedQuotation
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

module.exports = {
  createQuotation,
  getAllQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation
}; 