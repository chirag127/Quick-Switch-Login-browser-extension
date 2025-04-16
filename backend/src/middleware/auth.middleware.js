/**
 * Authentication middleware
 */
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

/**
 * Protect routes - verify JWT token
 */
const protect = async (req, res, next) => {
  try {
    let token;
    
    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({
        message: 'Not authorized to access this route'
      });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret');
      
      // Find user by ID
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          message: 'User not found'
        });
      }
      
      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect
};
