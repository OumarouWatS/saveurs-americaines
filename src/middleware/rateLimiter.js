const rateLimit = require('express-rate-limit');

// General rate limiter for all requests
const generalLimiter = rateLimit({
    window: 15*60*1000, // 15 minutes
    max: 100, //limit each IP to 100 requests per windowMs
    message: 'Too mant requests from this IP, please try again later.',
    standardHeaders: true, // return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

// Stricter rate limiter for auth endpoints (login/register)
const authLimiter  = rateLimit({
    window: 15 * 60 * 1000, // 15 minutes
    max: 5, //limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
    skipSuccessfulRequests: true, // don't count successful requests
});

// Rate limiter for creating reviews
const reviewLimiter = rateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit to 10 reviews per hour
    message: 'Too many reviews submitted, please try again later.',
});

module.exports = {generalLimiter, authLimiter, reviewLimiter};