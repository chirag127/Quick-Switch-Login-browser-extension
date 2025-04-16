/**
 * Session model for storing user sessions
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
  websiteDomain: {
    type: String,
    required: true,
    trim: true
  },
  websiteFaviconUrl: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Store session data as JSON
  cookies: {
    type: Array,
    default: []
  },
  localStorage: {
    type: Object,
    default: {}
  },
  sessionStorage: {
    type: Object,
    default: {}
  }
});

// Index for faster queries
sessionSchema.index({ userId: 1, websiteDomain: 1 });
sessionSchema.index({ sessionId: 1 });

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
