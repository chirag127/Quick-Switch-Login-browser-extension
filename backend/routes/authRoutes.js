const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Register a new user
router.post('/signup', authLimiter, authController.signup);

// Login user
router.post('/login', authLimiter, authController.login);

// Get current user (protected route)
router.get('/me', auth, authController.getCurrentUser);

module.exports = router;
