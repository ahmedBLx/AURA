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
      default: '',
      trim: true,
    },
    customerAddress: {
      type: String,
      required: [true, 'Please provide shipping address'],
      trim: true,
    },
    customerGovernorate: {
      type: String,
      required: [true, 'Please provide governorate'],
      trim: true,
    },
    customerCity: {
      type: String,
      required: [true, 'Please provide city'],
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash on Delivery', 'Visa / Credit Card'],
      required: true,
    },
    total: {
      type: Number,
      required: true,
      min: [0, 'Total price cannot be negative'],
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

module.exports = mongoose.model('Order', OrderSchema);
