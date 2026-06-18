const auditLogRepository = require('../repositories/auditLogRepository');

class AuditLogService {
  async getRecentLogs(limit = 100) {
    return auditLogRepository.findRecent(limit);
  }

  async createLog({ userId, userName, action, details, ipAddress }) {
    return auditLogRepository.create({
      user: userId,
      userName,
      action,
      details,
      ipAddress: ipAddress || 'Unknown'
    });
  }
}

module.exports = new AuditLogService();
