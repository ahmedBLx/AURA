const rateLimit = require('express-rate-limit');

let store;
if (process.env.REDIS_URL || process.env.REDIS_HOST) {
  try {
    const { createClient } = require('redis');
    const RedisStore = require('rate-limit-redis').default || require('rate-limit-redis');
    
    const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`;
    const client = createClient({ url: redisUrl });
    
    client.connect().catch(err => {
      console.error('Failed to connect Redis for rate-limiting store, falling back to in-memory:', err);
    });
    
    store = new RedisStore({
      sendCommand: (...args) => client.sendCommand(args),
    });
    console.log('Rate limiter initialized with Redis store.');
  } catch (err) {
    console.error('Could not initialize Redis client for rate limiter, falling back to in-memory store:', err);
  }
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: store || undefined,
  validate: false,
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: {
    status: 'error',
    message: 'Too many authentication attempts, please try again after an hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: store || undefined,
  validate: false,
});

module.exports = {
  apiLimiter,
  authLimiter,
};
