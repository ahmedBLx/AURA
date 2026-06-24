const BaseRepository = require('./baseRepository');
const Product = require('../models/Product');

class ProductRepository extends BaseRepository {
  constructor() {
    super(Product);
  }

  async findWithFilters({ search, categories, minPrice, maxPrice, sort, skip, limit }) {
    const filter = {};

    if (search) {
      filter.$text = { $search: search };
    }

    if (categories && categories.length > 0) {
      filter.categories = { $in: categories };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    let sortOption = {};
    if (sort) {
      if (sort === 'price_asc') sortOption.price = 1;
      else if (sort === 'price_desc') sortOption.price = -1;
      else if (sort === 'name_asc') sortOption.name = 1;
      else if (sort === 'name_desc') sortOption.name = -1;
      else if (sort === 'stock_asc') sortOption.stock = 1;
      else if (sort === 'stock_desc') sortOption.stock = -1;
      else sortOption.createdAt = -1;
    } else {
      sortOption.createdAt = -1;
    }

    const query = this.model.find(filter).sort(sortOption).lean();

    if (skip !== undefined) {
      query.skip(Number(skip));
    }
    if (limit !== undefined) {
      query.limit(Number(limit));
    }

    const [items, total] = await Promise.all([
      query,
      this.model.countDocuments(filter),
    ]);

    return { items, total };
  }

  async findByName(name) {
    return this.model.findOne({ name: new RegExp(`^${name}$`, 'i') });
  }
}

module.exports = new ProductRepository();
