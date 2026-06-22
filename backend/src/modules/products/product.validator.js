const { body } = require('express-validator');

const validateCreateProduct = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required'),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price cannot be negative'),
  body('desc')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock cannot be negative'),
  body('discountPercent')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percent must be between 0 and 100'),
  body('categories')
    .notEmpty()
    .withMessage('Categories are required')
    .isArray({ min: 1 })
    .withMessage('At least one category must be selected'),
  body('sizes')
    .optional()
    .isArray()
    .withMessage('Sizes must be an array of strings'),
  body('img')
    .optional()
    .isString(),
];

const validateUpdateProduct = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Product name cannot be empty'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price cannot be negative'),
  body('desc')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock cannot be negative'),
  body('discountPercent')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percent must be between 0 and 100'),
  body('categories')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one category must be selected when updating categories'),
  body('sizes')
    .optional()
    .isArray()
    .withMessage('Sizes must be an array of strings'),
  body('img')
    .optional()
    .isString(),
];

module.exports = {
  validateCreateProduct,
  validateUpdateProduct,
};
