const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Please provide coupon code'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    discountPercent: {
      type: Number,
      required: [true, 'Please provide discount percentage'],
      min: [1, 'Discount must be at least 1%'],
      max: [100, 'Discount cannot exceed 100%'],
    },
    expiresAt: {
      type: Date,
      required: [true, 'Please provide expiry date'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

CouponSchema.index({ isActive: 1, expiresAt: 1 });

module.exports = mongoose.model('Coupon', CouponSchema);
