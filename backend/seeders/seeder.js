require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');

// Import models
const Admin = require('../models/Admin');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');
const Coupon = require('../models/Coupon');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const Setting = require('../models/Setting');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');

const seedData = async () => {
  try {
    // 1. Connect to Database
    await connectDB();
    console.log('Clearing database collections...');

    // 2. Clear Existing Data
    await Admin.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Review.deleteMany({});
    await Coupon.deleteMany({});
    await Notification.deleteMany({});
    await AuditLog.deleteMany({});
    await Setting.deleteMany({});
    await Order.deleteMany({});
    await OrderItem.deleteMany({});

    console.log('Database cleared.');

    // 3. Seed Categories
    console.log('Seeding categories...');
    const categoryNames = ['Men', 'Women', 'Offers', 'Special Collection'];
    const seededCategories = [];
    for (const name of categoryNames) {
      const cat = await Category.create({ name });
      seededCategories.push(cat);
    }
    console.log(`Seeded ${seededCategories.length} categories.`);

    // 4. Seed Admins
    console.log('Seeding admin...');
    const adminUser = await Admin.create({
      name: 'Admin User',
      email: 'admin@aura.com',
      password: 'adminpassword123', // Hashed pre-save
      role: 'admin',
    });

    console.log('Seeded admin user:');
    console.log(`- Admin: ${adminUser.email}`);

    // 5. Seed Products
    console.log('Seeding products...');
    const productsData = [
      {
        name: 'AURA NOMAD (MUSTARD)',
        price: 190,
        img: 'assets/sneaker_mustard.png',
        desc: 'Designed for modern lifestyle explorers. Features a lightweight, breathable knit structure, responsive sole cushioning, and our signature eco-friendly mustard-hued dye.',
        discountPercent: 21,
        stock: 15,
        categories: ['Men', 'Offers'],
      },
      {
        name: 'AURA ECLIPSE (CHARCOAL)',
        price: 190,
        img: 'assets/sneaker_charcoal.png',
        desc: 'The stealth choice for city trails. Crafted with charcoal black water-repellent yarn, a recycled rubber rugged outsole, and maximum-comfort heel stability panels.',
        discountPercent: 16,
        stock: 8,
        categories: ['Men', 'Offers'],
      },
      {
        name: 'AURA HORIZON (CORAL)',
        price: 190,
        img: 'assets/sneaker_coral.png',
        desc: 'Step with vibrant energy. Built with flexible coral-peach mesh fibers, ultra-light shock-absorption technology, and breathable fabrics perfect for summer walks.',
        discountPercent: 26,
        stock: 20,
        categories: ['Women', 'Offers'],
      },
      {
        name: 'AURA RETRO (WHITE)',
        price: 220,
        img: 'assets/sneaker_white.png',
        desc: 'Step into a timeless legend. Featuring premium full-grain white leather with cement-grey speckle accents, responsive air cushioning, and vintage street court appeal.',
        discountPercent: 18,
        stock: 12,
        categories: ['Men', 'Women', 'Offers', 'Special Collection'],
      },
    ];

    const seededProducts = await Product.insertMany(productsData);
    console.log(`Seeded ${seededProducts.length} products.`);

    // 6. Seed Coupons
    console.log('Seeding coupons...');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // 30 days from now

    const coupons = [
      {
        code: 'WELCOME10',
        discountPercent: 10,
        expiresAt: futureDate,
        isActive: true,
      },
      {
        code: 'SPRING20',
        discountPercent: 20,
        expiresAt: futureDate,
        isActive: true,
      },
    ];
    await Coupon.insertMany(coupons);
    console.log('Seeded coupons.');

    // 7. Seed Settings
    console.log('Seeding system settings...');
    const settings = [
      {
        key: 'store_name',
        value: 'AURA Premium Footwear',
        description: 'Name of the e-commerce storefront',
      },
      {
        key: 'currency',
        value: 'USD',
        description: 'Store currency display code',
      },
      {
        key: 'free_shipping_min',
        value: 150,
        description: 'Minimum order total value to qualify for free shipping',
      },
      {
        key: 'women_soon',
        value: true,
        description: 'Whether the Women section is in Coming Soon mode',
      },
    ];
    await Setting.insertMany(settings);
    console.log('Seeded settings.');

    // 8. Log seeding success in Audit logs
    await AuditLog.create({
      userName: 'System Seeder',
      action: 'DATABASE_SEED',
      details: 'Database seeded with default categories, admin, products, coupons and settings.',
    });

    console.log('Database Seeding Completed Successfully!');
    process.exit(0);
  } catch (err) {
    console.error(`Database seeding failed: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  }
};

seedData();
