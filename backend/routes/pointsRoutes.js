const express = require('express');
const pointsController = require('../controllers/pointsController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/calculate', pointsController.calculatePoints);

// Admin-only endpoints to prevent unauthorized points adjustments
router.use(protect);
router.use(restrictTo('admin'));
router.post('/redeem', pointsController.redeemPoints);
router.post('/earn', pointsController.earnPoints);

module.exports = router;
