const express = require('express');
const couponController = require('../controllers/couponController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { validateCreateCoupon } = require('../validators/couponValidator');
const validate = require('../middleware/validate');

const router = express.Router();

// Public/Customer routes
router.post('/validate', protect, couponController.validateCoupon);

// Admin-only routes
router.get('/', protect, restrictTo('admin'), couponController.getCoupons);
router.post('/', protect, restrictTo('admin'), validateCreateCoupon, validate, couponController.createCoupon);
router.delete('/:id', protect, restrictTo('admin'), couponController.deleteCoupon);

module.exports = router;
