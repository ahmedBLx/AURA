const BaseRepository = require('./baseRepository');
const Review = require('../models/Review');

class ReviewRepository extends BaseRepository {
  constructor() {
    super(Review);
  }

  async findByProduct(productId) {
    return this.model.find({ product: productId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
  }

  async findByUserAndProduct(userId, productId) {
    return this.model.findOne({ user: userId, product: productId });
  }

  async getAverageRating(productId) {
    const stats = await this.model.aggregate([
      { $match: { product: productId } },
      {
        $group: {
          _id: '$product',
          averageRating: { $avg: '$rating' },
          numReviews: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      return {
        averageRating: Math.round(stats[0].averageRating * 10) / 10,
        numReviews: stats[0].numReviews
      };
    } else {
      return {
        averageRating: 0,
        numReviews: 0
      };
    }
  }
}

module.exports = new ReviewRepository();
