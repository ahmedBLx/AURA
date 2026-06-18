const reviewService = require('../services/reviewService');

class ReviewController {
  async getProductReviews(req, res, next) {
    try {
      const { productId } = req.params;
      const data = await reviewService.getProductReviews(productId);

      res.status(200).json({
        status: 'success',
        data
      });
    } catch (err) {
      next(err);
    }
  }

  async createReview(req, res, next) {
    try {
      const { rating, comment } = req.body;
      const { productId } = req.params;
      const userId = req.user._id;

      const data = await reviewService.createReview({
        productId,
        userId,
        rating: Number(rating),
        comment
      });

      res.status(201).json({
        status: 'success',
        data
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteReview(req, res, next) {
    try {
      const { reviewId } = req.params;
      const userId = req.user._id;
      const userRole = req.user.role;

      const data = await reviewService.deleteReview(reviewId, userId, userRole);

      res.status(200).json({
        status: 'success',
        data
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ReviewController();
