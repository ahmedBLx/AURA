require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorMiddleware');
const AppError = require('./utils/appError');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const couponRoutes = require('./routes/couponRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const settingRoutes = require('./routes/settingRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const customerRoutes = require('./routes/customerRoutes');
const pointsRoutes = require('./routes/pointsRoutes');

const app = express();
app.set('trust proxy', true);
app.disable('etag');

// Socket.IO is only set up outside Vercel (serverless doesn't support persistent WS)
let server;
if (!process.env.VERCEL) {
  server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE']
    }
  });

  // Setup Redis Adapter for Socket.IO if Redis URL or Host is provided
  if (process.env.REDIS_URL || process.env.REDIS_HOST) {
    try {
      const { createClient } = require('redis');
      const { createAdapter } = require('@socket.io/redis-adapter');
      
      const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`;
      const pubClient = createClient({ url: redisUrl });
      const subClient = pubClient.duplicate();
      
      Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
        io.adapter(createAdapter(pubClient, subClient));
        logger.info('Socket.IO Redis adapter connected successfully.');
      }).catch(err => {
        logger.error('Failed to connect Redis for Socket.IO adapter, falling back to in-memory:', err);
      });
    } catch (err) {
      logger.error('Could not initialize Redis client for Socket.IO adapter, falling back to in-memory:', err);
    }
  }

  app.set('io', io);
  io.on('connection', (socket) => {
    logger.info(`Socket client connected: ${socket.id}`);
    socket.on('disconnect', () => {
      logger.info(`Socket client disconnected: ${socket.id}`);
    });
  });
}

// Set security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Setup CORS
const corsOptions = {
  origin: '*', // Customize this in production (e.g. process.env.FRONTEND_URL)
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Setup Morgan request logger stream mapped to Winston
app.use(morgan(':remote-addr - :method :url :status :res[content-length] - :response-time ms', {
  stream: { write: (message) => logger.http(message.trim()) }
}));

// Body parsers with increased payload limits for base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploaded static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Disable caching for API responses
app.use('/api/', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  
  // Disable ETag / conditional request validation to prevent 304 Not Modified status
  delete req.headers['if-none-match'];
  delete req.headers['if-modified-since'];
  
  next();
});

// Apply general rate limiting
app.use('/api/', apiLimiter);

// Ensure DB is connected before handling any API request.
// On Vercel (serverless), each cold-start invocation must await the connection.
// On warm invocations mongoose.connection.readyState === 1 so connectDB() returns instantly.
app.use('/api/', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Root path handler for health checks
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'AURA Backend API is running successfully.'
  });
});

// Bind API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/audit-logs', auditLogRoutes);
app.use('/api/v1/settings', settingRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// Loyalty Points System Routes
app.use('/api/customers', customerRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/points', pointsRoutes);

// Socket.IO is not supported on Vercel serverless — return a clean 503
// so the client can detect it and fall back to polling instead of spamming 404s.
app.use('/socket.io', (req, res) => {
  res.status(503).json({
    status: 'unavailable',
    message: 'Real-time (Socket.IO) is not supported in serverless mode. Use REST polling instead.'
  });
});

// Catch-all for unrecognized endpoints
app.use('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect to DB then start server (local dev) or just connect (Vercel serverless)
const startServer = async () => {
  try {
    await connectDB();

    // Ensure main categories exist
    const Category = require('./models/Category');
    const Product = require('./models/Product');
    const mainCategories = ['Men', 'Women', 'Offers', 'Special Collection'];
    const mainCatObjs = {};
    for (const name of mainCategories) {
      let existing = await Category.findOne({ name: new RegExp(`^${name}$`, 'i') });
      if (!existing) {
        existing = await Category.create({ name, parent: null, showOnHomepage: false });
        logger.info(`Auto-created missing main category: ${name}`);
      }
      mainCatObjs[name] = existing;
    }

    // Ensure default sub-categories exist
    const defaultSubs = {
      'Men': 'Men\'s Collection',
      'Women': 'Women\'s Collection',
      'Offers': 'Hot Offers',
      'Special Collection': 'Specials'
    };
    for (const [parentName, subName] of Object.entries(defaultSubs)) {
      let existing = await Category.findOne({ name: new RegExp(`^${subName}$`, 'i') });
      if (!existing) {
        existing = await Category.create({ 
          name: subName, 
          parent: mainCatObjs[parentName]._id, 
          showOnHomepage: true 
        });
        logger.info(`Auto-created missing default sub-category: ${subName} under ${parentName}`);
      }
    }

    // Migrate existing products that do not have a subcategory
    const allCategories = await Category.find();
    const subCategoryNames = allCategories.filter(c => c.parent !== null).map(c => c.name);

    let migrationCount = 0;
    for (const [mainCat, defaultSubName] of Object.entries(defaultSubs)) {
      const res = await Product.updateMany(
        {
          categories: {
            $all: [mainCat],
            $nin: subCategoryNames
          }
        },
        {
          $addToSet: { categories: defaultSubName }
        }
      );
      migrationCount += (res.modifiedCount || 0);
    }
    if (migrationCount > 0) {
      logger.info(`Auto-migrated ${migrationCount} products to default sub-categories using bulk update.`);
    }

    // Start reservation cleanup background task (runs every 30 minutes)
    if (!process.env.VERCEL) {
      const orderService = require('./services/orderService');
      setInterval(() => {
        logger.info('Running background job: cleanupExpiredReservations');
        orderService.cleanupExpiredReservations();
      }, 1000 * 60 * 30); // 30 minutes
    }

    // Only start HTTP server when NOT running on Vercel and run directly as module entry point
    if (!process.env.VERCEL && require.main === module) {
      server.listen(PORT, () => {
        logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      });
    }
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
};

startServer();

// Export app for Vercel serverless handler
module.exports = app;
