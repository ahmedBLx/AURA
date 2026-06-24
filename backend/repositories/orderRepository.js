const BaseRepository = require('./baseRepository');
const Order = require('../models/Order');

class OrderRepository extends BaseRepository {
  constructor() {
    super(Order);
  }

  async findByOrderId(orderId) {
    return this.model.findOne({ orderId }).populate({
      path: 'items',
      populate: { path: 'product' }
    }).lean();
  }

  async findByUser(userId, filter = {}, sort = { createdAt: -1 }) {
    return this.model.find({ user: userId, ...filter })
      .sort(sort)
      .populate({
        path: 'items',
        populate: { path: 'product' }
      })
      .lean();
  }

  async findAllDetailed(filter = {}, sort = { createdAt: -1 }, pagination = {}) {
    const query = this.model.find(filter).sort(sort).populate({
      path: 'items',
      populate: { path: 'product' }
    }).lean();

    if (pagination.skip !== undefined) {
      query.skip(pagination.skip);
    }
    if (pagination.limit !== undefined) {
      query.limit(pagination.limit);
    }

    return query;
  }
}

module.exports = new OrderRepository();
