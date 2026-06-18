const { body } = require('express-validator');

const validateCreateCoupon = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Coupon code is required')
    .isLength({ min: 3 })
    .withMessage('Coupon code must be at least 3 characters long'),
  body('discountPercent')
    .notEmpty()
    .withMessage('Discount percentage is required')
    .isInt({ min: 1, max: 100 })
    .withMessage('Discount must be between 1 and 100'),
  body('expiresAt')
    .notEmpty()
    .withMessage('Expiry date is required')
    .isISO8601()
    .withMessage('Please provide a valid ISO expiry date'),
];

module.exports = {
  validateCreateCoupon,
};
