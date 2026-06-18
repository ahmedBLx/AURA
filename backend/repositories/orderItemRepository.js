const BaseRepository = require('./baseRepository');
const OrderItem = require('../models/OrderItem');

class OrderItemRepository extends BaseRepository {
  constructor() {
    super(OrderItem);
  }

  async findByOrder(orderId) {
    return this.model.find({ order: orderId }).populate('product');
  }

  async createMany(items) {
    return this.model.insertMany(items);
  }
}

module.exports = new OrderItemRepository();
