const Client = require('../models/Client');

// Create a new client
const createClient = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      position, 
      address, 
      place,
      city,
      state,
      PIN,
      phone, 
      companyName 
    } = req.body;

    // Validate that email is an array and has at least one email
    if (!Array.isArray(email) || email.length === 0) {
      return res.status(400).json({ error: 'At least one email is required' });
    }

    // Validate that phone is an array and has at least one number
    if (!Array.isArray(phone) || phone.length === 0) {
      return res.status(400).json({ error: 'At least one mobile number is required' });
    }

    // Check if any client with any of the provided emails already exists
    const existingClient = await Client.findOne({ 
      email: { $in: email } 
    });
    if (existingClient) {
      return res.status(400).json({ error: 'Client with one of these emails already exists' });
    }

    if (!companyName) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const client = new Client({
      name,
      email,
      position,
      address,
      place,
      city,
      state,
      PIN,
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
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { place: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { state: { $regex: search, $options: 'i' } }
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
    const { 
      name, 
      email, 
      position, 
      address, 
      place,
      city,
      state,
      PIN,
      phone, 
      companyName 
    } = req.body;

    // Check if client exists
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Validate that email is an array and has at least one email if provided
    if (email && (!Array.isArray(email) || email.length === 0)) {
      return res.status(400).json({ error: 'At least one email is required' });
    }

    // Validate that phone is an array and has at least one number if provided
    if (phone && (!Array.isArray(phone) || phone.length === 0)) {
      return res.status(400).json({ error: 'At least one mobile number is required' });
    }

    // Check if any of the new emails are already in use by other clients
    if (email) {
      const existingClient = await Client.findOne({ 
        email: { $in: email },
        _id: { $ne: req.params.id } // Exclude current client
      });
      if (existingClient) {
        return res.status(400).json({ error: 'One of these emails is already in use by another client' });
      }
    }

    // Update client
    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      { 
        name, 
        email, 
        position, 
        address, 
        place,
        city,
        state,
        PIN,
        phone, 
        companyName 
      },
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