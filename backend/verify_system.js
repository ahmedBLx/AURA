const mongoose = require('mongoose');
require('dotenv').config({ path: 'c:/Users/HEllo/Desktop/work/backend/.env' });
const connectDB = require('./config/db');
const Product = require('./models/Product');
const Customer = require('./models/Customer');
const Order = require('./models/Order');
const orderService = require('./services/orderService');

async function runVerification() {
  console.log('--- START SYSTEM VERIFICATION ---');
  await connectDB();

  // 1. Setup product "ad"
  let product = await Product.findOne({ name: 'ad' });
  if (!product) {
    console.log('Product "ad" not found. Creating it...');
    product = await Product.create({
      name: 'ad',
      price: 200,
      img: 'assets/sneaker_white.png',
      desc: 'Test description',
      categories: ['Men', 'Adidas'],
      stock: 5,
      sizes: ['42']
    });
  } else {
    product.stock = 5;
    await product.save();
    console.log('Product "ad" found. Reset stock to 5.');
  }

  // 2. Clear previous test customer and orders to prevent unique constraints issues
  const testPhone = '01099998888';
  await Customer.deleteOne({ phoneNumber: testPhone });
  await Order.deleteMany({ customerPhone: testPhone });

  console.log('\nTesting stock level constraint...');
  
  // Test case 2a: Requesting more than available stock (Requested: 6, Available: 5)
  try {
    await orderService.createOrderWithLoyalty({
      customerName: 'Test Customer',
      customerPhone: testPhone,
      customerAlternativePhone: '',
      customerAddress: '123 Test St',
      customerGovernorate: 'Cairo',
      customerCity: 'Maadi',
      notes: 'Test order',
      paymentMethod: 'Cash on Delivery',
      items: [{ productId: product._id.toString(), size: '42', quantity: 6 }],
      email: '', // Guest checkout - no email required
      usePoints: false
    });
    console.error('❌ FAIL: Expected order creation with quantity 6 to fail due to insufficient stock.');
  } catch (err) {
    if (err.message.includes('insufficient stock')) {
      console.log('✅ PASS: Insufficient stock check prevented order placement. Message:', err.message);
    } else {
      console.error('❌ FAIL: Unexpected error during stock limit test:', err.message);
    }
  }

  // Test case 2b: Requesting valid stock (Requested: 2, Available: 5)
  let order;
  try {
    order = await orderService.createOrderWithLoyalty({
      customerName: 'Test Customer',
      customerPhone: testPhone,
      customerAlternativePhone: '',
      customerAddress: '123 Test St',
      customerGovernorate: 'Cairo',
      customerCity: 'Maadi',
      notes: 'Test order',
      paymentMethod: 'Cash on Delivery',
      items: [{ productId: product._id.toString(), size: '42', quantity: 2 }],
      email: '', // Guest checkout - no email required
      usePoints: false
    });
    console.log('✅ PASS: Order created successfully with valid stock. Order ID:', order.orderId);
  } catch (err) {
    console.error('❌ FAIL: Expected order creation with quantity 2 to succeed. Error:', err.message);
  }

  // 3. Verify stock decrement upon order completion
  if (order) {
    console.log('\nTesting stock decrement on order completion...');
    
    // Check initial stock (should still be 5 since order is Pending)
    let freshProduct = await Product.findById(product._id);
    console.log('Current stock (Pending order):', freshProduct.stock);
    if (freshProduct.stock === 5) {
      console.log('✅ PASS: Stock is not decremented while order is Pending.');
    } else {
      console.error('❌ FAIL: Stock decremented prematurely.');
    }

    // Set order status to Completed
    try {
      // Find admin to assign status change details
      const Admin = require('./models/Admin');
      let admin = await Admin.findOne({ role: 'admin' });
      if (!admin) {
        admin = await Admin.create({
          name: 'Temp Admin',
          email: 'tempadmin@aura.com',
          password: 'tempadminpass',
          role: 'admin'
        });
      }

      await orderService.updateOrderStatus(order.orderId, 'Completed', admin._id);
      console.log('Order status successfully updated to Completed.');

      // Check stock after completion (should be 3: 5 - 2)
      freshProduct = await Product.findById(product._id);
      console.log('Current stock (Completed order):', freshProduct.stock);
      if (freshProduct.stock === 3) {
        console.log('✅ PASS: Stock successfully decremented to 3 on completion.');
      } else {
        console.error('❌ FAIL: Stock was not updated correctly. Expected 3, got:', freshProduct.stock);
      }
    } catch (err) {
      console.error('❌ FAIL: Failed to update order status or verify stock. Error:', err.message);
    }
  }

  console.log('\n--- SYSTEM VERIFICATION COMPLETED ---');
  process.exit(0);
}

runVerification().catch(err => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
