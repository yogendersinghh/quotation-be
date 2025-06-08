const Product = require('../models/Product');

// Create a new product (admin only)
const createProduct = async (req, res) => {
  try {
    const { productImage, title, model, type, features, price, warranty, category } = req.body;

    const product = new Product({
      productImage,
      title,
      model,
      type,
      features,
      price,
      warranty,
      category
    });

    await product.save();
    await product.populate('category', 'name');

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all products with pagination
const getAllProducts = async (req, res) => {
  try {
    const { page, limit, skip, sort } = req.pagination;

    // Get total count
    const total = await Product.countDocuments();

    // Get paginated products
    const products = await Product.find()
      .populate('category', 'name')
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
    const product = await Product.findById(req.params.id).populate('category', 'name');
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
  deleteProduct
}; 