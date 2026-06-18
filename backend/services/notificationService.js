const notificationRepository = require('../repositories/notificationRepository');

class NotificationService {
  async getNotifications(userId) {
    return notificationRepository.findByUser(userId);
  }

  async markAllAsRead(userId) {
    await notificationRepository.markAllAsRead(userId);
    return { success: true };
  }

  async createNotification({ userId, message, type }) {
    return notificationRepository.create({
      recipient: userId,
      message,
      type: type || 'info'
    });
  }
}

module.exports = new NotificationService();
