const express = require('express');
const categoryController = require('../controllers/categoryController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', categoryController.getCategories);

router.post(
  '/',
  protect,
  restrictTo('admin'),
  categoryController.createCategory
);

router.delete(
  '/:name',
  protect,
  restrictTo('admin'),
  categoryController.deleteCategory
);

module.exports = router;
