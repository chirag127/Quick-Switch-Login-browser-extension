/**
 * Authentication routes
 */
const express = require('express');
const { register, login } = require('../controllers/auth.controller');
const { authLimiter } = require('../middleware/rate-limit.middleware');

const router = express.Router();

// Apply rate limiting to auth routes
router.use(authLimiter);

// Register route
router.post('/register', register);

// Login route
router.post('/login', login);

module.exports = router;
