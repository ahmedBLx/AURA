const express = require('express');
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All notification routes require authentication

router.get('/', notificationController.getNotifications);
router.patch('/read-all', notificationController.markAllAsRead);

module.exports = router;
