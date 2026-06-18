const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide product name'],
      trim: true,
      unique: true,
    },
    price: {
      type: Number,
      required: [true, 'Please provide retail price'],
      min: [0, 'Price cannot be negative'],
    },
    img: {
      type: String,
      required: [true, 'Please provide image path/URL'],
    },
    images: {
      type: [String],
      default: [],
    },
    desc: {
      type: String,
      required: [true, 'Please provide description'],
      trim: true,
    },
    categories: {
      type: [String],
      required: [true, 'Please provide at least one category'],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Product must have at least one category',
      },
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    stock: {
      type: Number,
      required: [true, 'Please provide stock quantity'],
      min: [0, 'Stock cannot be negative'],
      default: 10,
    },
    sizes: {
      type: [String],
      default: ['39', '40', '41', '42', '43', '44', '45'],
    },
  },
  { timestamps: true }
);

// Indexes
ProductSchema.index({ categories: 1 });
ProductSchema.index({ name: 'text', desc: 'text' });

module.exports = mongoose.model('Product', ProductSchema);
