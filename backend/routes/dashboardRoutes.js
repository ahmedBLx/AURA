const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// Get admin dashboard metrics (restricted to admin users only)
router.get('/metrics', protect, restrictTo('admin'), dashboardController.getMetrics);

module.exports = router;
