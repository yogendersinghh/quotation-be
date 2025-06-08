require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const clientRoutes = require('./routes/clientRoutes');
const quotationRoutes = require('./routes/quotationRoutes');
// const { adminJs, router: adminRouter } = require('./admin/admin');

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*', // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory - place this before any authentication middleware
app.use('/public', express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/quotations', quotationRoutes);

// AdminJS
// app.use(adminJs.options.rootPath, adminRouter);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`AdminJS is available at http://localhost:${PORT}/admin`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app; 