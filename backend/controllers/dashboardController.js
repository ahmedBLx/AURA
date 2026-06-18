const Order = require('../models/Order');
const Product = require('../models/Product');
const Admin = require('../models/Admin');

class DashboardController {
  async getMetrics(req, res, next) {
    try {
      // 1. Calculate Total Revenue from Completed orders
      const revenueResult = await Order.aggregate([
        { $match: { status: 'Completed' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]);
      const totalRevenue = revenueResult[0] ? revenueResult[0].total : 0;

      // 2. Count Total Orders
      const totalOrders = await Order.countDocuments();

      // 3. Count Total Customers (distinct customerPhone in Order collection)
      const uniquePhones = await Order.distinct('customerPhone');
      const totalCustomers = uniquePhones.length;

      // 4. Count Total Products
      const totalProducts = await Product.countDocuments();

      // 5. Retrieve Recent Orders (last 10 orders, sorted by newest, populated with items)
      const recentOrders = await Order.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate({
          path: 'items',
          populate: { path: 'product' }
        });

      // 6. Retrieve Low Stock Products (stock <= 5)
      const lowStockProducts = await Product.find({ stock: { $lte: 5 } });

      res.status(200).json({
        status: 'success',
        data: {
          metrics: {
            totalRevenue,
            totalOrders,
            totalCustomers,
            totalProducts,
          },
          recentOrders,
          lowStockProducts,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DashboardController();
