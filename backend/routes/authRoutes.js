/**
 * Authentication routes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  deleteAccount
} = require('../controllers/authController');

// Apply rate limiting to auth routes
router.use(authLimiter);

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:resetToken', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.delete('/delete-account', protect, deleteAccount);

module.exports = router;
