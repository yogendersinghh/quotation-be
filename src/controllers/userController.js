const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Register a new user (admin only)
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, userStatus, signature } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role: role || 'manager', // Default to manager if role not specified
      userStatus: userStatus || 'active', // Default to active if status not specified
      signature
    });

    await user.save();

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        userStatus: user.userStatus,
        signature: user.signature
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is blocked
    if (user.userStatus === 'blocked') {
      return res.status(403).json({ error: 'Your account has been blocked. Please contact administrator.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        userStatus: user.userStatus,
        signature: user.signature
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all users with pagination and search
const getAllUsers = async (req, res) => {
  try {
    const { page, limit, skip, sort } = req.pagination;
    const { search } = req.query;

    // Build filter object
    const filter = {};

    // Add search filter if provided
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count with filters
    const total = await User.countDocuments(filter);

    // Get paginated users with filters
    const users = await User.find(filter)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        search
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { name, email, role, userStatus, signature } = req.body;
    const userId = req.params.id;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If email is being updated, check if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        name,
        email,
        role,
        userStatus,
        signature
      },
      { new: true }
    ).select('-password');

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user' });
      }
    }

    // Delete user
    await User.findByIdAndDelete(userId);

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  updateUser,
  deleteUser
}; 