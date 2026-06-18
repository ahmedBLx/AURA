const express = require('express');
const orderController = require('../controllers/orderController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { validateCreateOrder, validateUpdateOrderStatus } = require('../validators/orderValidator');
const validate = require('../middleware/validate');

const router = express.Router();

// Public Checkout Route
router.post('/', validateCreateOrder, validate, orderController.createOrder);

// Admin-only operations
router.get('/', protect, restrictTo('admin'), orderController.getOrders);
router.get('/:id', protect, restrictTo('admin'), orderController.getOrderById);
router.patch(
  '/:orderId/status',
  protect,
  restrictTo('admin'),
  validateUpdateOrderStatus,
  validate,
  orderController.updateOrderStatus
);
router.delete('/completed', protect, restrictTo('admin'), orderController.deleteCompletedOrders);
router.delete('/:orderId', protect, restrictTo('admin'), orderController.deleteOrder);

module.exports = router;
