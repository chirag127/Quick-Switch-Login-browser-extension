/**
 * Authentication controller
 */
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { AppError } = require('../middleware/error.middleware');

/**
 * Generate JWT token
 * @param {string} id User ID
 * @returns {string} JWT token
 */
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'default_jwt_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Register a new user
 * @route POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Check if email and password are provided
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }
    
    // Check if password meets minimum requirements
    if (password.length < 8) {
      return next(new AppError('Password must be at least 8 characters long', 400));
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email already in use', 400));
    }
    
    // Create new user
    const user = await User.create({
      email,
      passwordHash: password // Will be hashed in the pre-save hook
    });
    
    // Generate token
    const token = generateToken(user._id);
    
    // Send response
    res.status(201).json({
      id: user._id,
      email: user.email,
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Check if email and password are provided
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    
    // Check if user exists and password is correct
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password', 401));
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    // Send response
    res.status(200).json({
      id: user._id,
      email: user.email,
      token
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login
};
