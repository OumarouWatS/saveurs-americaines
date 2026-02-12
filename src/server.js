require('dotenv').config();

const express = require('express');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const ingredientRoutes = require('./routes/ingredients');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const cartRoutes = require('./routes/cart');
const ordersRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const logger = require('./middleware/logger');
const {errorHandler, notFound} = require('./middleware/errorHandler');
const {generalLimiter, authLimiter} = require('./middleware/rateLimiter');
const {generalLimiter, authLimiter} = require('./middleware/rateLimiter');
const {validatePagination} = require('./middleware/validation');

// app middleware
app.use(express.json());

// Apply logging middleware
app.use(logger);

// Parse JSON bodies
app.use(express.json());

// Apply general rate limiting to all routes
app.use(generalLimiter);

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
    message: 'Bakery Shop API',
    version: '1.0.0',
    endpoints: {
      products: '/products',
      categories: '/categories',
      ingredients: '/ingredients',
      auth: '/auth',
      users: '/users',
      cart: '/cart',
      orders: '/orders'
    },
    documentation: '/docs'
  });
});

// Routes with specific middleware
app.use('/auth', authLimiter, authRoutes);
app.use('/products', validatePagination, productRoutes);
app.use('/categories', categoryRoutes);
app.use('/ingredients', ingredientRoutes);
app.use('/users', userRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', ordersRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Handle unhandler promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err);
  process.getMaxListeners(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err);
  process.exit(1);
});

