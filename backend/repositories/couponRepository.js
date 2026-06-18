const BaseRepository = require('./baseRepository');
const Coupon = require('../models/Coupon');

class CouponRepository extends BaseRepository {
  constructor() {
    super(Coupon);
  }

  async findByCode(code) {
    return this.model.findOne({ code: code.toUpperCase() });
  }

  async findActiveCoupons() {
    return this.model.find({ isActive: true, expiresAt: { $gt: new Date() } });
  }
}

module.exports = new CouponRepository();
