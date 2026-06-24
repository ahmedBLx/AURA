const BaseRepository = require('./baseRepository');
const Category = require('../models/Category');

class CategoryRepository extends BaseRepository {
  constructor() {
    super(Category);
  }

  async findByName(name) {
    return this.model.findOne({ name: new RegExp(`^${name}$`, 'i') });
  }

  async findSubcategories(parentId) {
    return this.model.find({ parent: parentId });
  }

  async findAllPopulated(filter = {}, sort = { name: 1 }) {
    return this.model.find(filter).populate('parent', 'name').sort(sort).lean();
  }

  async findHomepageCategories() {
    return this.model
      .find({ showOnHomepage: true, parent: { $ne: null } })
      .populate('parent', 'name')
      .sort({ name: 1 })
      .lean();
  }

  async updateById(id, data) {
    return this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }
}

module.exports = new CategoryRepository();
