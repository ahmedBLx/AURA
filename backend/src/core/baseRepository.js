class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    return this.model.create(data);
  }

  async findById(id) {
    return this.model.findById(id);
  }

  async findOne(filter) {
    return this.model.findOne(filter);
  }

  async findAll(filter = {}, sort = {}, pagination = {}) {
    const query = this.model.find(filter).sort(sort);
    
    if (pagination.skip !== undefined) {
      query.skip(pagination.skip);
    }
    if (pagination.limit !== undefined) {
      query.limit(pagination.limit);
    }
    
    return query;
  }

  async count(filter = {}) {
    return this.model.countDocuments(filter);
  }

  async update(id, data) {
    return this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async delete(id) {
    return this.model.findByIdAndDelete(id);
  }
}

module.exports = BaseRepository;
