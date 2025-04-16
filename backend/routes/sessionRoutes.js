/**
 * Session routes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const {
  getSessions,
  getSessionsByDomain,
  getSession,
  createSession,
  deleteSession
} = require('../controllers/sessionController');

// Apply rate limiting to session routes
router.use(apiLimiter);

// All session routes are protected
router.use(protect);

// Routes
router.route('/')
  .get(getSessions)
  .post(createSession);

router.route('/domain/:domain')
  .get(getSessionsByDomain);

router.route('/:id')
  .get(getSession)
  .delete(deleteSession);

module.exports = router;
