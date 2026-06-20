const express = require('express');
const customerController = require('../controllers/customerController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/phone/:phone', customerController.getCustomerByPhone);
router.get('/', protect, restrictTo('admin'), customerController.getCustomers);

module.exports = router;
