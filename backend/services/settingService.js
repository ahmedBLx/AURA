const settingRepository = require('../repositories/settingRepository');

class SettingService {
  async getSettings() {
    return settingRepository.findAll({}, { key: 1 });
  }

  async getSettingByKey(key) {
    return settingRepository.findByKey(key);
  }

  async updateSetting({ key, value, description }) {
    return settingRepository.set(key, value, description);
  }
}

module.exports = new SettingService();
