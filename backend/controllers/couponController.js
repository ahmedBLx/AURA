const couponService = require('../services/couponService');

class CouponController {
  async getCoupons(req, res, next) {
    try {
      const coupons = await couponService.getCoupons();
      res.status(200).json({
        status: 'success',
        data: { coupons },
      });
    } catch (err) {
      next(err);
    }
  }

  async createCoupon(req, res, next) {
    try {
      const { code, discountPercent, expiresAt } = req.body;
      const coupon = await couponService.createCoupon({
        code,
        discountPercent: Number(discountPercent),
        expiresAt,
      });

      res.status(201).json({
        status: 'success',
        data: { coupon },
      });
    } catch (err) {
      next(err);
    }
  }

  async validateCoupon(req, res, next) {
    try {
      const { code } = req.body;
      const result = await couponService.validateCoupon(code);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteCoupon(req, res, next) {
    try {
      await couponService.deleteCoupon(req.params.id);
      res.status(200).json({
        status: 'success',
        message: 'Coupon deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CouponController();
