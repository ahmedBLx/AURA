const BaseRepository = require('./baseRepository');
const Notification = require('../models/Notification');

class NotificationRepository extends BaseRepository {
  constructor() {
    super(Notification);
  }

  async findByUser(userId, filter = {}) {
    return this.model.find({ recipient: userId, ...filter })
      .sort({ createdAt: -1 });
  }

  async markAllAsRead(userId) {
    return this.model.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true } }
    );
  }
}

module.exports = new NotificationRepository();
