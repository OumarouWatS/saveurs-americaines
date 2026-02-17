require('dotenv').config();
const express = require('express');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const ingredientRoutes = require('./routes/ingredients');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');

// Middleware
const logger = require('./middleware/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');
const { validatePagination } = require('./middleware/validation');

const createApp = () => {
  const app = express();

  // Apply logging middleware only in non-test environment
  if (process.env.NODE_ENV !== 'test') {
    app.use(logger);
  }

  // Parse JSON bodies
  app.use(express.json());

  // Apply rate limiting only in non-test environment
  if (process.env.NODE_ENV !== 'test') {
    app.use(generalLimiter);
  }

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV
    });
  });

  // API info endpoint
  app.get('/', (req, res) => {
    res.json({ 
      message: 'Pastry Shop API',
      version: '1.0.0',
      endpoints: {
        products: '/api/products',
        categories: '/api/categories',
        ingredients: '/api/ingredients',
        auth: '/api/auth',
        users: '/api/users',
        cart: '/api/cart',
        orders: '/api/orders'
      },
      documentation: '/api/docs'
    });
  });

  // Routes
  if (process.env.NODE_ENV !== 'test') {
    app.use('/api/auth', authLimiter, authRoutes);
  } else {
    app.use('/api/auth', authRoutes);
  }
  
  app.use('/api/products', validatePagination, productRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/ingredients', ingredientRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/orders', orderRoutes);

  // 404 handler
  app.use(notFound);

  // Error handler
  app.use(errorHandler);

  return app;
};

module.exports = createApp;