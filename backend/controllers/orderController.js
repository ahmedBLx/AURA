const orderService = require('../services/orderService');
const AppError = require('../utils/appError');

class OrderController {
  async getOrders(req, res, next) {
    try {
      const { status, page, limit } = req.query;

      const currentPage = parseInt(page, 10) || 1;
      const currentLimit = parseInt(limit, 10) || 50;
      const skip = (currentPage - 1) * currentLimit;

      const filter = {};
      if (status) {
        filter.status = status;
      }

      const orders = await orderService.getOrders(filter, { skip, limit: currentLimit });

      res.status(200).json({
        status: 'success',
        results: orders.length,
        page: currentPage,
        data: { orders },
      });
    } catch (err) {
      next(err);
    }
  }

  async getOrderById(req, res, next) {
    try {
      const order = await orderService.getOrderById(req.params.id);
      
      // All requests are protected by authMiddleware so req.user is the Admin
      res.status(200).json({
        status: 'success',
        data: { order },
      });
    } catch (err) {
      next(err);
    }
  }

  async createOrder(req, res, next) {
    try {
      const {
        customerName,
        customerPhone,
        customerAlternativePhone,
        customerAddress,
        customerGovernorate,
        customerCity,
        notes,
        paymentMethod,
        items,
      } = req.body;

      const order = await orderService.createOrder({
        customerName,
        customerPhone,
        customerAlternativePhone,
        customerAddress,
        customerGovernorate,
        customerCity,
        notes,
        paymentMethod,
        items,
      });

      // Emit real-time Socket.IO event
      const io = req.app.get('io');
      if (io) {
        io.emit('newOrder', {
          orderId: order.orderId,
          customerName: order.customerName,
          total: order.total,
        });
      }

      res.status(201).json({
        status: 'success',
        data: { order },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateOrderStatus(req, res, next) {
    try {
      const { status } = req.body;
      const { orderId } = req.params;

      const order = await orderService.updateOrderStatus(orderId, status, req.user._id);

      res.status(200).json({
        status: 'success',
        data: { order },
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteOrder(req, res, next) {
    try {
      const { orderId } = req.params;
      await orderService.deleteOrder(orderId, req.user._id);

      res.status(200).json({
        status: 'success',
        message: 'Order successfully deleted',
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteCompletedOrders(req, res, next) {
    try {
      const count = await orderService.deleteCompletedOrders(req.user._id);

      res.status(200).json({
        status: 'success',
        message: `${count} completed orders successfully deleted`,
        count,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new OrderController();
