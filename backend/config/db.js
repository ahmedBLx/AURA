const mongoose = require('mongoose');

// Cache the connection promise so concurrent cold-start requests
// share the same connection attempt instead of opening multiple.
let connectionPromise = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aura_store';

  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (mongoose.connection.readyState === 1) {
    // Already connected — reuse the existing connection (warm serverless invocation)
    return mongoose.connection;
  }

  if (mongoose.connection.readyState === 2 && connectionPromise) {
    // Connection in progress — wait for it instead of opening another
    return connectionPromise;
  }

  connectionPromise = mongoose.connect(uri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 10000, // fail fast instead of hanging for 30s
    socketTimeoutMS: 45000,
    maxPoolSize: process.env.NODE_ENV === 'production' ? 10 : 100,
    minPoolSize: 2,
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

// Graceful shutdown (local only — Vercel doesn't keep process alive)
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
