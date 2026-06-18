const settingService = require('../services/settingService');

class SettingController {
  async getSettings(req, res, next) {
    try {
      const settings = await settingService.getSettings();
      res.status(200).json({
        status: 'success',
        data: { settings },
      });
    } catch (err) {
      next(err);
    }
  }

  async getPublicSettings(req, res, next) {
    try {
      const settings = await settingService.getSettings();
      res.status(200).json({
        status: 'success',
        data: { settings },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateSetting(req, res, next) {
    try {
      const { key, value, description } = req.body;
      const setting = await settingService.updateSetting({ key, value, description });

      res.status(200).json({
        status: 'success',
        data: { setting },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SettingController();
