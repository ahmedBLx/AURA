const mongoose = require('mongoose');
require('dotenv').config({ path: 'c:/Users/HEllo/Desktop/work/backend/.env' });
const connectDB = require('./config/db');

// Import models
const Product = require('./models/Product');
const Category = require('./models/Category');
const Customer = require('./models/Customer');
const Order = require('./models/Order');
const OrderItem = require('./models/OrderItem');
const AuditLog = require('./models/AuditLog');
const Admin = require('./models/Admin');
const Notification = require('./models/Notification');

// Import services
const orderService = require('./services/orderService');
const categoryService = require('./services/categoryService');
const productService = require('./services/productService');

async function runEndToEndTest() {
  console.log('=== STARTING END-TO-END TRANSACTION AND IDEMPOTENCY HARDENING TEST ===');
  await connectDB();

  // Reset collections/test data
  const testPhone = '01055554444';
  const testCategoryName = 'Test-Category-E2E';
  const testProductName = 'Test-Product-E2E';

  await Customer.deleteOne({ phoneNumber: testPhone });
  await Order.deleteMany({ customerPhone: testPhone });
  await Product.deleteOne({ name: testProductName });

  // Cleanup category if exists
  const existingCat = await Category.findOne({ name: testCategoryName });
  if (existingCat) {
    await Product.updateMany({ categories: testCategoryName }, { $pull: { categories: testCategoryName } });
    await Category.deleteOne({ _id: existingCat._id });
  }

  // 1. Create Category
  console.log('\n[Step 1] Creating Category...');
  const mainMenCat = await Category.findOne({ name: 'Men' });
  if (!mainMenCat) {
    console.error('❌ FAIL: Main category Men not found. Run seeders first.');
    process.exit(1);
  }

  // Find or create admin to associate with actions
  let admin = await Admin.findOne({ role: 'admin' });
  if (!admin) {
    admin = await Admin.create({
      name: 'Temp Admin',
      email: 'tempadmin@aura.com',
      password: 'tempadminpass',
      role: 'admin'
    });
  }

  const category = await categoryService.createCategory({
    name: testCategoryName,
    parentId: mainMenCat._id.toString(),
    showOnHomepage: true,
    adminUserId: admin._id.toString()
  });
  console.log(`✅ PASS: Category created successfully (ID: ${category._id})`);

  // 2. Create Product
  console.log('\n[Step 2] Creating Product...');
  const product = await productService.createProduct({
    name: testProductName,
    price: 300,
    img: 'assets/sneaker_white.png',
    desc: 'E2E test shoe description',
    categories: ['Men', testCategoryName],
    stock: 10,
    sizes: ['42']
  }, admin._id.toString());
  console.log(`✅ PASS: Product created with stock: ${product.stock}`);

  // 3. Create Customer
  console.log('\n[Step 3] Initializing Customer with Starting Points...');
  const customer = new Customer({
    phoneNumber: testPhone,
    fullName: 'E2E Tester',
    city: 'Cairo',
    address: '456 Test Road',
    loyaltyPoints: 3000, // Starts with 3000 points (300 EGP discount)
    totalOrders: 0,
    totalSpent: 0
  });
  await customer.save();
  console.log(`✅ PASS: Customer created with starting points: ${customer.loyaltyPoints}`);

  // 4. Create Order (Checkout with points redemption)
  console.log('\n[Step 4] Checking out Order with 3000 points redeemed (300 EGP discount)...');
  const order = await orderService.createOrderWithLoyalty({
    customerName: customer.fullName,
    customerPhone: customer.phoneNumber,
    customerAlternativePhone: '',
    customerAddress: customer.address,
    customerGovernorate: 'Cairo',
    customerCity: customer.city,
    notes: 'Points redemption test',
    paymentMethod: 'Cash on Delivery',
    items: [{ productId: product._id.toString(), size: '42', quantity: 2 }],
    email: 'tester@e2e.com',
    usePoints: true
  });

  // Verify points were deducted immediately from customer balance
  let freshCustomer = await Customer.findById(customer._id);
  console.log('Customer points after checkout (should be 0):', freshCustomer.loyaltyPoints);
  console.log('Order total after points discount (Cart: 600 EGP, Shipping: 0, Discount: 300 EGP. Net: 300 EGP):', order.total);
  const expectedTotal = 600 - 300 + order.shippingCost;
  if (freshCustomer.loyaltyPoints === 0 && order.total === expectedTotal) {
    console.log('✅ PASS: Points successfully redeemed and deducted at checkout.');
  } else {
    console.error('❌ FAIL: Points deduction or total calculation failure.', { points: freshCustomer.loyaltyPoints, total: order.total, expected: expectedTotal });
    process.exit(1);
  }

  // 5. Complete Order
  console.log('\n[Step 5] Completing the Order...');
  let completedOrder = await orderService.updateOrderStatus(order.orderId, 'Completed', admin._id.toString());

  // Verify stock decremented (10 - 2 = 8)
  let freshProduct = await Product.findById(product._id);
  console.log('Product stock after Completion (should be 8):', freshProduct.stock);

  // Verify points earned credited (rounded finalPaidTotal: order.pointsEarned points)
  freshCustomer = await Customer.findById(customer._id);
  console.log(`Customer points after Completion (should be ${order.pointsEarned}):`, freshCustomer.loyaltyPoints);

  if (freshProduct.stock === 8 && freshCustomer.loyaltyPoints === order.pointsEarned && completedOrder.stockDeducted && completedOrder.pointsEarnedCredited) {
    console.log('✅ PASS: Stock decremented and earned points credited successfully.');
  } else {
    console.error('❌ FAIL: Stock or points credit mismatch after completion.', { stock: freshProduct.stock, points: freshCustomer.loyaltyPoints });
    process.exit(1);
  }

  // Verify Idempotency: Complete Order again (repeated state change)
  console.log('\n[Step 5b] Simulating duplicate Complete state transition to check idempotency...');
  // Force update to Completed again directly in orderService
  completedOrder = await orderService.updateOrderStatus(order.orderId, 'Completed', admin._id.toString());
  
  freshProduct = await Product.findById(product._id);
  freshCustomer = await Customer.findById(customer._id);
  console.log('Stock after duplicate Complete (should remain 8):', freshProduct.stock);
  console.log(`Customer points after duplicate Complete (should remain ${order.pointsEarned}):`, freshCustomer.loyaltyPoints);
  if (freshProduct.stock === 8 && freshCustomer.loyaltyPoints === order.pointsEarned) {
    console.log('✅ PASS: Double-earning and double-deduction blocked successfully (Idempotency Active).');
  } else {
    console.error('❌ FAIL: Duplicate transition leaked points or stock modifications.');
    process.exit(1);
  }

  // 6. Transition OUT of Completed back to Processing (Rollback)
  console.log('\n[Step 6] Transitioning order from Completed to Processing (Testing rollback)...');
  let processingOrder = await orderService.updateOrderStatus(order.orderId, 'Processing', admin._id.toString());

  // Stock must be restored (8 + 2 = 10)
  freshProduct = await Product.findById(product._id);
  console.log('Product stock after rollback (should be 10):', freshProduct.stock);

  // Points earned must be rolled back (300 - 300 = 0)
  freshCustomer = await Customer.findById(customer._id);
  console.log('Customer points after rollback (should be 0):', freshCustomer.loyaltyPoints);

  if (freshProduct.stock === 10 && freshCustomer.loyaltyPoints === 0 && !processingOrder.stockDeducted && !processingOrder.pointsEarnedCredited) {
    console.log('✅ PASS: Stock restored and earned points rolled back correctly.');
  } else {
    console.error('❌ FAIL: Stock or points rollback failure.', { stock: freshProduct.stock, points: freshCustomer.loyaltyPoints });
    process.exit(1);
  }

  // Verify Idempotency on Rollback: duplicate Processing transition
  console.log('\n[Step 6b] Simulating duplicate Processing transition...');
  processingOrder = await orderService.updateOrderStatus(order.orderId, 'Processing', admin._id.toString());
  freshProduct = await Product.findById(product._id);
  freshCustomer = await Customer.findById(customer._id);
  console.log('Stock after duplicate rollback (should remain 10):', freshProduct.stock);
  console.log('Customer points after duplicate rollback (should remain 0):', freshCustomer.loyaltyPoints);
  if (freshProduct.stock === 10 && freshCustomer.loyaltyPoints === 0) {
    console.log('✅ PASS: Double-rollback blocked successfully.');
  } else {
    console.error('❌ FAIL: Duplicate rollback corrupted state.');
    process.exit(1);
  }

  // 7. Transition to Cancelled (Used points refund test)
  console.log('\n[Step 7] Transitioning order to Cancelled (Used points refund)...');
  let cancelledOrder = await orderService.updateOrderStatus(order.orderId, 'Cancelled', admin._id.toString());

  // Customer should get their redeemed 3000 points refunded (0 + 3000 = 3000)
  freshCustomer = await Customer.findById(customer._id);
  console.log('Customer points after Cancellation (should be 3000):', freshCustomer.loyaltyPoints);
  if (freshCustomer.loyaltyPoints === 3000 && cancelledOrder.pointsUsedRefunded) {
    console.log('✅ PASS: Used points successfully refunded upon cancellation.');
  } else {
    console.error('❌ FAIL: Cancel used points refund failure.', { points: freshCustomer.loyaltyPoints });
    process.exit(1);
  }

  // Verify cancellation idempotency
  console.log('\n[Step 7b] Simulating duplicate Cancel transition to check double-refund protection...');
  cancelledOrder = await orderService.updateOrderStatus(order.orderId, 'Cancelled', admin._id.toString());
  freshCustomer = await Customer.findById(customer._id);
  console.log('Customer points after duplicate Cancellation (should remain 3000):', freshCustomer.loyaltyPoints);
  if (freshCustomer.loyaltyPoints === 3000) {
    console.log('✅ PASS: Double-refund blocked successfully.');
  } else {
    console.error('❌ FAIL: Duplicate cancellation inflated customer points balance.');
    process.exit(1);
  }

  // 8. Transition out of Cancelled back to Pending
  console.log('\n[Step 8] Transitioning order out of Cancelled back to Pending (Re-deducting points)...');
  let pendingOrder = await orderService.updateOrderStatus(order.orderId, 'Pending', admin._id.toString());
  
  freshCustomer = await Customer.findById(customer._id);
  console.log('Customer points after returning to Pending (should be 0):', freshCustomer.loyaltyPoints);
  if (freshCustomer.loyaltyPoints === 0 && !pendingOrder.pointsUsedRefunded) {
    console.log('✅ PASS: Used points re-deducted successfully when leaving cancelled state.');
  } else {
    console.error('❌ FAIL: Re-deduction failure.', { points: freshCustomer.loyaltyPoints });
    process.exit(1);
  }

  // 9. Delete the Order (should refund used points since status is Pending)
  console.log('\n[Step 9] Deleting the Order from Pending status...');
  await orderService.deleteOrder(order.orderId, admin._id.toString());

  // Confirm Order and OrderItems are deleted
  const checkOrder = await Order.findOne({ orderId: order.orderId });
  const checkItems = await OrderItem.find({ order: order._id });
  console.log('Check order deleted (should be null):', checkOrder);
  console.log('Check order items deleted (should be empty array):', checkItems);

  // Customer should receive their 3000 points used refund
  freshCustomer = await Customer.findById(customer._id);
  console.log('Customer points after Order Deletion (should be 3000):', freshCustomer.loyaltyPoints);

  if (!checkOrder && checkItems.length === 0 && freshCustomer.loyaltyPoints === 3000) {
    console.log('✅ PASS: Order deletion cleaned up references and refunded points successfully.');
  } else {
    console.error('❌ FAIL: Order deletion failed to roll back customer points or delete records.', {
      order: checkOrder,
      items: checkItems.length,
      points: freshCustomer.loyaltyPoints
    });
    process.exit(1);
  }

  // Cleanup test data
  await Customer.deleteOne({ phoneNumber: testPhone });
  await Product.deleteOne({ name: testProductName });
  const finalCat = await Category.findOne({ name: testCategoryName });
  if (finalCat) {
    await Category.deleteOne({ _id: finalCat._id });
  }

  console.log('\n=== ALL END-TO-END TRANSACTION AND IDEMPOTENCY TESTS PASSED! ===');
  process.exit(0);
}

runEndToEndTest().catch(err => {
  console.error('Fatal E2E test error:', err);
  process.exit(1);
});
