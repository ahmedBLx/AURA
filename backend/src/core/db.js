const mongoose = require('mongoose');

let connectionPromise = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aura_store';

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (mongoose.connection.readyState === 2 && connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = mongoose.connect(uri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  }).then(m => {
    console.log('MongoDB Connected Successfully');
    connectionPromise = null;
    return m.connection;
  }).catch(err => {
    connectionPromise = null;
    console.error('MongoDB connection failed:', err.message);
    throw err;
  });

  return connectionPromise;
};

if (!process.env.VERCEL) {
  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed gracefully on SIGINT');
      process.exit(0);
    } catch (err) {
      console.error(`Error closing MongoDB connection: ${err.message}`);
      process.exit(1);
    }
  });

  process.on('SIGTERM', async () => {
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed gracefully on SIGTERM');
      process.exit(0);
    } catch (err) {
      console.error(`Error closing MongoDB connection: ${err.message}`);
      process.exit(1);
    }
  });
}

module.exports = connectDB;
