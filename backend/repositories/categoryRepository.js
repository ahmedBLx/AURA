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
}

module.exports = new CategoryRepository();
