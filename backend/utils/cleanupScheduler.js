const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../config/db');
const orderService = require('../services/orderService');

async function runCleanup() {
  console.log(`[${new Date().toISOString()}] Starting reservation cleanup scheduler...`);
  await connectDB();
  
  await orderService.cleanupExpiredReservations();
  
  console.log(`[${new Date().toISOString()}] Reservation cleanup completed successfully.`);
  process.exit(0);
}

runCleanup().catch(err => {
  console.error('Fatal reservation cleanup error:', err);
  process.exit(1);
});
