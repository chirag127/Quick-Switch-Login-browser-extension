const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const auth = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// All routes are protected and rate-limited
router.use(auth, apiLimiter);

// Save a new session or update existing one
router.post('/save', sessionController.saveSession);

// Get all sessions for the current user
router.get('/', sessionController.getSessions);

// Get sessions for a specific domain
router.get('/domain/:domain', sessionController.getSessionsByDomain);

// Get a specific session by ID
router.get('/:id', sessionController.getSessionById);

// Delete a session
router.delete('/:id', sessionController.deleteSession);

module.exports = router;
