const couponRepository = require('../repositories/couponRepository');
const AppError = require('../utils/appError');

class CouponService {
  async getCoupons() {
    return couponRepository.findAll({}, { createdAt: -1 });
  }

  async createCoupon({ code, discountPercent, expiresAt }) {
    const existing = await couponRepository.findByCode(code);
    if (existing) {
      throw new AppError('Coupon code already exists', 400);
    }

    return couponRepository.create({
      code: code.toUpperCase(),
      discountPercent,
      expiresAt: new Date(expiresAt),
      isActive: true
    });
  }

  async validateCoupon(code) {
    const coupon = await couponRepository.findByCode(code);
    if (!coupon) {
      throw new AppError('Invalid coupon code', 404);
    }

    if (!coupon.isActive) {
      throw new AppError('Coupon is inactive', 400);
    }

    if (new Date(coupon.expiresAt) < new Date()) {
      throw new AppError('Coupon has expired', 400);
    }

    return {
      code: coupon.code,
      discountPercent: coupon.discountPercent
    };
  }

  async deleteCoupon(id) {
    const coupon = await couponRepository.delete(id);
    if (!coupon) {
      throw new AppError('Coupon not found', 404);
    }
    return coupon;
  }
}

module.exports = new CouponService();
