// Custom error class
class ApiError extends Error {
    constructor(statusCode, message, isOperational = true){
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
    let {statusCode, message} = err;

    // Default to 500 server error if statusCode not set
    if(!statusCode){
        statusCode = 500;
    }

    // Log error for debugging
    console.error(`${new Date().toISOString()} ${statusCode} - ${message}`);
    console.error(err.stack);

    // Send error response
    res.status(statusCode).json({
        success: false,
        error: {
            message: message || 'Internal Server Error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack})
        }
    });
};

// 404 handler for undefined routes
const notFound = (req, res, next) => {
    const error = new ApiError(404, `Route ${req.originalUrl} not found`);
    next(error);
};

// Async handler wrapper to catch errors in async routes
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {ApiError, errorHandler, notFound, asyncHandler};