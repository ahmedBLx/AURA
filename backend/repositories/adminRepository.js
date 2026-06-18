const BaseRepository = require('./baseRepository');
const Admin = require('../models/Admin');

class AdminRepository extends BaseRepository {
  constructor() {
    super(Admin);
  }

  async findByEmail(email) {
    return this.model.findOne({ email: email.toLowerCase() });
  }

  async addRefreshToken(adminId, token, expiresAt) {
    return this.model.findByIdAndUpdate(
      adminId,
      { $push: { refreshTokens: { token, expiresAt } } },
      { new: true }
    );
  }

  async removeRefreshToken(adminId, token) {
    return this.model.findByIdAndUpdate(
      adminId,
      { $pull: { refreshTokens: { token } } },
      { new: true }
    );
  }
}

module.exports = new AdminRepository();
