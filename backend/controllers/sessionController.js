const Session = require('../models/Session');

// Save a new session or update existing one
exports.saveSession = async (req, res) => {
  try {
    const { name, domain, faviconUrl, cookies, localStorage, sessionStorage } = req.body;
    
    // Check if session with same name and domain already exists for this user
    let session = await Session.findOne({ 
      userId: req.userId,
      name,
      domain
    });
    
    if (session) {
      // Update existing session
      session.cookies = cookies;
      session.localStorage = localStorage;
      session.sessionStorage = sessionStorage;
      session.faviconUrl = faviconUrl;
      session.updatedAt = Date.now();
      
      await session.save();
      
      return res.status(200).json({
        message: 'Session updated successfully',
        session
      });
    }
    
    // Create new session
    session = new Session({
      userId: req.userId,
      name,
      domain,
      faviconUrl,
      cookies,
      localStorage,
      sessionStorage
    });
    
    await session.save();
    
    res.status(201).json({
      message: 'Session saved successfully',
      session
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all sessions for the current user
exports.getSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.userId }).sort({ updatedAt: -1 });
    
    res.status(200).json({
      sessions
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get sessions for a specific domain
exports.getSessionsByDomain = async (req, res) => {
  try {
    const { domain } = req.params;
    
    const sessions = await Session.find({
      userId: req.userId,
      domain
    }).sort({ updatedAt: -1 });
    
    res.status(200).json({
      sessions
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a specific session by ID
exports.getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const session = await Session.findOne({
      _id: id,
      userId: req.userId
    });
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    res.status(200).json({
      session
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a session
exports.deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    
    const session = await Session.findOne({
      _id: id,
      userId: req.userId
    });
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    await Session.deleteOne({ _id: id });
    
    res.status(200).json({
      message: 'Session deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
