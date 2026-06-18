const auditLogService = require('../services/auditLogService');

class AuditLogController {
  async getRecentLogs(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 100;
      const logs = await auditLogService.getRecentLogs(limit);

      res.status(200).json({
        status: 'success',
        results: logs.length,
        data: { logs },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuditLogController();
