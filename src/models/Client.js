const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: [String],
    required: true,
    validate: {
      validator: function(emails) {
        return emails.length > 0;
      },
      message: 'At least one email is required'
    },
    trim: true,
    lowercase: true
  },
  position: {
    type: String,
    required: false,
    trim: true
  },
  address: {
    type: String,
    required: false,
    trim: true
  },
  place: {
    type: String,
    required: false,
    trim: true
  },
  city: {
    type: String,
    required: false,
    trim: true
  },
  state: {
    type: String,
    required: false,
    trim: true
  },
  PIN: {
    type: String,
    required: false,
    trim: true
  },
  phone: {
    type: [String],
    required: true,
    validate: {
      validator: function(numbers) {
        return numbers.length > 0;
      },
      message: 'At least one mobile number is required'
    },
    trim: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  companyCode: {
    type: String,
    required: true,
    trim: true
  },
  companyStage: {
    type: String,
    required: false,
    trim: true,
    enum: ['foundation', 'building', 'running', 'finished', 'closed'],
    default: 'foundation'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const Client = mongoose.model('Client', clientSchema);

module.exports = Client; 