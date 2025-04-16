/**
 * Storage Manager for the Quick Switch Login extension
 * Handles all interactions with chrome.storage.local
 */
const StorageManager = {
  /**
   * Get all saved sessions
   * @returns {Promise<Array>} Array of session objects
   */
  getSessions: async function() {
    return new Promise((resolve) => {
      chrome.storage.local.get('sessions', (result) => {
        resolve(result.sessions || []);
      });
    });
  },

  /**
   * Save a new session
   * @param {Object} session Session object to save
   * @returns {Promise<void>}
   */
  saveSession: async function(session) {
    const sessions = await this.getSessions();
    sessions.push(session);
    return new Promise((resolve) => {
      chrome.storage.local.set({ sessions }, () => {
        resolve();
      });
    });
  },

  /**
   * Update an existing session
   * @param {Object} updatedSession Session object with updates
   * @returns {Promise<void>}
   */
  updateSession: async function(updatedSession) {
    const sessions = await this.getSessions();
    const index = sessions.findIndex(s => s.sessionId === updatedSession.sessionId);
    
    if (index !== -1) {
      sessions[index] = updatedSession;
      return new Promise((resolve) => {
        chrome.storage.local.set({ sessions }, () => {
          resolve();
        });
      });
    } else {
      throw new Error('Session not found');
    }
  },

  /**
   * Delete a session by ID
   * @param {string} sessionId ID of the session to delete
   * @returns {Promise<void>}
   */
  deleteSession: async function(sessionId) {
    const sessions = await this.getSessions();
    const filteredSessions = sessions.filter(s => s.sessionId !== sessionId);
    
    return new Promise((resolve) => {
      chrome.storage.local.set({ sessions: filteredSessions }, () => {
        resolve();
      });
    });
  },

  /**
   * Set all sessions (used for sync)
   * @param {Array} sessions Array of session objects
   * @returns {Promise<void>}
   */
  setSessions: async function(sessions) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ sessions }, () => {
        resolve();
      });
    });
  },

  /**
   * Get the authenticated user
   * @returns {Promise<Object|null>} User object or null if not authenticated
   */
  getAuthUser: async function() {
    return new Promise((resolve) => {
      chrome.storage.local.get('authUser', (result) => {
        resolve(result.authUser || null);
      });
    });
  },

  /**
   * Set the authenticated user
   * @param {Object} user User object
   * @returns {Promise<void>}
   */
  setAuthUser: async function(user) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ authUser: user }, () => {
        resolve();
      });
    });
  },

  /**
   * Clear the authenticated user (logout)
   * @returns {Promise<void>}
   */
  clearAuthUser: async function() {
    return new Promise((resolve) => {
      chrome.storage.local.remove('authUser', () => {
        resolve();
      });
    });
  },

  /**
   * Get the automatic save for a domain
   * @param {string} domain Domain to get auto-save for
   * @returns {Promise<Object|null>} Auto-save session or null
   */
  getAutoSave: async function(domain) {
    return new Promise((resolve) => {
      chrome.storage.local.get('autoSaves', (result) => {
        const autoSaves = result.autoSaves || {};
        resolve(autoSaves[domain] || null);
      });
    });
  },

  /**
   * Set the automatic save for a domain
   * @param {string} domain Domain to set auto-save for
   * @param {Object} sessionData Session data to save
   * @returns {Promise<void>}
   */
  setAutoSave: async function(domain, sessionData) {
    return new Promise((resolve) => {
      chrome.storage.local.get('autoSaves', (result) => {
        const autoSaves = result.autoSaves || {};
        autoSaves[domain] = {
          ...sessionData,
          updatedAt: new Date().toISOString()
        };
        
        chrome.storage.local.set({ autoSaves }, () => {
          resolve();
        });
      });
    });
  },

  /**
   * Get all automatic saves
   * @returns {Promise<Object>} Object with domain keys and session data values
   */
  getAllAutoSaves: async function() {
    return new Promise((resolve) => {
      chrome.storage.local.get('autoSaves', (result) => {
        resolve(result.autoSaves || {});
      });
    });
  },

  /**
   * Set a session to restore after navigation
   * @param {Object} session Session to restore
   * @returns {Promise<void>}
   */
  setSessionToRestore: async function(session) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ sessionToRestore: session }, () => {
        resolve();
      });
    });
  },

  /**
   * Get the session to restore after navigation
   * @returns {Promise<Object|null>} Session to restore or null
   */
  getSessionToRestore: async function() {
    return new Promise((resolve) => {
      chrome.storage.local.get('sessionToRestore', (result) => {
        resolve(result.sessionToRestore || null);
      });
    });
  },

  /**
   * Clear the session to restore
   * @returns {Promise<void>}
   */
  clearSessionToRestore: async function() {
    return new Promise((resolve) => {
      chrome.storage.local.remove('sessionToRestore', () => {
        resolve();
      });
    });
  },

  /**
   * Get offline changes that need to be synced
   * @returns {Promise<Object>} Object with changes to sync
   */
  getOfflineChanges: async function() {
    return new Promise((resolve) => {
      chrome.storage.local.get('offlineChanges', (result) => {
        resolve(result.offlineChanges || { created: [], updated: [], deleted: [] });
      });
    });
  },

  /**
   * Add an offline change
   * @param {string} changeType Type of change ('created', 'updated', 'deleted')
   * @param {Object|string} data Session object or sessionId
   * @returns {Promise<void>}
   */
  addOfflineChange: async function(changeType, data) {
    return new Promise((resolve) => {
      chrome.storage.local.get('offlineChanges', (result) => {
        const offlineChanges = result.offlineChanges || { created: [], updated: [], deleted: [] };
        
        if (changeType === 'created' || changeType === 'updated') {
          // For created/updated, we store the full session object
          offlineChanges[changeType].push(data);
        } else if (changeType === 'deleted') {
          // For deleted, we just store the sessionId
          offlineChanges.deleted.push(data);
        }
        
        chrome.storage.local.set({ offlineChanges }, () => {
          resolve();
        });
      });
    });
  },

  /**
   * Clear offline changes after sync
   * @returns {Promise<void>}
   */
  clearOfflineChanges: async function() {
    return new Promise((resolve) => {
      chrome.storage.local.remove('offlineChanges', () => {
        resolve();
      });
    });
  }
};
