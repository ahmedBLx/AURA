const mongoose = require('mongoose');
const EventEmitter = require('events');
const crypto = require('crypto');
const { runInTransaction } = require('../utils/transactionHelper');
const orderRepository = require('../repositories/orderRepository');
const orderItemRepository = require('../repositories/orderItemRepository');
const productRepository = require('../repositories/productRepository');
const auditLogRepository = require('../repositories/auditLogRepository');
const notificationRepository = require('../repositories/notificationRepository');
const adminRepository = require('../repositories/adminRepository');
const settingRepository = require('../repositories/settingRepository');
const AppError = require('../utils/appError');
const Admin = require('../models/Admin');

class OrderEmitter extends EventEmitter {}
const orderEmitter = new OrderEmitter();

orderEmitter.on('orderCreated', async ({ order, customerName, pointsUsed, discountApplied, pointsEarned }) => {
  try {
    // 1. Audit Log (Guest Checkout)
    await auditLogRepository.create({
      user: null,
      userName: 'Guest Customer',
      action: 'PLACE_ORDER',
      details: pointsUsed > 0 
        ? `Customer ${customerName} placed order ${order.orderId}. Total: EGP ${order.total.toFixed(2)}. Used ${pointsUsed} pts (EGP ${discountApplied} discount). Earned ${pointsEarned} pts.`
        : `Guest ${customerName} placed order ${order.orderId}. Total: EGP ${order.total.toFixed(2)}`,
      ipAddress: 'System',
    });

    // 2. Notify Admins
    const admins = await Admin.find({ role: 'admin' });
    for (const admin of admins) {
      await notificationRepository.create({
        recipient: admin._id,
        message: pointsUsed > 0
          ? `New order placed: ${order.orderId} by ${customerName}. Total: EGP ${order.total.toFixed(2)}. Points used: ${pointsUsed}.`
          : `New order placed: ${order.orderId} by ${customerName}. Total: EGP ${order.total.toFixed(2)}`,
        type: 'order',
      });
    }
  } catch (err) {
    console.error('Error handling orderCreated event asynchronously:', err);
  }
});

class OrderService {
  async getOrders(filter = {}, pagination = {}) {
    return orderRepository.findAllDetailed(filter, { createdAt: -1 }, pagination);
  }

  async getOrderById(id) {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    return order;
  }

  async createOrder({
    customerName,
    customerPhone,
    customerAlternativePhone,
    customerAddress,
    customerGovernorate,
    customerCity,
    notes,
    paymentMethod,
    items,
    orderType,
  }) {
    if (!items || items.length === 0) {
      throw new AppError('Cart cannot be empty to place an order', 400);
    }

    // 1. Validate items & check stock availability
    const itemsToCreate = [];
    let orderTotal = 0;

    for (const item of items) {
      const product = await productRepository.findById(item.productId);
      if (!product) {
        throw new AppError(`Product with ID ${item.productId} not found`, 404);
      }

      if (product.stock < item.quantity) {
        throw new AppError(`Product "${product.name}" has insufficient stock. Available: ${product.stock}, Requested: ${item.quantity}`, 400);
      }

      const price = product.price * (1 - (product.discountPercent || 0) / 100);
      orderTotal += price * item.quantity;

      itemsToCreate.push({
        product: product._id,
        productName: product.name,
        price,
        size: item.size,
        quantity: item.quantity,
      });
    }

    // Generate unique order ID
    const orderId = 'ORD-' + crypto.randomBytes(5).toString('hex').toUpperCase();

    // Calculate shipping cost from settings
    let shippingCost = 0;
    if (orderType !== 'Store Reservation') {
      try {
        const shippingRatesSetting = await settingRepository.findByKey('shipping_rates');
        if (shippingRatesSetting && Array.isArray(shippingRatesSetting.value)) {
          const foundRate = shippingRatesSetting.value.find(
            r => r.governorate.trim().toLowerCase() === customerGovernorate.trim().toLowerCase()
          );
          if (foundRate) {
            shippingCost = Number(foundRate.cost) || 0;
          }
        }
      } catch (err) {
        console.error('Error fetching shipping rates settings:', err);
      }
    }

    // 2. Create Order document (initial status Pending)
    const order = await orderRepository.create({
      orderId,
      customerName,
      customerPhone,
      customerAlternativePhone: customerAlternativePhone || '',
      customerAddress: orderType === 'Store Reservation' ? '' : customerAddress,
      customerGovernorate: orderType === 'Store Reservation' ? '' : customerGovernorate,
      customerCity: orderType === 'Store Reservation' ? '' : customerCity,
      notes: notes || '',
      paymentMethod: orderType === 'Store Reservation' ? 'Pay in Store' : paymentMethod,
      total: orderTotal + shippingCost,
      shippingCost,
      status: 'Pending',
      orderType: orderType || 'Delivery',
    });

    // 3. Create OrderItems documents
    const createdItems = [];
    for (const itemData of itemsToCreate) {
      const orderItem = await orderItemRepository.create({
        ...itemData,
        order: order._id,
      });
      createdItems.push(orderItem._id);
    }

    // 4. Update Order with item references
    order.items = createdItems;
    await order.save();

    // 5. Emit orderCreated event for async audit logging & admin notifications
    orderEmitter.emit('orderCreated', { order, customerName, pointsUsed: 0, discountApplied: 0, pointsEarned: 0 });

    return orderRepository.findById(order._id);
  }

  async updateOrderStatus(orderId, newStatus, adminUserId) {
    return runInTransaction(async (session) => {
      const Order = require('../models/Order');
      const Product = require('../models/Product');
      const Customer = require('../models/Customer');
      const AuditLog = require('../models/AuditLog');
      
      const order = await Order.findOne({ orderId }).session(session).populate('items');
      if (!order) {
        throw new AppError('Order not found', 404);
      }

      const oldStatus = order.status;
      if (oldStatus === newStatus) {
        return order;
      }

      const opts = session ? { session } : {};

      // 1. Completed Status Transition (newStatus === 'Completed')
      if (newStatus === 'Completed') {
        // Stock Deduction: exactly once
        if (!order.stockDeducted) {
          for (const item of order.items) {
            const product = await Product.findById(item.product).session(session);
            if (!product) {
              throw new AppError(`Product for item ${item.productName} no longer exists`, 404);
            }
            product.stock = Math.max(0, product.stock - item.quantity);
            await product.save(opts);
          }
          order.stockDeducted = true;
        }

        // Loyalty Points Crediting: exactly once
        if (order.customerId && !order.pointsEarnedCredited) {
          const customer = await Customer.findById(order.customerId).session(session);
          if (customer) {
            customer.loyaltyPoints += order.pointsEarned || 0;
            customer.totalSpent += order.total || 0;
            customer.totalOrders += 1;
            await customer.save(opts);
          }
          order.pointsEarnedCredited = true;
        }
      }

      // 2. Transitioning OUT of Completed (oldStatus === 'Completed' && newStatus !== 'Completed')
      if (oldStatus === 'Completed' && newStatus !== 'Completed') {
        // Stock Restoration: exactly once
        if (order.stockDeducted) {
          for (const item of order.items) {
            if (item.product) {
              const product = await Product.findById(item.product).session(session);
              if (product) {
                product.stock += item.quantity;
                await product.save(opts);
              }
            }
          }
          order.stockDeducted = false;
        }

        // Loyalty Points Rollback: exactly once
        if (order.customerId && order.pointsEarnedCredited) {
          const customer = await Customer.findById(order.customerId).session(session);
          if (customer) {
            customer.loyaltyPoints = Math.max(0, customer.loyaltyPoints - (order.pointsEarned || 0));
            customer.totalSpent = Math.max(0, customer.totalSpent - (order.total || 0));
            customer.totalOrders = Math.max(0, customer.totalOrders - 1);
            await customer.save(opts);
          }
          order.pointsEarnedCredited = false;
        }
      }

      // 3. Cancelled Status Transition (newStatus === 'Cancelled')
      if (newStatus === 'Cancelled') {
        // Refund redeemed points: exactly once
        if (order.customerId && order.pointsUsed > 0 && !order.pointsUsedRefunded) {
          const customer = await Customer.findById(order.customerId).session(session);
          if (customer) {
            customer.loyaltyPoints += order.pointsUsed;
            await customer.save(opts);
          }
          order.pointsUsedRefunded = true;
        }
      }

      // 4. Transitioning OUT of Cancelled (oldStatus === 'Cancelled' && newStatus !== 'Cancelled')
      if (oldStatus === 'Cancelled' && newStatus !== 'Cancelled') {
        // Re-deduct redeemed points: exactly once
        if (order.customerId && order.pointsUsed > 0 && order.pointsUsedRefunded) {
          const customer = await Customer.findById(order.customerId).session(session);
          if (customer) {
            customer.loyaltyPoints = Math.max(0, customer.loyaltyPoints - order.pointsUsed);
            await customer.save(opts);
          }
          order.pointsUsedRefunded = false;
        }
      }

      // Update status
      order.status = newStatus;
      await order.save(opts);

      // Audit Log for status change
      const adminUser = await Admin.findById(adminUserId).session(session);
      const auditLog = new AuditLog({
        user: adminUserId,
        userName: adminUser ? adminUser.name : 'Admin',
        action: 'UPDATE_ORDER_STATUS',
        details: `Updated order ${order.orderId} status from ${oldStatus} to ${newStatus}`,
        ipAddress: 'System',
      });
      await auditLog.save(opts);

      // Re-fetch populated order to return consistent result
      const populated = await Order.findById(order._id).session(session).populate('items');
      return populated;
    });
  }

  async deleteOrder(orderId, adminUserId) {
    return runInTransaction(async (session) => {
      const Order = require('../models/Order');
      const OrderItem = require('../models/OrderItem');
      const Product = require('../models/Product');
      const Customer = require('../models/Customer');
      const AuditLog = require('../models/AuditLog');

      const order = await Order.findOne({ orderId }).session(session).populate('items');
      if (!order) {
        throw new AppError('Order not found', 404);
      }

      const opts = session ? { session } : {};

      // Rollback stock if stock was deducted
      if (order.stockDeducted) {
        for (const item of order.items) {
          if (item.product) {
            const product = await Product.findById(item.product).session(session);
            if (product) {
              product.stock += item.quantity;
              await product.save(opts);
            }
          }
        }
        order.stockDeducted = false;
      }

      // Rollback points/spent if credited
      if (order.customerId && order.pointsEarnedCredited) {
        const customer = await Customer.findById(order.customerId).session(session);
        if (customer) {
          customer.loyaltyPoints = Math.max(0, customer.loyaltyPoints - (order.pointsEarned || 0));
          customer.totalSpent = Math.max(0, customer.totalSpent - (order.total || 0));
          customer.totalOrders = Math.max(0, customer.totalOrders - 1);
          await customer.save(opts);
        }
        order.pointsEarnedCredited = false;
      }

      // Refund used points if order wasn't already Cancelled AND hasn't been refunded yet
      if (order.status !== 'Cancelled' && order.customerId && order.pointsUsed > 0 && !order.pointsUsedRefunded) {
        const customer = await Customer.findById(order.customerId).session(session);
        if (customer) {
          customer.loyaltyPoints += order.pointsUsed;
          await customer.save(opts);
        }
        order.pointsUsedRefunded = true;
      }

      // Delete items
      if (order.items) {
        for (const item of order.items) {
          await OrderItem.findByIdAndDelete(item._id).session(session);
        }
      }

      // Delete Order
      await Order.findByIdAndDelete(order._id).session(session);

      // Audit Log
      const adminUser = await Admin.findById(adminUserId).session(session);
      const auditLog = new AuditLog({
        user: adminUserId,
        userName: adminUser ? adminUser.name : 'Admin',
        action: 'DELETE_ORDER',
        details: `Deleted order ${orderId}`,
        ipAddress: 'System',
      });
      await auditLog.save(opts);

      return true;
    });
  }

  async deleteCompletedOrders(adminUserId) {
    return runInTransaction(async (session) => {
      const Order = require('../models/Order');
      const OrderItem = require('../models/OrderItem');
      const AuditLog = require('../models/AuditLog');

      const completedOrders = await Order.find({ status: 'Completed' }).session(session).populate('items');
      const opts = session ? { session } : {};

      for (const order of completedOrders) {
        if (order.items) {
          for (const item of order.items) {
            await OrderItem.findByIdAndDelete(item._id).session(session);
          }
        }
        await Order.findByIdAndDelete(order._id).session(session);
      }

      const adminUser = await Admin.findById(adminUserId).session(session);
      const auditLog = new AuditLog({
        user: adminUserId,
        userName: adminUser ? adminUser.name : 'Admin',
        action: 'DELETE_COMPLETED_ORDERS',
        details: `Cleared all completed orders from database (Count: ${completedOrders.length})`,
        ipAddress: 'System',
      });
      await auditLog.save(opts);

      return completedOrders.length;
    });
  }

  async createOrderWithLoyalty({
    customerName,
    customerPhone,
    customerAlternativePhone,
    customerAddress,
    customerGovernorate,
    customerCity,
    notes,
    paymentMethod,
    items,
    email,
    usePoints,
    orderType,
  }) {
    if (!items || items.length === 0) {
      throw new AppError('Cart cannot be empty to place an order', 400);
    }

    let session = null;
    try {
      try {
        session = await mongoose.startSession();
        session.startTransaction();
      } catch (e) {
        session = null;
      }

      const opts = session ? { session } : {};

      // 1. Calculate Cart Subtotal & check stock
      let orderSubtotal = 0;
      const itemsToCreate = [];

      for (const item of items) {
        const product = await productRepository.model.findById(item.productId).session(session || null);
        if (!product) {
          throw new AppError(`Product with ID ${item.productId} not found`, 404);
        }

        if (product.stock < item.quantity) {
          throw new AppError(`Product "${product.name}" has insufficient stock. Available: ${product.stock}, Requested: ${item.quantity}`, 400);
        }

        const price = product.price * (1 - (product.discountPercent || 0) / 100);
        orderSubtotal += price * item.quantity;

        itemsToCreate.push({
          product: product._id,
          productName: product.name,
          price,
          size: item.size,
          quantity: item.quantity,
        });
      }

      // 2. Fetch or create Customer Profile
      const Customer = require('../models/Customer');
      let customer = await Customer.findOne({ phoneNumber: customerPhone.trim() }).session(session || null);
      if (!customer) {
        customer = new Customer({
          phoneNumber: customerPhone.trim(),
          fullName: customerName.trim(),
          city: orderType === 'Store Reservation' ? '' : customerGovernorate.trim(),
          address: orderType === 'Store Reservation' ? '' : customerAddress.trim(),
          email: email ? email.trim() : '',
          loyaltyPoints: 0,
          totalOrders: 0,
          totalSpent: 0
        });
      } else {
        // Update contact details if changed
        customer.fullName = customerName.trim();
        if (orderType !== 'Store Reservation') {
          customer.address = customerAddress.trim();
          customer.city = customerGovernorate.trim();
        }
        if (email) customer.email = email.trim();
      }

      // 3. Resolve shipping cost
      let shippingCost = 0;
      if (orderType !== 'Store Reservation') {
        const settingRepository = require('../repositories/settingRepository');
        const shippingRatesSetting = await settingRepository.model.findOne({ key: 'shipping_rates' }).session(session || null);
        if (shippingRatesSetting && Array.isArray(shippingRatesSetting.value)) {
          const foundRate = shippingRatesSetting.value.find(
            r => r.governorate.trim().toLowerCase() === customerGovernorate.trim().toLowerCase()
          );
          if (foundRate) {
            shippingCost = Number(foundRate.cost) || 0;
          }
        }
      }

      // 4. Resolve Points Redemption
      let pointsUsed = 0;
      let discountApplied = 0;
      if (usePoints) {
        const currentPoints = customer.loyaltyPoints;
        if (currentPoints >= 1000) {
          const eligiblePoints = Math.floor(currentPoints / 1000) * 1000;
          const eligibleDiscount = (eligiblePoints / 1000) * 100;
          
          discountApplied = eligibleDiscount;
          if (discountApplied > orderSubtotal) {
            discountApplied = Math.floor(orderSubtotal / 100) * 100;
          }
          pointsUsed = (discountApplied / 100) * 1000;
        }
      }

      // Deduct used points
      if (pointsUsed > 0) {
        customer.loyaltyPoints -= pointsUsed;
      }

      const totalAfterDiscount = orderSubtotal - discountApplied;
      const finalPaidTotal = totalAfterDiscount + shippingCost;

      // 5. Calculate Points Earned from final paid total
      const pointsEarned = Math.max(0, Math.round(finalPaidTotal));
      
      // Points, spent and order count will be credited when the order is completed
      await customer.save(opts);

      // 6. Generate order ID
      const Order = require('../models/Order');
      const orderId = 'ORD-' + crypto.randomBytes(5).toString('hex').toUpperCase();

      // 7. Save Order document
      const newOrder = new Order({
        orderId,
        customerId: customer._id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAlternativePhone: customerAlternativePhone || '',
        customerAddress: orderType === 'Store Reservation' ? '' : customerAddress.trim(),
        customerGovernorate: orderType === 'Store Reservation' ? '' : customerGovernorate.trim(),
        customerCity: orderType === 'Store Reservation' ? '' : customerCity.trim(),
        notes: notes || '',
        paymentMethod: orderType === 'Store Reservation' ? 'Pay in Store' : paymentMethod,
        subtotal: orderSubtotal,
        discountApplied,
        pointsEarned,
        pointsUsed,
        total: finalPaidTotal,
        shippingCost,
        status: 'Pending',
        orderType: orderType || 'Delivery',
      });
      await newOrder.save(opts);

      // 8. Create OrderItem documents
      const OrderItem = require('../models/OrderItem');
      const createdItemIds = [];
      for (const itemData of itemsToCreate) {
        const orderItem = new OrderItem({
          ...itemData,
          order: newOrder._id
        });
        await orderItem.save(opts);
        createdItemIds.push(orderItem._id);
      }

      newOrder.items = createdItemIds;
      await newOrder.save(opts);

      // Commit transaction
      if (session) {
        await session.commitTransaction();
      }

      // 9. Emit orderCreated event for async audit logging & admin notifications
      orderEmitter.emit('orderCreated', { order: newOrder, customerName, pointsUsed, discountApplied, pointsEarned });

      // Re-fetch populated order to return detailed response
      const orderRepository = require('../repositories/orderRepository');
      return orderRepository.findById(newOrder._id);

    } catch (err) {
      if (session) {
        await session.abortTransaction();
      }
      throw err;
    } finally {
      if (session) {
        session.endSession();
      }
    }
  }

  async cleanupExpiredReservations() {
    try {
      await runInTransaction(async (session) => {
        const Order = require('../models/Order');
        const OrderItem = require('../models/OrderItem');
        const AuditLog = require('../models/AuditLog');
        const Product = require('../models/Product');
        const Customer = require('../models/Customer');

        const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
        const opts = session ? { session } : {};

        const expiredReservations = await Order.find({
          orderType: 'Store Reservation',
          status: 'Pending',
          createdAt: { $lt: cutoffTime }
        }).session(session).populate('items');

        if (expiredReservations.length > 0) {
          const ids = expiredReservations.map(o => o._id);
          const orderIds = expiredReservations.map(o => o.orderId);

          for (const order of expiredReservations) {
            // Restore stock if stock was deducted (safety check)
            if (order.stockDeducted) {
              for (const item of order.items) {
                if (item.product) {
                  const product = await Product.findById(item.product).session(session);
                  if (product) {
                    product.stock += item.quantity;
                    await product.save(opts);
                  }
                }
              }
              order.stockDeducted = false;
            }

            // Refund points used
            if (order.customerId && order.pointsUsed > 0 && !order.pointsUsedRefunded) {
              const customer = await Customer.findById(order.customerId).session(session);
              if (customer) {
                customer.loyaltyPoints += order.pointsUsed;
                await customer.save(opts);
              }
              order.pointsUsedRefunded = true;
            }
          }

          // Delete items and orders using Mongoose deleteMany with option object
          await OrderItem.deleteMany({ order: { $in: ids } }, { session });
          await Order.deleteMany({ _id: { $in: ids } }, { session });

          const auditLog = new AuditLog({
            user: null,
            userName: 'System Scheduler',
            action: 'AUTO_CANCEL_RESERVATIONS',
            details: `Automatically deleted ${expiredReservations.length} expired reservations: ${orderIds.join(', ')}`,
            ipAddress: 'System',
          });
          await auditLog.save(opts);

          console.log(`[CLEANUP] Deleted ${expiredReservations.length} expired reservations.`);
        }
      });
    } catch (err) {
      console.error('Error during cleanup of expired reservations:', err);
    }
  }
}

module.exports = new OrderService();
