/**
 * Session controller for managing user sessions
 */

const Session = require('../models/Session');

/**
 * Get all sessions for the current user
 * @route GET /api/sessions
 * @access Private
 */
const getSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({ userId: req.user._id });
    
    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get sessions for a specific domain
 * @route GET /api/sessions/domain/:domain
 * @access Private
 */
const getSessionsByDomain = async (req, res, next) => {
  try {
    const { domain } = req.params;
    
    const sessions = await Session.find({
      userId: req.user._id,
      websiteDomain: domain
    });
    
    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single session by ID
 * @route GET /api/sessions/:id
 * @access Private
 */
const getSession = async (req, res, next) => {
  try {
    const session = await Session.findOne({
      sessionId: req.params.id,
      userId: req.user._id
    });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    res.status(200).json({
      success: true,
      session
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new session or update if sessionId already exists
 * @route POST /api/sessions
 * @access Private
 */
const createSession = async (req, res, next) => {
  try {
    const {
      sessionId,
      sessionName,
      websiteDomain,
      websiteFaviconUrl,
      cookies,
      localStorage,
      sessionStorage
    } = req.body;
    
    if (!sessionId || !sessionName || !websiteDomain) {
      return res.status(400).json({
        success: false,
        message: 'Please provide sessionId, sessionName, and websiteDomain'
      });
    }
    
    // Check if session already exists
    let session = await Session.findOne({
      sessionId,
      userId: req.user._id
    });
    
    if (session) {
      // Update existing session
      session.sessionName = sessionName;
      session.websiteDomain = websiteDomain;
      session.websiteFaviconUrl = websiteFaviconUrl;
      session.cookies = cookies || [];
      session.localStorage = localStorage || {};
      session.sessionStorage = sessionStorage || {};
      session.updatedAt = Date.now();
      
      await session.save();
      
      return res.status(200).json({
        success: true,
        message: 'Session updated successfully',
        session
      });
    }
    
    // Create new session
    session = await Session.create({
      sessionId,
      userId: req.user._id,
      sessionName,
      websiteDomain,
      websiteFaviconUrl,
      cookies: cookies || [],
      localStorage: localStorage || {},
      sessionStorage: sessionStorage || {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      session
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a session
 * @route DELETE /api/sessions/:id
 * @access Private
 */
const deleteSession = async (req, res, next) => {
  try {
    const session = await Session.findOne({
      sessionId: req.params.id,
      userId: req.user._id
    });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    await session.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSessions,
  getSessionsByDomain,
  getSession,
  createSession,
  deleteSession
};
