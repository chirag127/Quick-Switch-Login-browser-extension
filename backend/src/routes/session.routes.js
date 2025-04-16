/**
 * Session routes
 */
const express = require('express');
const {
  getSessions,
  getSession,
  createSession,
  updateSession,
  deleteSession,
  syncSessions
} = require('../controllers/session.controller');
const { protect } = require('../middleware/auth.middleware');
const { apiLimiter } = require('../middleware/rate-limit.middleware');

const router = express.Router();

// Apply authentication middleware to all session routes
router.use(protect);

// Apply rate limiting to all session routes
router.use(apiLimiter);

// Sync sessions route
router.post('/sync', syncSessions);

// Get all sessions route
router.get('/', getSessions);

// Create session route
router.post('/', createSession);

// Get, update, delete session routes
router.get('/:sessionId', getSession);
router.put('/:sessionId', updateSession);
router.delete('/:sessionId', deleteSession);

module.exports = router;
