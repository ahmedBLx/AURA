const express = require('express');
const settingController = require('../controllers/settingController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/public', settingController.getPublicSettings);

router.use(protect);
router.use(restrictTo('admin')); // Only admin can access and change settings

router.get('/', settingController.getSettings);
router.post('/', settingController.updateSetting);
router.post('/landing-hero-image', upload.single('image'), settingController.uploadLandingHeroImage);

module.exports = router;
