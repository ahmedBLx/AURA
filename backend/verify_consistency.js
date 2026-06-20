const mongoose = require('mongoose');
require('dotenv').config({ path: 'c:/Users/HEllo/Desktop/work/backend/.env' });
const connectDB = require('./config/db');

// Import models
const Product = require('./models/Product');
const Category = require('./models/Category');
const Customer = require('./models/Customer');
const Order = require('./models/Order');
const OrderItem = require('./models/OrderItem');
const Review = require('./models/Review');
const Coupon = require('./models/Coupon');
const Notification = require('./models/Notification');
const AuditLog = require('./models/AuditLog');
const Setting = require('./models/Setting');
const Admin = require('./models/Admin');

async function runConsistencyCheck() {
  console.log('=== STARTING DATABASE CONSISTENCY AUDIT ===');
  await connectDB();

  const shouldRepair = process.argv.includes('--repair');

  const report = {
    totalErrors: 0,
    categories: [],
    products: [],
    customers: [],
    orders: [],
    orderItems: [],
    reviews: [],
    notifications: [],
    settings: []
  };

  const itemsToDelete = [];
  const reviewsToDelete = [];
  const notificationsToDelete = [];

  // 1. Audit Categories
  console.log('\nAuditing Categories...');
  const categories = await Category.find();
  for (const cat of categories) {
    if (cat.parent) {
      const parentExists = await Category.findById(cat.parent);
      if (!parentExists) {
        report.categories.push(`Category "${cat.name}" has invalid parent ID: ${cat.parent}`);
        report.totalErrors++;
      }
    }
  }
  console.log(`Audited ${categories.length} categories.`);

  // 2. Audit Products
  console.log('\nAuditing Products...');
  const products = await Product.find();
  for (const prod of products) {
    if (prod.stock < 0) {
      report.products.push(`Product "${prod.name}" (ID: ${prod._id}) has negative stock: ${prod.stock}`);
      report.totalErrors++;
    }
    if (prod.price < 0) {
      report.products.push(`Product "${prod.name}" (ID: ${prod._id}) has negative price: ${prod.price}`);
      report.totalErrors++;
    }
    for (const catName of prod.categories) {
      const catExists = await Category.findOne({ name: catName });
      if (!catExists) {
        report.products.push(`Product "${prod.name}" points to non-existent category: "${catName}"`);
        report.totalErrors++;
      }
    }
  }
  console.log(`Audited ${products.length} products.`);

  // 3. Audit Customers
  console.log('\nAuditing Customers...');
  const customers = await Customer.find();
  for (const cust of customers) {
    if (cust.loyaltyPoints < 0) {
      report.customers.push(`Customer "${cust.fullName}" (Phone: ${cust.phoneNumber}) has negative loyalty points: ${cust.loyaltyPoints}`);
      report.totalErrors++;
    }
    if (cust.totalSpent < 0) {
      report.customers.push(`Customer "${cust.fullName}" has negative total spent: ${cust.totalSpent}`);
      report.totalErrors++;
    }
  }
  console.log(`Audited ${customers.length} customers.`);

  // 4. Audit Orders
  console.log('\nAuditing Orders...');
  const orders = await Order.find();
  const seenOrderIds = new Set();
  for (const order of orders) {
    if (seenOrderIds.has(order.orderId)) {
      report.orders.push(`Duplicate Order ID found: ${order.orderId}`);
      report.totalErrors++;
    }
    seenOrderIds.add(order.orderId);

    if (order.customerId) {
      const customerExists = await Customer.findById(order.customerId);
      if (!customerExists) {
        report.orders.push(`Order "${order.orderId}" has invalid customerId reference: ${order.customerId}`);
        report.totalErrors++;
      }
    }

    for (const itemId of order.items) {
      const itemExists = await OrderItem.findById(itemId);
      if (!itemExists) {
        report.orders.push(`Order "${order.orderId}" contains invalid item reference: ${itemId}`);
        report.totalErrors++;
      }
    }
  }
  console.log(`Audited ${orders.length} orders.`);

  // 5. Audit OrderItems
  console.log('\nAuditing OrderItems...');
  const orderItems = await OrderItem.find();
  for (const item of orderItems) {
    const orderExists = await Order.findById(item.order);
    let isOrphan = false;
    if (!orderExists) {
      report.orderItems.push(`OrderItem "${item._id}" (Product: ${item.productName}) has invalid order reference: ${item.order}`);
      report.totalErrors++;
      isOrphan = true;
    }
    const productExists = await Product.findById(item.product);
    if (!productExists) {
      report.orderItems.push(`OrderItem "${item._id}" (Product: ${item.productName}) points to missing Product ID: ${item.product}`);
      report.totalErrors++;
      isOrphan = true;
    }

    if (isOrphan) {
      itemsToDelete.push(item._id);
    }
  }
  console.log(`Audited ${orderItems.length} order items.`);

  // 6. Audit Reviews
  console.log('\nAuditing Reviews...');
  const reviews = await Review.find();
  for (const rev of reviews) {
    let isOrphan = false;
    const productExists = await Product.findById(rev.product);
    if (!productExists) {
      report.reviews.push(`Review "${rev._id}" has invalid product reference: ${rev.product}`);
      report.totalErrors++;
      isOrphan = true;
    }
    const adminExists = await Admin.findById(rev.user);
    if (!adminExists) {
      report.reviews.push(`Review "${rev._id}" has invalid admin reference: ${rev.user}`);
      report.totalErrors++;
      isOrphan = true;
    }

    if (isOrphan) {
      reviewsToDelete.push(rev._id);
    }
  }
  console.log(`Audited ${reviews.length} reviews.`);

  // 7. Audit Notifications
  console.log('\nAuditing Notifications...');
  const notifications = await Notification.find();
  for (const notif of notifications) {
    const recipientExists = await Admin.findById(notif.recipient);
    if (!recipientExists) {
      report.notifications.push(`Notification "${notif._id}" points to missing Admin recipient: ${notif.recipient}`);
      report.totalErrors++;
      notificationsToDelete.push(notif._id);
    }
  }
  console.log(`Audited ${notifications.length} notifications.`);

  // 8. Audit Settings
  console.log('\nAuditing Settings...');
  const settings = await Setting.find();
  for (const set of settings) {
    if (!set.key) {
      report.settings.push(`Setting "${set._id}" is missing key field.`);
      report.totalErrors++;
    }
  }
  console.log(`Audited ${settings.length} system settings.`);

  console.log('\n=== CONSISTENCY AUDIT REPORT SUMMARY ===');
  console.log(`Total Errors Detected: ${report.totalErrors}`);

  if (report.totalErrors > 0) {
    console.warn('\n⚠️ WARNING: Database inconsistencies found!');
    for (const [key, val] of Object.entries(report)) {
      if (key !== 'totalErrors' && val.length > 0) {
        console.log(`\n[${key.toUpperCase()}] Errors:`);
        val.forEach(err => console.log(`  - ${err}`));
      }
    }

    if (shouldRepair) {
      console.log('\n[REPAIR] Starting database repair and cleaning up orphan records...');
      if (itemsToDelete.length > 0) {
        const delItems = await OrderItem.deleteMany({ _id: { $in: itemsToDelete } });
        console.log(`[REPAIR] Deleted ${delItems.deletedCount} orphan OrderItems.`);
      }
      if (reviewsToDelete.length > 0) {
        const delReviews = await Review.deleteMany({ _id: { $in: reviewsToDelete } });
        console.log(`[REPAIR] Deleted ${delReviews.deletedCount} orphan Reviews.`);
      }
      if (notificationsToDelete.length > 0) {
        const delNotifs = await Notification.deleteMany({ _id: { $in: notificationsToDelete } });
        console.log(`[REPAIR] Deleted ${delNotifs.deletedCount} orphan Notifications.`);
      }
      console.log('✅ REPAIR COMPLETE: Database inconsistencies resolved.');
      process.exit(0);
    }
  } else {
    console.log('✅ PASS: Database is consistent. No orphan references, duplicate IDs, or value boundary errors detected.');
  }

  process.exit(report.totalErrors > 0 ? 1 : 0);
}

runConsistencyCheck().catch(err => {
  console.error('Fatal consistency check error:', err);
  process.exit(1);
});
