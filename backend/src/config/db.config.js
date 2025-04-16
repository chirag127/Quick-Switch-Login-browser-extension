/**
 * Database configuration
 */
const mongoose = require('mongoose');

// MongoDB connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

/**
 * Connect to MongoDB
 * @returns {Promise} MongoDB connection
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quick-switch-login', options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
