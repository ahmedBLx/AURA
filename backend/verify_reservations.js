const mongoose = require('mongoose');
require('dotenv').config({ path: 'c:/Users/HEllo/Desktop/work/backend/.env' });
const connectDB = require('./config/db');
const Product = require('./models/Product');
const Customer = require('./models/Customer');
const Order = require('./models/Order');
const orderService = require('./services/orderService');

async function runVerification() {
  console.log('--- START RESERVATIONS VERIFICATION ---');
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

  // 2. Clear previous test data
  const testPhone = '01088887777';
  await Customer.deleteOne({ phoneNumber: testPhone });
  await Order.deleteMany({ customerPhone: testPhone });

  console.log('\nTesting Store Reservation for a new customer...');
  
  let order;
  try {
    order = await orderService.createOrderWithLoyalty({
      customerName: 'New Reserver',
      customerPhone: testPhone,
      customerAlternativePhone: '01011112222', // Second phone is required for reservations
      customerAddress: '', // Empty address
      customerGovernorate: '', // Empty governorate
      customerCity: '', // Empty city
      notes: 'Store reservation test',
      paymentMethod: 'Pay in Store',
      items: [{ productId: product._id.toString(), size: '42', quantity: 1 }],
      email: 'newreserver@test.com',
      usePoints: false,
      orderType: 'Store Reservation'
    });
    console.log('✅ PASS: Store Reservation created successfully for new customer! Order ID:', order.orderId);
  } catch (err) {
    console.error('❌ FAIL: Expected store reservation to succeed. Error:', err.message);
    process.exit(1);
  }

  // 3. Verify customer document was created and fields are optional
  const createdCustomer = await Customer.findOne({ phoneNumber: testPhone });
  if (createdCustomer) {
    console.log('✅ PASS: Customer profile created successfully.');
    if (createdCustomer.city === '' && createdCustomer.address === '') {
      console.log('✅ PASS: Customer city and address are correctly empty strings without throwing validation errors.');
    } else {
      console.error('❌ FAIL: Customer address/city were expected to be empty strings. Got:', {
        city: createdCustomer.city,
        address: createdCustomer.address
      });
    }
  } else {
    console.error('❌ FAIL: Customer profile was not created.');
    process.exit(1);
  }

  // 4. Verify order details
  if (order) {
    if (order.orderType === 'Store Reservation') {
      console.log('✅ PASS: Order type is Store Reservation.');
    } else {
      console.error('❌ FAIL: Order type is not Store Reservation. Got:', order.orderType);
    }
    
    if (order.paymentMethod === 'Pay in Store') {
      console.log('✅ PASS: Order payment method is Pay in Store.');
    } else {
      console.error('❌ FAIL: Order payment method is not Pay in Store. Got:', order.paymentMethod);
    }

    if (order.customerAlternativePhone === '01011112222') {
      console.log('✅ PASS: Order second phone number is stored correctly.');
    } else {
      console.error('❌ FAIL: Second phone number mismatch.');
    }

    // 5. Verify transaction processing (complete reservation)
    console.log('\nTesting stock decrement and loyalty crediting on completing reservation...');
    try {
      // Get or create admin to simulate status change
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

      // Check stock (should be 4 since we reserved 1 and stock was 5)
      const freshProduct = await Product.findById(product._id);
      console.log('Current stock (Completed reservation):', freshProduct.stock);
      if (freshProduct.stock === 4) {
        console.log('✅ PASS: Stock successfully decremented to 4 on completion.');
      } else {
        console.error('❌ FAIL: Stock was not updated correctly. Expected 4, got:', freshProduct.stock);
      }

      // Check customer loyalty points (should earn points equal to total)
      const freshCustomer = await Customer.findOne({ phoneNumber: testPhone });
      console.log('Customer loyalty points after completion:', freshCustomer.loyaltyPoints);
      if (freshCustomer.loyaltyPoints > 0) {
        console.log('✅ PASS: Customer loyalty points credited successfully on completion.');
      } else {
        console.error('❌ FAIL: Customer loyalty points were not credited.');
      }

    } catch (err) {
      console.error('❌ FAIL: Failed to update order status or verify transaction. Error:', err.message);
      process.exit(1);
    }
  }

  // Cleanup test data
  await Customer.deleteOne({ phoneNumber: testPhone });
  await Order.deleteMany({ customerPhone: testPhone });
  console.log('\nCleanup complete.');
  console.log('--- RESERVATIONS VERIFICATION COMPLETED ---');
  process.exit(0);
}

runVerification().catch(err => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
