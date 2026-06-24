const Order = require('../models/Order');
const Product = require('../models/Product');

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

      // 3. Count Total Customers (from new Customer collection)
      const Customer = require('../models/Customer');
      const totalCustomers = await Customer.countDocuments();

      // Loyalty metrics
      const pointsIssuedResult = await Customer.aggregate([
        { $group: { _id: null, totalPoints: { $sum: '$loyaltyPoints' } } }
      ]);
      const currentPoints = pointsIssuedResult[0] ? pointsIssuedResult[0].totalPoints : 0;

      const pointsRedeemedResult = await Order.aggregate([
        { $group: { _id: null, totalRedeemed: { $sum: '$pointsUsed' } } }
      ]);
      const totalLoyaltyPointsRedeemed = pointsRedeemedResult[0] ? pointsRedeemedResult[0].totalRedeemed : 0;
      const totalLoyaltyPointsIssued = currentPoints + totalLoyaltyPointsRedeemed;

      const mostLoyalCustomers = await Customer.find()
        .sort({ totalSpent: -1 })
        .limit(5)
        .lean();

      // 4. Count Total Products
      const totalProducts = await Product.countDocuments();

      // 5. Retrieve Recent Orders (last 10 orders, sorted by newest, populated with items)
      const recentOrders = await Order.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate({
          path: 'items',
          populate: { path: 'product' }
        })
        .lean();

      // 6. Retrieve Low Stock Products (stock <= 5)
      const lowStockProducts = await Product.find({ stock: { $lte: 5 } }).lean();

      res.status(200).json({
        status: 'success',
        data: {
          metrics: {
            totalRevenue,
            totalOrders,
            totalCustomers,
            totalProducts,
            totalLoyaltyPointsIssued,
            totalLoyaltyPointsRedeemed,
            mostLoyalCustomers,
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
