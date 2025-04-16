/**
 * Session model
 */
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionName: {
    type: String,
    required: true,
    trim: true
  },
  domain: {
    type: String,
    required: true,
    trim: true
  },
  origin: {
    type: String,
    required: true,
    trim: true
  },
  faviconUrl: {
    type: String,
    trim: true
  },
  cookieData: {
    type: String, // Encrypted JSON string
    required: true
  },
  localStorageData: {
    type: String, // Encrypted JSON string
    required: true
  },
  sessionStorageData: {
    type: String, // Encrypted JSON string
    required: true
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

// Create compound index for userId and domain for faster queries
sessionSchema.index({ userId: 1, domain: 1 });

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
