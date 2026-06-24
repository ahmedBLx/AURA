const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide category name'],
      unique: true,
      trim: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    showOnHomepage: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

CategorySchema.index({ parent: 1, name: 1 });
CategorySchema.index({ showOnHomepage: 1, parent: 1, name: 1 });

module.exports = mongoose.model('Category', CategorySchema);
