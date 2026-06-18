const BaseRepository = require('./baseRepository');
const Setting = require('../models/Setting');

class SettingRepository extends BaseRepository {
  constructor() {
    super(Setting);
  }

  async findByKey(key) {
    return this.model.findOne({ key });
  }

  async set(key, value, description = '') {
    return this.model.findOneAndUpdate(
      { key },
      { key, value, description },
      { upsert: true, new: true, runValidators: true }
    );
  }
}

module.exports = new SettingRepository();
