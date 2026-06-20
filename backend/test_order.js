require('dotenv').config();
const connectDB = require('./config/db');
const Product = require('./models/Product');
const orderService = require('./services/orderService');

async function test() {
  await connectDB();
  const product = await Product.findOne({ name: 'ad' });
  console.log('Product ad details:', product);
  
  try {
    const order = await orderService.createOrderWithLoyalty({
      customerName: 'Test Customer',
      customerPhone: '01011112222',
      customerAlternativePhone: '',
      customerAddress: '123 Test St',
      customerGovernorate: 'Cairo',
      customerCity: 'Maadi',
      notes: 'Test order',
      paymentMethod: 'Cash on Delivery',
      items: [{ productId: product._id.toString(), size: '42', quantity: 10 }],
      email: '',
      usePoints: false
    });
    console.log('Order created successfully:', order.orderId);
  } catch (err) {
    console.error('Order creation failed:', err.message);
  }
  process.exit(0);
}

test();
