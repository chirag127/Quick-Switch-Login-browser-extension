/**
 * User model
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

/**
 * Hash the password before saving
 */
userSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('passwordHash')) return next();
  
  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(12);
    
    // Hash the password with the salt
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare password with the hashed one
 * @param {string} candidatePassword Password to compare
 * @returns {Promise<boolean>} True if passwords match
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
