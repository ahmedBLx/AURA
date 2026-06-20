const express = require('express');
const productController = require('../controllers/productController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { validateCreateProduct, validateUpdateProduct } = require('../validators/productValidator');
const validate = require('../middleware/validate');

const router = express.Router();

// Middleware to parse JSON strings from FormData arrays before validation
const parseFormDataArrays = (req, res, next) => {
  if (typeof req.body.categories === 'string') {
    try {
      req.body.categories = JSON.parse(req.body.categories);
    } catch (e) {
      req.body.categories = req.body.categories.split(',').map(c => c.trim());
    }
  }
  if (typeof req.body.sizes === 'string') {
    try {
      req.body.sizes = JSON.parse(req.body.sizes);
    } catch (e) {
      req.body.sizes = req.body.sizes.split(',').map(s => s.trim());
    }
  }
  next();
};

// Public routes
router.get('/', productController.getProducts);

// Admin-only upload signature (placed before /:id to prevent route clash)
router.get(
  '/upload-signature',
  protect,
  restrictTo('admin'),
  productController.getUploadSignature
);

router.get('/:id', productController.getProductById);

// Admin-only routes
router.post(
  '/',
  protect,
  restrictTo('admin'),
  upload.fields([{ name: 'img', maxCount: 1 }, { name: 'images', maxCount: 10 }]),
  parseFormDataArrays,
  validateCreateProduct,
  validate,
  productController.createProduct
);

router.patch(
  '/:id',
  protect,
  restrictTo('admin'),
  upload.fields([{ name: 'img', maxCount: 1 }, { name: 'images', maxCount: 10 }]),
  parseFormDataArrays,
  validateUpdateProduct,
  validate,
  productController.updateProduct
);

router.delete(
  '/:id',
  protect,
  restrictTo('admin'),
  productController.deleteProduct
);

module.exports = router;
