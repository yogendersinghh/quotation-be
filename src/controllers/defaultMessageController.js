const DefaultMessage = require('../models/DefaultMessage');

// Create Default Message
exports.createDefaultMessage = async (req, res) => {
  try {
    const { formalMessage, notes, billingDetails, termsAndConditions, signatureImage, address } = req.body;
    const message = new DefaultMessage({ formalMessage, notes, billingDetails, termsAndConditions, signatureImage, address });
    await message.save();
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get All Default Messages
exports.getAllDefaultMessages = async (req, res) => {
  try {
    const messages = await DefaultMessage.find();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Default Message by ID
exports.updateDefaultMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { formalMessage, notes, billingDetails, termsAndConditions, signatureImage, address } = req.body;
    const updated = await DefaultMessage.findByIdAndUpdate(
      id,
      { formalMessage, notes, billingDetails, termsAndConditions, signatureImage, address },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'DefaultMessage not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 