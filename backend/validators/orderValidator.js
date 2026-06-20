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
    .if((value, { req }) => req.body.orderType === 'Store Reservation')
    .trim()
    .notEmpty()
    .withMessage('Second phone number is required'),
  body('customerAlternativePhone')
    .if((value, { req }) => req.body.orderType !== 'Store Reservation')
    .optional({ checkFalsy: true })
    .trim()
    .isString(),
  body('customerAddress')
    .if((value, { req }) => req.body.orderType !== 'Store Reservation')
    .trim()
    .notEmpty()
    .withMessage('Shipping address is required'),
  body('customerGovernorate')
    .if((value, { req }) => req.body.orderType !== 'Store Reservation')
    .trim()
    .notEmpty()
    .withMessage('Governorate is required'),
  body('customerCity')
    .if((value, { req }) => req.body.orderType !== 'Store Reservation')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('notes')
    .optional({ checkFalsy: true })
    .trim()
    .isString(),
  body('paymentMethod')
    .if((value, { req }) => req.body.orderType !== 'Store Reservation')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['Cash on Delivery', 'Online Payment'])
    .withMessage('Payment method must be Cash on Delivery or Online Payment'),
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
