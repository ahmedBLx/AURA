const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a star rating'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, 'Please enter a review comment'],
      trim: true,
    },
  },
  { timestamps: true }
);

// Compound index to ensure a user can review a product only once
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);
