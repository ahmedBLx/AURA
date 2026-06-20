const reviewRepository = require('../repositories/reviewRepository');
const productRepository = require('../repositories/productRepository');
const AppError = require('../utils/appError');

class ReviewService {
  async getProductReviews(productId) {
    const reviews = await reviewRepository.findByProduct(productId);
    const ratingStats = await reviewRepository.getAverageRating(productId);
    return {
      reviews,
      ...ratingStats
    };
  }

  async createReview({ productId, userId, rating, comment }) {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const existingReview = await reviewRepository.findByUserAndProduct(userId, productId);
    if (existingReview) {
      throw new AppError('You have already submitted a review for this product', 400);
    }

    const review = await reviewRepository.create({
      product: productId,
      user: userId,
      rating,
      comment
    });

    const populatedReview = await review.populate('user', 'name email');

    // Retrieve new rating stats
    const stats = await reviewRepository.getAverageRating(productId);

    return {
      review: populatedReview,
      stats
    };
  }

  async deleteReview(reviewId, userId, userRole) {
    const review = await reviewRepository.findById(reviewId);
    if (!review) {
      throw new AppError('Review not found', 404);
    }

    // Authorization check: User can delete their own review, or Admin can delete any
    if (review.user.toString() !== userId.toString() && userRole !== 'admin') {
      throw new AppError('You are not authorized to delete this review', 403);
    }

    await reviewRepository.delete(reviewId);

    const stats = await reviewRepository.getAverageRating(review.product);
    return { success: true, stats };
  }
}

module.exports = new ReviewService();
