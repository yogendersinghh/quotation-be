const Quotation = require('../models/Quotation');
const Client = require('../models/Client');
const User = require('../models/User');

const getDashboardStatistics = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required in the request payload'
      });
    }

    // Verify if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get total quotations for specified user
    const totalQuotations = await Quotation.countDocuments({ createdBy: userId });

    // Get quotations pending admin approval (status is 'draft') for specified user
    const pendingApproval = await Quotation.countDocuments({ 
      createdBy: userId,
      status: 'draft'
    });

    // Get clients created by specified user
    const clientsCreated = await Client.countDocuments({ createdBy: userId });

    // Get quotations by conversion status for specified user
    const underDevelopment = await Quotation.countDocuments({ 
      createdBy: userId,
      converted: 'Under Development'
    });
    const booked = await Quotation.countDocuments({ 
      createdBy: userId,
      converted: 'Booked'
    });
    const lost = await Quotation.countDocuments({ 
      createdBy: userId,
      converted: 'Lost'
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        },
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