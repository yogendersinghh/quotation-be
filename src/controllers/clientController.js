const Client = require('../models/Client');

// Create a new client
const createClient = async (req, res) => {
  try {
    const { name, email, position, address, phone, companyName } = req.body;

    // Check if client with email already exists
    const existingClient = await Client.findOne({ email });
    if (existingClient) {
      return res.status(400).json({ error: 'Client with this email already exists' });
    }

    if (!companyName) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const client = new Client({
      name,
      email,
      position,
      address,
      phone,
      companyName,
      createdBy: req.user._id
    });

    await client.save();

    res.status(201).json({
      message: 'Client created successfully',
      client
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all clients with pagination
const getAllClients = async (req, res) => {
  try {
    const { page, limit, skip, sort } = req.pagination;
    const { search } = req.query;
    console.log("🚀 ~ getAllClients ~ search:", search)

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
    const total = await Client.countDocuments(filter);

    // Get paginated clients with filters
    const clients = await Client.find(filter)
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.json({
      clients,
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

// Get client by ID
const getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update client
const updateClient = async (req, res) => {
  try {
    const { name, email, position, address, phone, companyName } = req.body;

    // Check if client exists
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Check if email is being changed and if it's already in use
    if (email && email !== client.email) {
      const existingClient = await Client.findOne({ email });
      if (existingClient) {
        return res.status(400).json({ error: 'Email already in use by another client' });
      }
    }

    // Update client
    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      { name, email, position, address, phone, companyName },
      { new: true }
    ).populate('createdBy', 'name email');

    res.json({
      message: 'Client updated successfully',
      client: updatedClient
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete client
const deleteClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient
}; 