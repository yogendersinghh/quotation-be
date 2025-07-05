const Product = require('../models/Product');
const Model = require('../models/Model');

// Create a new product (admin only)
const createProduct = async (req, res) => {
  try {
    const { 
      productImage, 
      title, 
      model, 
      type, 
      features, 
      price, 
      warranty, 
      quality,
      specification,
      termsAndCondition,
      categories, 
      notes, 
      description 
    } = req.body;

    // Validate model exists
    const modelExists = await Model.findById(model);
    if (!modelExists) {
      return res.status(400).json({ error: 'Model not found' });
    }

    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ error: 'At least one category is required' });
    }
    // Validate all categories exist
    const foundCategories = await Promise.all(categories.map(id => require('../models/Category').findById(id)));
    if (foundCategories.some(cat => !cat)) {
      return res.status(400).json({ error: 'One or more categories not found' });
    }

    const product = new Product({
      productImage,
      title,
      model,
      type,
      features,
      price,
      warranty,
      quality,
      specification,
      termsAndCondition,
      categories,
      notes,
      description
    });

    await product.save();
    await product.populate([
      { path: 'categories', select: 'name' },
      { path: 'model', select: 'name' }
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
      filter.model = model;
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
      .populate('model', 'name')
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
      .populate('categories', 'name')
      .populate('model', 'name');
      
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
      type, 
      features, 
      price, 
      warranty, 
      quality,
      specification,
      termsAndCondition,
      categories, 
      notes, 
      description 
    } = req.body;
    const productId = req.params.id;

    // Check if product exists
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Validate model exists if it's being updated
    if (model) {
      const modelExists = await Model.findById(model);
      if (!modelExists) {
        return res.status(400).json({ error: 'Model not found' });
      }
    }

    if (categories) {
      if (!Array.isArray(categories) || categories.length === 0) {
        return res.status(400).json({ error: 'At least one category is required' });
      }
      const foundCategories = await Promise.all(categories.map(id => require('../models/Category').findById(id)));
      if (foundCategories.some(cat => !cat)) {
        return res.status(400).json({ error: 'One or more categories not found' });
      }
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        productImage,
        title,
        model,
        type,
        features,
        price,
        warranty,
        quality,
        specification,
        termsAndCondition,
        categories,
        notes,
        description
      },
      { new: true, runValidators: true }
    ).populate([
      { path: 'categories', select: 'name' },
      { path: 'model', select: 'name' }
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