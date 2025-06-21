const Quotation = require('../models/Quotation');
const Product = require('../models/Product');

// Create a new quotation
const createQuotation = async (req, res) => {
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
      totalAmount
    } = req.body;

    // Validate products exist
    for (const product of products) {
      const productExists = await Product.findById(product.product);
      if (!productExists) {
        return res.status(400).json({ error: `Product with ID ${product.product} not found` });
      }
    }

    const quotation = new Quotation({
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
      search
    } = req.query;

    // Build filter object - always scope to current user
    const filter = {
      createdBy: userId
    };

    // Add search filter if provided
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    // Add client filter if provided
    if (client) {
      filter.client = client;
    }

    // Add month filter if provided
    if (month) {
      const [year, monthNum] = month.split('-');
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0);
      filter.createdAt = {
        $gte: startDate,
        $lte: endDate
      };
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
      converted
    } = req.body;

    // Check if quotation exists
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
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
        converted
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
      { path: 'client', select: 'name email position' },
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
      month,
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
    if (month) {
      const [year, monthNum] = month.split('-');
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0);
      filter.createdAt = {
        $gte: startDate,
        $lte: endDate
      };
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



