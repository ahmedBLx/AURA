const express = require('express');
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/product/:productId', reviewController.getProductReviews);
router.post('/product/:productId', protect, reviewController.createReview);
router.delete('/:reviewId', protect, reviewController.deleteReview);

module.exports = router;
