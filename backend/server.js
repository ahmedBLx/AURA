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

const app = express();

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

// Apply general rate limiting
app.use('/api/', apiLimiter);

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

    // Only start HTTP server when NOT running on Vercel
    if (!process.env.VERCEL) {
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
