const Product = require('../models/Product');
const Model = require('../models/Model');

// Create a new product (admin only)
const createProduct = async (req, res) => {
  try {
    const { 
      productImage, 
      title, 
      model, 
      make,
      type, 
      features, 
      price, 
      warranty, 
      quality,
      specification,
      termsAndCondition,
      categories, 
      notes, 
      description,
      dataSheet,
      catalog
    } = req.body;

    // Validate mandatory fields
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Product title is required' });
    }

    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ error: 'At least one category is required' });
    }

    // Validate all categories exist
    const foundCategories = await Promise.all(categories.map(id => require('../models/Category').findById(id)));
    if (foundCategories.some(cat => !cat)) {
      return res.status(400).json({ error: 'One or more categories not found' });
    }

    // Create product object with only provided fields
    const productData = {
      title: title.trim(),
      categories
    };

    // Add optional fields only if they are provided
    if (productImage) productData.productImage = productImage;
    if (model) productData.model = model;
    if (make) productData.make = make;
    if (type) productData.type = type;
    if (features && Array.isArray(features)) productData.features = features;
    if (price !== undefined && price !== null) productData.price = price;
    if (warranty) productData.warranty = warranty;
    if (quality) productData.quality = quality;
    if (specification) productData.specification = specification;
    if (termsAndCondition) productData.termsAndCondition = termsAndCondition;
    if (notes) productData.notes = notes;
    if (description) productData.description = description;
    if (dataSheet) productData.dataSheet = dataSheet;
    if (catalog) productData.catalog = catalog;

    const product = new Product(productData);

    await product.save();
    await product.populate([
      { path: 'categories', select: 'name' }
    ]);

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all products with pagination and filtering
const getAllProducts = async (req, res) => {
  try {
    const { page, limit, skip, sort } = req.pagination;
    const { title, model, categories } = req.query;

    // Build filter object
    const filter = {};
    if (title) {
      filter.title = { $regex: title, $options: 'i' };
    }
    if (model) {
      filter.model = model; // Now a String match
    }
    if (categories) {
      const categoryArray = Array.isArray(categories) ? categories : categories.split(',');
      filter.categories = { $in: categoryArray };
    }

    // Get total count with filters
    const total = await Product.countDocuments(filter);

    // Get paginated products with filters
    const products = await Product.find(filter)
      .populate('categories', 'name')
      // .populate('model', 'name') // Remove model population
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.json({
      products,
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

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('categories', 'name'); // Remove model population
      
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update product (admin only)
const updateProduct = async (req, res) => {
  try {
    const { 
      productImage, 
      title, 
      model, 
      make,
      type, 
      features, 
      price, 
      warranty, 
      quality,
      specification,
      termsAndCondition,
      categories, 
      notes, 
      description,
      dataSheet,
      catalog
    } = req.body;
    const productId = req.params.id;

    // Check if product exists
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Validate mandatory fields if provided
    if (title !== undefined && (!title || title.trim() === '')) {
      return res.status(400).json({ error: 'Product title cannot be empty' });
    }

    if (categories !== undefined) {
      if (!Array.isArray(categories) || categories.length === 0) {
        return res.status(400).json({ error: 'At least one category is required' });
      }
      const foundCategories = await Promise.all(categories.map(id => require('../models/Category').findById(id)));
      if (foundCategories.some(cat => !cat)) {
        return res.status(400).json({ error: 'One or more categories not found' });
      }
    }

    // Build update object with only provided fields
    const updateData = {};

    if (title !== undefined) updateData.title = title.trim();
    if (categories !== undefined) updateData.categories = categories;
    if (productImage !== undefined) updateData.productImage = productImage;
    if (model !== undefined) updateData.model = model;
    if (make !== undefined) updateData.make = make;
    if (type !== undefined) updateData.type = type;
    if (features !== undefined) updateData.features = features;
    if (price !== undefined) updateData.price = price;
    if (warranty !== undefined) updateData.warranty = warranty;
    if (quality !== undefined) updateData.quality = quality;
    if (specification !== undefined) updateData.specification = specification;
    if (termsAndCondition !== undefined) updateData.termsAndCondition = termsAndCondition;
    if (notes !== undefined) updateData.notes = notes;
    if (description !== undefined) updateData.description = description;
    if (dataSheet !== undefined) updateData.dataSheet = dataSheet;
    if (catalog !== undefined) updateData.catalog = catalog;

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'categories', select: 'name' }
      // No model population
    ]);

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete product (admin only)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct
}; 