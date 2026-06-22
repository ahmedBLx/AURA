const express = require('express');
const authController = require('./auth.controller');
const { validateSignup, validateLogin } = require('./auth.validator');
const validate = require('../../middleware/validate');
const { protect, restrictTo } = require('../../middleware/authMiddleware');
const { authLimiter } = require('../../middleware/rateLimiter');

const router = express.Router();

router.post('/signup', authLimiter, validateSignup, validate, authController.signup);
router.post('/login', authLimiter, validateLogin, validate, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);
router.get('/users', protect, restrictTo('admin'), authController.getUsers);

module.exports = router;
