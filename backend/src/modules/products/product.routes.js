const express = require('express');
const productController = require('./product.controller');
const { protect, restrictTo } = require('../../middleware/authMiddleware');
const upload = require('../../middleware/uploadMiddleware');
const { validateCreateProduct, validateUpdateProduct } = require('./product.validator');
const validate = require('../../middleware/validate');

const router = express.Router();

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

router.get('/', productController.getProducts);

router.get(
  '/upload-signature',
  protect,
  restrictTo('admin'),
  productController.getUploadSignature
);

router.get('/:id', productController.getProductById);

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
