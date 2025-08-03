const Client = require("../models/Client");

// Create a new client
const createClient = async (req, res) => {
  try {
    const {
      users, // Array of user objects
      address,
      place,
      city,
      state,
      PIN,
      companyName,
      companyCode,
    } = req.body;

    // Validate users array
    if (!Array.isArray(users) || users.length === 0) {
      return res
        .status(400)
        .json({ error: "Users array is required and cannot be empty" });
    }
    if (!companyName) {
      return res.status(400).json({ error: "Company name is required" });
    }
    if (!companyCode) {
      return res.status(400).json({ error: "Company code is required" });
    }

    // Collect all emails and phones from all users for duplicate check
    let allEmails = [];
    let allPhones = [];
    for (const user of users) {
      if (!user.name) {
        return res.status(400).json({ error: "Each user must have a name" });
      }
      if (!Array.isArray(user.email) || user.email.length === 0) {
        return res
          .status(400)
          .json({
            error: `User ${user.name} must have at least one email (as array)`,
          });
      }
      if (!Array.isArray(user.phone) || user.phone.length === 0) {
        return res
          .status(400)
          .json({
            error: `User ${user.name} must have at least one phone number (as array)`,
          });
      }
      if (!user.position) {
        return res
          .status(400)
          .json({ error: `User ${user.name} must have a position` });
      }
      allEmails = allEmails.concat(user.email);
      allPhones = allPhones.concat(user.phone);
    }

    // Check for existing clients with any of the provided emails, phone numbers, or company code
    const existingClient = await Client.findOne({
      $or: [
        { email: { $in: allEmails } },
        { phone: { $in: allPhones } },
        { companyCode: companyCode }
      ],
    });
    if (existingClient) {
      return res
        .status(400)
        .json({
          error:
            "A client with one of these emails, phone numbers, or company code already exists",
        });
    }

    // Create client documents
    const clientsToCreate = users.map((user) => ({
      name: user.name,
      email: user.email, // array
      position: user.position,
      address,
      place,
      city,
      state,
      PIN,
      phone: user.phone, // array
      companyName,
      companyCode,
      createdBy: req.user._id,
    }));

    const createdClients = await Client.insertMany(clientsToCreate);

    res.status(201).json({
      message: "Clients created successfully",
      clients: createdClients,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all clients with pagination
const getAllClients = async (req, res) => {
  try {
    const { page, limit, skip, sort } = req.pagination;
    const { search, companyName } = req.query;
    console.log("🚀 ~ getAllClients ~ search:", search);

    // Build filter object
    const filter = {};

    // Add companyName filter if provided
    if (companyName) {
      filter.companyName = { $regex: companyName, $options: "i" };
    }
    // Add search filter if provided
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $elemMatch: { $regex: search, $options: "i" } } },
        { phone: { $elemMatch: { $regex: search, $options: "i" } } },
        { companyName: { $regex: search, $options: "i" } },
        { companyCode: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { place: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { state: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count with filters
    const total = await Client.countDocuments(filter);

    // Get paginated clients with filters
    const clients = await Client.find(filter)
      .populate("createdBy", "name email")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.json({
      clients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filters: {
        search,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get client by ID
const getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
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
      companyName,
    } = req.body;

    // Check if client exists
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    // Validate that email is an array and has at least one email if provided
    if (email && (!Array.isArray(email) || email.length === 0)) {
      return res
        .status(400)
        .json({ error: "At least one email is required (as array)" });
    }

    // Validate that phone is an array and has at least one number if provided
    if (phone && (!Array.isArray(phone) || phone.length === 0)) {
      return res
        .status(400)
        .json({ error: "At least one mobile number is required (as array)" });
    }

    // Check if any of the new emails are already in use by other clients
    if (email) {
      const existingClient = await Client.findOne({
        email: { $in: email },
        _id: { $ne: req.params.id }, // Exclude current client
      });
      if (existingClient) {
        return res
          .status(400)
          .json({
            error: "One of these emails is already in use by another client",
          });
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
        companyName,
      },
      { new: true }
    ).populate("createdBy", "name email");

    res.json({
      message: "Client updated successfully",
      client: updatedClient,
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
      return res.status(404).json({ error: "Client not found" });
    }

    res.json({ message: "Client deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all unique company names
const getAllCompanyNames = async (req, res) => {
  try {
    const companyNames = await Client.distinct("companyName");
    res.json({ companyNames });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
  getAllCompanyNames, // Export the new controller
};
