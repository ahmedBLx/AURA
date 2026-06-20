const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customerName: {
      type: String,
      required: [true, 'Please provide customer name'],
      trim: true,
    },
    customerPhone: {
      type: String,
      required: [true, 'Please provide phone number'],
      trim: true,
    },
    customerAlternativePhone: {
      type: String,
      required: [function() { return this.orderType === 'Store Reservation'; }, 'Second phone number is required'],
      default: '',
      trim: true,
    },
    orderType: {
      type: String,
      enum: ['Delivery', 'Store Reservation'],
      default: 'Delivery',
    },
    customerAddress: {
      type: String,
      required: [function() { return this.orderType !== 'Store Reservation'; }, 'Please provide shipping address'],
      trim: true,
    },
    customerGovernorate: {
      type: String,
      required: [function() { return this.orderType !== 'Store Reservation'; }, 'Please provide governorate'],
      trim: true,
    },
    customerCity: {
      type: String,
      required: [function() { return this.orderType !== 'Store Reservation'; }, 'Please provide city'],
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash on Delivery', 'Online Payment', 'Pay in Store'],
      required: true,
    },
    total: {
      type: Number,
      required: true,
      min: [0, 'Total price cannot be negative'],
    },
    shippingCost: {
      type: Number,
      default: 0,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    discountApplied: {
      type: Number,
      default: 0,
    },
    pointsEarned: {
      type: Number,
      default: 0,
    },
    pointsUsed: {
      type: Number,
      default: 0,
    },
    stockDeducted: {
      type: Boolean,
      default: false,
    },
    pointsEarnedCredited: {
      type: Boolean,
      default: false,
    },
    pointsUsedRefunded: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrderItem',
      },
    ],
  },
  { timestamps: true }
);

OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ customerId: 1 });
OrderSchema.index({ orderType: 1, status: 1, createdAt: 1 });

module.exports = mongoose.model('Order', OrderSchema);
