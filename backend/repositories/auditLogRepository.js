const BaseRepository = require('./baseRepository');
const AuditLog = require('../models/AuditLog');

class AuditLogRepository extends BaseRepository {
  constructor() {
    super(AuditLog);
  }

  async findRecent(limit = 100) {
    return this.model.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('user', 'name email role');
  }

  async findByUser(userId, limit = 100) {
    return this.model.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}

module.exports = new AuditLogRepository();
