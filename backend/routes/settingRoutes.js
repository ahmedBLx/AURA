const express = require('express');
const settingController = require('../controllers/settingController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/public', settingController.getPublicSettings);

router.use(protect);
router.use(restrictTo('admin')); // Only admin can access and change settings

router.get('/', settingController.getSettings);
router.post('/', settingController.updateSetting);

module.exports = router;
