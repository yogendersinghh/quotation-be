const Quotation = require('../models/Quotation');
const Client = require('../models/Client');
const User = require('../models/User');

const getDashboardStatistics = async (req, res) => {
  try {
    const { userId } = req.body;

    let user = null;
    let filter = {};

    if (userId) {
      // Verify if the user exists
      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      filter.createdBy = userId;
    }

    // Get total quotations (filtered by user if userId is present)
    const totalQuotations = await Quotation.countDocuments(filter);

    // Get quotations pending admin approval (status is 'draft')
    const pendingApproval = await Quotation.countDocuments({ 
      ...filter,
      status: 'draft'
    });

    // Get clients created (filtered by user if userId is present)
    const clientsCreated = await Client.countDocuments(filter);

    // Get quotations by conversion status
    const underDevelopment = await Quotation.countDocuments({ 
      ...filter,
      converted: 'Under Development'
    });
    const booked = await Quotation.countDocuments({ 
      ...filter,
      converted: 'Booked'
    });
    const lost = await Quotation.countDocuments({ 
      ...filter,
      converted: 'Lost'
    });

    res.json({
      success: true,
      data: {
        user: user
          ? {
              id: user._id,
              name: user.name,
              email: user.email
            }
          : null,
        totalQuotations,
        pendingApproval,
        clientsCreated,
        conversionStats: {
          underDevelopment,
          booked,
          lost
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStatistics
}; 