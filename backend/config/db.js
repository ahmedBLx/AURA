const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aura_store';
  const maxRetries = 5;
  let retryCount = 0;

  const options = {
    autoIndex: true, // Auto build indexes
  };

  while (retryCount < maxRetries) {
    try {
      await mongoose.connect(uri, options);
      console.log('MongoDB Connected Successfully');
      return mongoose.connection;
    } catch (err) {
      retryCount++;
      console.error(`MongoDB connection attempt ${retryCount} failed. Error: ${err.message}`);
      if (retryCount >= maxRetries) {
        console.error('Max MongoDB connection retries reached. Exiting...');
        process.exit(1);
      }
      console.log('Retrying database connection in 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

// Graceful shutdown handling
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

module.exports = connectDB;
