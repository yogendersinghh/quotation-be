const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  image: { type: String, required: true },
  price: { type: Number, required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  specification: { type: String, required: true },
  title: { type: String, required: true },
  model: { type: String, required: true },
  total: { type: Number, required: true },
  unit: { type: String, required: true }
});

const machineInstallationSchema = new mongoose.Schema({
  quantity: {
    type: Number,
    min: 1
  },
  unit: {
    type: String
  },
  price: {
    type: Number,
    min: 0
  },
  total: {
    type: Number,
    min: 0
  }
});

const quotationSchema = new mongoose.Schema({
  quotationRefNumber: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  formalMessage: {
    type: String,
    required: true,
    trim: true
  },
  products: [productSchema],
  machineInstallation: {
    type: machineInstallationSchema,
    required: false
  },
  notes: {
    type: String,
    trim: true
  },
  billingDetails: {
    type: String,
    required: true,
    trim: true
  },
  supply: {
    type: String,
    required: true,
    trim: true
  },
  installationAndCommissioning: {
    type: String,
    required: true,
    trim: true
  },
  termsAndConditions: {
    type: String,
    required: true,
    trim: true
  },
  signatureImage: {
    type: String,
    required: false
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  pdfFileName: {
    type: String,
    trim: true
  },
  relatedProducts: [{
    image: { type: String, required: false },
    model: { type: String, required: false },
    specification: { type: String, required: false }
  }],
  suggestedProducts: [{
    image: { type: String, required: false },
    model: { type: String, required: false },
    specification: { type: String, required: false }
  }],
  status: {
    type: String,
    enum: ['draft', 'accepted', 'rejected'],
    default: 'draft'
  },
  converted: {
    type: String,
    enum: ['Under Development', 'Booked', 'Lost'],
    default: 'Under Development'
  },
  GST: { type: Boolean },
  gstPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 18
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Generate quotation reference number before validation
quotationSchema.pre('validate', async function(next) {
  try {
    if (this.isNew) {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      
      // Get the count of quotations for the current month
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const count = await this.constructor.countDocuments({
        createdAt: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      });
      
      // Generate reference number: QT-YYMM-XXXX
      this.quotationRefNumber = `QT-${year}${month}-${(count + 1).toString().padStart(4, '0')}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

const Quotation = mongoose.model('Quotation', quotationSchema);

module.exports = Quotation; 