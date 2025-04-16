/**
 * Session controller
 */
const Session = require('../models/session.model');
const { AppError } = require('../middleware/error.middleware');
const { encrypt, decrypt } = require('../utils/encryption');

/**
 * Get all sessions for the authenticated user
 * @route GET /api/sessions
 */
const getSessions = async (req, res, next) => {
  try {
    // Find all sessions for the user
    const sessions = await Session.find({ userId: req.user._id });
    
    // Decrypt session data
    const decryptedSessions = sessions.map(session => {
      const sessionObj = session.toObject();
      
      // Decrypt sensitive data
      sessionObj.cookieData = decrypt(sessionObj.cookieData, req.user._id);
      sessionObj.localStorageData = decrypt(sessionObj.localStorageData, req.user._id);
      sessionObj.sessionStorageData = decrypt(sessionObj.sessionStorageData, req.user._id);
      
      return sessionObj;
    });
    
    res.status(200).json(decryptedSessions);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific session by ID
 * @route GET /api/sessions/:sessionId
 */
const getSession = async (req, res, next) => {
  try {
    // Find session by ID and user ID
    const session = await Session.findOne({
      sessionId: req.params.sessionId,
      userId: req.user._id
    });
    
    // Check if session exists
    if (!session) {
      return next(new AppError('Session not found', 404));
    }
    
    // Decrypt session data
    const sessionObj = session.toObject();
    sessionObj.cookieData = decrypt(sessionObj.cookieData, req.user._id);
    sessionObj.localStorageData = decrypt(sessionObj.localStorageData, req.user._id);
    sessionObj.sessionStorageData = decrypt(sessionObj.sessionStorageData, req.user._id);
    
    res.status(200).json(sessionObj);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new session
 * @route POST /api/sessions
 */
const createSession = async (req, res, next) => {
  try {
    const {
      sessionId,
      sessionName,
      domain,
      origin,
      faviconUrl,
      cookieData,
      localStorageData,
      sessionStorageData,
      createdAt,
      updatedAt
    } = req.body;
    
    // Check if required fields are provided
    if (!sessionId || !sessionName || !domain || !origin || !cookieData || !localStorageData || !sessionStorageData) {
      return next(new AppError('Please provide all required fields', 400));
    }
    
    // Check if session already exists
    const existingSession = await Session.findOne({
      sessionId,
      userId: req.user._id
    });
    
    if (existingSession) {
      return next(new AppError('Session with this ID already exists', 400));
    }
    
    // Encrypt sensitive data
    const encryptedCookieData = encrypt(cookieData, req.user._id);
    const encryptedLocalStorageData = encrypt(localStorageData, req.user._id);
    const encryptedSessionStorageData = encrypt(sessionStorageData, req.user._id);
    
    // Create new session
    const session = await Session.create({
      sessionId,
      userId: req.user._id,
      sessionName,
      domain,
      origin,
      faviconUrl,
      cookieData: encryptedCookieData,
      localStorageData: encryptedLocalStorageData,
      sessionStorageData: encryptedSessionStorageData,
      createdAt: createdAt || new Date(),
      updatedAt: updatedAt || new Date()
    });
    
    // Return the created session (without decrypting for performance)
    res.status(201).json({
      sessionId: session.sessionId,
      sessionName: session.sessionName,
      domain: session.domain,
      origin: session.origin,
      faviconUrl: session.faviconUrl,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a session
 * @route PUT /api/sessions/:sessionId
 */
const updateSession = async (req, res, next) => {
  try {
    const {
      sessionName,
      cookieData,
      localStorageData,
      sessionStorageData,
      updatedAt
    } = req.body;
    
    // Find session by ID and user ID
    const session = await Session.findOne({
      sessionId: req.params.sessionId,
      userId: req.user._id
    });
    
    // Check if session exists
    if (!session) {
      return next(new AppError('Session not found', 404));
    }
    
    // Update fields
    if (sessionName) session.sessionName = sessionName;
    
    // Update and encrypt sensitive data if provided
    if (cookieData) {
      session.cookieData = encrypt(cookieData, req.user._id);
    }
    
    if (localStorageData) {
      session.localStorageData = encrypt(localStorageData, req.user._id);
    }
    
    if (sessionStorageData) {
      session.sessionStorageData = encrypt(sessionStorageData, req.user._id);
    }
    
    // Update timestamp
    session.updatedAt = updatedAt || new Date();
    
    // Save changes
    await session.save();
    
    // Return the updated session (without decrypting for performance)
    res.status(200).json({
      sessionId: session.sessionId,
      sessionName: session.sessionName,
      domain: session.domain,
      origin: session.origin,
      faviconUrl: session.faviconUrl,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a session
 * @route DELETE /api/sessions/:sessionId
 */
const deleteSession = async (req, res, next) => {
  try {
    // Find and delete session by ID and user ID
    const session = await Session.findOneAndDelete({
      sessionId: req.params.sessionId,
      userId: req.user._id
    });
    
    // Check if session exists
    if (!session) {
      return next(new AppError('Session not found', 404));
    }
    
    res.status(200).json({
      message: 'Session deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sync sessions (handle offline changes)
 * @route POST /api/sessions/sync
 */
const syncSessions = async (req, res, next) => {
  try {
    const { created, updated, deleted } = req.body;
    
    // Process created sessions
    if (created && created.length > 0) {
      for (const session of created) {
        // Check if session already exists
        const existingSession = await Session.findOne({
          sessionId: session.sessionId,
          userId: req.user._id
        });
        
        if (!existingSession) {
          // Encrypt sensitive data
          const encryptedCookieData = encrypt(session.cookieData, req.user._id);
          const encryptedLocalStorageData = encrypt(session.localStorageData, req.user._id);
          const encryptedSessionStorageData = encrypt(session.sessionStorageData, req.user._id);
          
          // Create new session
          await Session.create({
            sessionId: session.sessionId,
            userId: req.user._id,
            sessionName: session.sessionName,
            domain: session.domain,
            origin: session.origin,
            faviconUrl: session.faviconUrl,
            cookieData: encryptedCookieData,
            localStorageData: encryptedLocalStorageData,
            sessionStorageData: encryptedSessionStorageData,
            createdAt: session.createdAt || new Date(),
            updatedAt: session.updatedAt || new Date()
          });
        }
      }
    }
    
    // Process updated sessions
    if (updated && updated.length > 0) {
      for (const updatedSession of updated) {
        // Find session by ID and user ID
        const session = await Session.findOne({
          sessionId: updatedSession.sessionId,
          userId: req.user._id
        });
        
        if (session) {
          // Check if the update is newer than the existing session
          const existingUpdatedAt = new Date(session.updatedAt);
          const updateTimestamp = new Date(updatedSession.updatedAt);
          
          if (updateTimestamp > existingUpdatedAt) {
            // Update fields
            session.sessionName = updatedSession.sessionName;
            
            // Update and encrypt sensitive data
            session.cookieData = encrypt(updatedSession.cookieData, req.user._id);
            session.localStorageData = encrypt(updatedSession.localStorageData, req.user._id);
            session.sessionStorageData = encrypt(updatedSession.sessionStorageData, req.user._id);
            
            // Update timestamp
            session.updatedAt = updatedSession.updatedAt;
            
            // Save changes
            await session.save();
          }
        }
      }
    }
    
    // Process deleted sessions
    if (deleted && deleted.length > 0) {
      for (const sessionId of deleted) {
        // Delete session by ID and user ID
        await Session.findOneAndDelete({
          sessionId,
          userId: req.user._id
        });
      }
    }
    
    // Get all sessions after sync
    const sessions = await Session.find({ userId: req.user._id });
    
    // Decrypt session data
    const decryptedSessions = sessions.map(session => {
      const sessionObj = session.toObject();
      
      // Decrypt sensitive data
      sessionObj.cookieData = decrypt(sessionObj.cookieData, req.user._id);
      sessionObj.localStorageData = decrypt(sessionObj.localStorageData, req.user._id);
      sessionObj.sessionStorageData = decrypt(sessionObj.sessionStorageData, req.user._id);
      
      return sessionObj;
    });
    
    res.status(200).json({
      message: 'Sync completed successfully',
      sessions: decryptedSessions
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSessions,
  getSession,
  createSession,
  updateSession,
  deleteSession,
  syncSessions
};
