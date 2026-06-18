const orderRepository = require('../repositories/orderRepository');
const orderItemRepository = require('../repositories/orderItemRepository');
const productRepository = require('../repositories/productRepository');
const auditLogRepository = require('../repositories/auditLogRepository');
const notificationRepository = require('../repositories/notificationRepository');
const adminRepository = require('../repositories/adminRepository');
const AppError = require('../utils/appError');
const Admin = require('../models/Admin');

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
    let orderId;
    let isUnique = false;
    while (!isUnique) {
      orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
      const existing = await orderRepository.findOne({ orderId });
      if (!existing) isUnique = true;
    }

    // 2. Create Order document (initial status Pending)
    const order = await orderRepository.create({
      orderId,
      customerName,
      customerPhone,
      customerAlternativePhone: customerAlternativePhone || '',
      customerAddress,
      customerGovernorate,
      customerCity,
      notes: notes || '',
      paymentMethod,
      total: orderTotal,
      status: 'Pending',
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

    // 5. Audit Log (Guest Checkout)
    await auditLogRepository.create({
      user: null,
      userName: 'Guest Customer',
      action: 'PLACE_ORDER',
      details: `Guest ${customerName} placed order ${order.orderId}. Total: $${orderTotal.toFixed(2)}`,
      ipAddress: 'System',
    });

    // 6. Notify Admins
    const admins = await Admin.find({ role: 'admin' });
    for (const admin of admins) {
      await notificationRepository.create({
        recipient: admin._id,
        message: `New order placed: ${order.orderId} by ${customerName}. Total: $${orderTotal.toFixed(2)}`,
        type: 'order',
      });
    }

    return orderRepository.findById(order._id);
  }

  async updateOrderStatus(orderId, newStatus, adminUserId) {
    const order = await orderRepository.findByOrderId(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const oldStatus = order.status;
    if (oldStatus === newStatus) {
      return orderRepository.findByOrderId(order.orderId);
    }

    // Transition Logic for Stock Management
    if (newStatus === 'Completed' && oldStatus !== 'Completed') {
      for (const item of order.items) {
        if (!item.product) {
          throw new AppError(`Product for item ${item.productName} no longer exists`, 404);
        }
        const productId = item.product._id || item.product;
        const product = await productRepository.findById(productId);
        if (!product) {
          throw new AppError(`Product for item ${item.productName} no longer exists`, 404);
        }
        if (product.stock < item.quantity) {
          throw new AppError(`Cannot complete order. Product "${product.name}" is out of stock (Stock: ${product.stock}, Required: ${item.quantity})`, 400);
        }
      }

      for (const item of order.items) {
        const productId = item.product._id || item.product;
        const product = await productRepository.findById(productId);
        product.stock -= item.quantity;
        await product.save();
      }
    }

    if (oldStatus === 'Completed' && newStatus !== 'Completed') {
      for (const item of order.items) {
        if (item.product) {
          const productId = item.product._id || item.product;
          const product = await productRepository.findById(productId);
          if (product) {
            product.stock += item.quantity;
            await product.save();
          }
        }
      }
    }

    // Update status
    order.status = newStatus;
    await order.save();

    // Audit Log for status change
    const adminUser = await adminRepository.findById(adminUserId);
    await auditLogRepository.create({
      user: adminUserId,
      userName: adminUser ? adminUser.name : 'Admin',
      action: 'UPDATE_ORDER_STATUS',
      details: `Updated order ${order.orderId} status from ${oldStatus} to ${newStatus}`,
      ipAddress: 'System',
    });

    return orderRepository.findByOrderId(order.orderId);
  }

  async deleteOrder(orderId, adminUserId) {
    const order = await orderRepository.findByOrderId(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.items) {
      for (const item of order.items) {
        await orderItemRepository.delete(item._id);
      }
    }

    await orderRepository.delete(order._id);

    const adminUser = await adminRepository.findById(adminUserId);
    await auditLogRepository.create({
      user: adminUserId,
      userName: adminUser ? adminUser.name : 'Admin',
      action: 'DELETE_ORDER',
      details: `Deleted order ${orderId}`,
      ipAddress: 'System',
    });

    return true;
  }

  async deleteCompletedOrders(adminUserId) {
    const completedOrders = await orderRepository.model.find({ status: 'Completed' }).populate('items');
    
    for (const order of completedOrders) {
      if (order.items) {
        for (const item of order.items) {
          await orderItemRepository.delete(item._id);
        }
      }
      await orderRepository.delete(order._id);
    }

    const adminUser = await adminRepository.findById(adminUserId);
    await auditLogRepository.create({
      user: adminUserId,
      userName: adminUser ? adminUser.name : 'Admin',
      action: 'DELETE_COMPLETED_ORDERS',
      details: `Cleared all completed orders from database (Count: ${completedOrders.length})`,
      ipAddress: 'System',
    });

    return completedOrders.length;
  }
}

module.exports = new OrderService();
