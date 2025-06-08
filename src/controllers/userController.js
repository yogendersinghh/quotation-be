const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Register a new user (admin only)
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, userStatus } = req.body;

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
      userStatus: userStatus || 'active' // Default to active if status not specified
    });

    await user.save();

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        userStatus: user.userStatus
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
        userStatus: user.userStatus
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all users with pagination
const getAllUsers = async (req, res) => {
  try {
    const { page, limit, skip, sort } = req.pagination;

    // Get total count
    const total = await User.countDocuments();

    // Get paginated users
    const users = await User.find()
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
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getAllUsers
}; 