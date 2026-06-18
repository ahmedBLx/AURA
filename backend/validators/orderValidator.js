const { body } = require('express-validator');

const validateCreateOrder = [
  body('customerName')
    .trim()
    .notEmpty()
    .withMessage('Customer name is required'),
  body('customerPhone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
  body('customerAlternativePhone')
    .optional({ checkFalsy: true })
    .trim()
    .isString(),
  body('customerAddress')
    .trim()
    .notEmpty()
    .withMessage('Shipping address is required'),
  body('customerGovernorate')
    .trim()
    .notEmpty()
    .withMessage('Governorate is required'),
  body('customerCity')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('notes')
    .optional({ checkFalsy: true })
    .trim()
    .isString(),
  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['Cash on Delivery', 'Visa / Credit Card'])
    .withMessage('Payment method must be Cash on Delivery or Visa / Credit Card'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.productId')
    .notEmpty()
    .withMessage('Product ID is required for each item')
    .isMongoId()
    .withMessage('Invalid Product ID'),
  body('items.*.size')
    .notEmpty()
    .withMessage('Size is required for each item'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
];

const validateUpdateOrderStatus = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'])
    .withMessage('Status must be Pending, Processing, Shipped, Completed, or Cancelled'),
];

module.exports = {
  validateCreateOrder,
  validateUpdateOrderStatus,
};
