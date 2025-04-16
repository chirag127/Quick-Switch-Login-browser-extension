/**
 * Rate limiting middleware
 */
const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter
 * Limits requests to 100 per 15 minutes
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 'error',
    message: 'Too many requests, please try again later.'
  }
});

/**
 * Authentication rate limiter
 * Limits auth requests to 10 per 15 minutes
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many authentication attempts, please try again later.'
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};
