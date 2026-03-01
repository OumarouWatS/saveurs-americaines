require('dotenv').config();
const createApp = require('./app');

const PORT = process.env.PORT || 3000;

// Create the Express app
const app = createApp();

// Start server
app.listen(PORT, () => {
  console.log(`
                                                   
    Saveurs Americaines Server Running     
                                                    
    Environment: ${(process.env.NODE_ENV || 'development').padEnd(10)}
    Port: ${PORT.toString().padEnd(10)}             
    URL: http://localhost:${PORT}                   

  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err);
  process.exit(1);
});