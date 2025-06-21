const express = require('express');
const router = express.Router();
const { getDashboardStatistics } = require('../controllers/dashboardController');
const { auth,isAdmin } = require('../middleware/auth');

// GET /api/dashboard/statistics
router.post('/statistics', auth, getDashboardStatistics);

module.exports = router; 