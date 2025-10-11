const mongoose = require('mongoose');

const DefaultMessageSchema = new mongoose.Schema({
  formalMessage: { type: String, required: true },
  notes: { type: String, required: true },
  billingDetails: { type: String, required: true },
  termsAndConditions: { type: String, required: true },
  signatureImage: { type: String, required: true },
  companyAddress: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('DefaultMessage', DefaultMessageSchema); 