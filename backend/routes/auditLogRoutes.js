const express = require('express');
const auditLogController = require('../controllers/auditLogController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(restrictTo('admin')); // Only admin can access audit logs

router.get('/', auditLogController.getRecentLogs);

module.exports = router;
