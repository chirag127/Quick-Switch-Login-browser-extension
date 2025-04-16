/**
 * Session management module for the Quick Switch Login extension
 */

const sessionManager = (() => {
  /**
   * Save the current session for a specific domain
   * @param {string} domain - The domain to save the session for
   * @param {string} sessionName - User-defined name for the session
   * @returns {Promise<Object>} The saved session
   */
  const saveCurrentSession = async (domain, sessionName) => {
    try {
      // Get cookies for the domain
      const cookies = await chrome.cookies.getAll({ domain });
      
      // Get localStorage and sessionStorage via content script
      const tab = await utils.getCurrentTab();
      
      // Execute script to get storage data
      const storageData = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Get localStorage
          const localStorage = {};
          for (let i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i);
            localStorage[key] = window.localStorage.getItem(key);
          }
          
          // Get sessionStorage
          const sessionStorage = {};
          for (let i = 0; i < window.sessionStorage.length; i++) {
            const key = window.sessionStorage.key(i);
            sessionStorage[key] = window.sessionStorage.getItem(key);
          }
          
          return { localStorage, sessionStorage };
        }
      });
      
      // Create session object
      const session = {
        sessionId: utils.generateId(),
        sessionName,
        websiteDomain: domain,
        websiteFaviconUrl: utils.getFaviconUrl(domain),
        createdAt: new Date().toISOString(),
        cookies,
        localStorage: storageData[0].result.localStorage,
        sessionStorage: storageData[0].result.sessionStorage
      };
      
      // Save session locally
      await saveSessionLocally(session);
      
      // Try to sync with backend if user is authenticated
      if (await api.isAuthenticated()) {
        try {
          await api.saveSession(session);
        } catch (error) {
          console.error('Failed to sync session with backend:', error);
          // Session is still saved locally, so we can continue
        }
      }
      
      return session;
    } catch (error) {
      console.error('Failed to save session:', error);
      throw new Error('Failed to save session: ' + error.message);
    }
  };
  
  /**
   * Save a session to local storage
   * @param {Object} session - The session to save
   */
  const saveSessionLocally = async (session) => {
    // Get existing sessions
    const data = await chrome.storage.local.get(['sessions']);
    const sessions = data.sessions || [];
    
    // Add new session
    sessions.push(session);
    
    // Save to storage
    await chrome.storage.local.set({ sessions });
  };
  
  /**
   * Get all locally saved sessions
   * @returns {Promise<Array>} The saved sessions
   */
  const getLocalSessions = async () => {
    const data = await chrome.storage.local.get(['sessions']);
    return data.sessions || [];
  };
  
  /**
   * Get sessions for a specific domain
   * @param {string} domain - The domain to get sessions for
   * @returns {Promise<Array>} The sessions for the domain
   */
  const getSessionsForDomain = async (domain) => {
    const sessions = await getLocalSessions();
    return sessions.filter(session => session.websiteDomain === domain);
  };
  
  /**
   * Delete a session by ID
   * @param {string} sessionId - The ID of the session to delete
   * @returns {Promise<boolean>} Whether the deletion was successful
   */
  const deleteSession = async (sessionId) => {
    try {
      // Get existing sessions
      const data = await chrome.storage.local.get(['sessions']);
      const sessions = data.sessions || [];
      
      // Find the session index
      const sessionIndex = sessions.findIndex(s => s.sessionId === sessionId);
      if (sessionIndex === -1) {
        throw new Error('Session not found');
      }
      
      // Remove the session
      sessions.splice(sessionIndex, 1);
      
      // Save to storage
      await chrome.storage.local.set({ sessions });
      
      // Try to sync with backend if user is authenticated
      if (await api.isAuthenticated()) {
        try {
          await api.deleteSession(sessionId);
        } catch (error) {
          console.error('Failed to sync session deletion with backend:', error);
          // Session is still deleted locally, so we can continue
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw error;
    }
  };
  
  /**
   * Restore a session by ID
   * @param {string} sessionId - The ID of the session to restore
   * @returns {Promise<Object>} The restored session
   */
  const restoreSession = async (sessionId) => {
    try {
      // Get the session
      const data = await chrome.storage.local.get(['sessions']);
      const sessions = data.sessions || [];
      const session = sessions.find(s => s.sessionId === sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      const tab = await utils.getCurrentTab();
      const domain = utils.getDomainFromUrl(tab.url);
      
      // Verify we're on the correct domain
      if (domain !== session.websiteDomain) {
        throw new Error(`Cannot restore session: current domain (${domain}) does not match session domain (${session.websiteDomain})`);
      }
      
      // Clear existing cookies for the domain
      const existingCookies = await chrome.cookies.getAll({ domain });
      for (const cookie of existingCookies) {
        await chrome.cookies.remove({
          url: `${cookie.secure ? 'https' : 'http'}://${cookie.domain}${cookie.path}`,
          name: cookie.name
        });
      }
      
      // Set cookies from the session
      for (const cookie of session.cookies) {
        // Skip cookies that can't be set (httpOnly cookies can be set but not read)
        if (cookie.hostOnly && cookie.domain.startsWith('.')) {
          continue;
        }
        
        try {
          await chrome.cookies.set({
            url: `${cookie.secure ? 'https' : 'http'}://${cookie.domain}${cookie.path}`,
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path,
            secure: cookie.secure,
            httpOnly: cookie.httpOnly,
            sameSite: cookie.sameSite,
            expirationDate: cookie.expirationDate
          });
        } catch (error) {
          console.error(`Failed to set cookie ${cookie.name}:`, error);
          // Continue with other cookies
        }
      }
      
      // Set localStorage and sessionStorage via content script
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (localStorage, sessionStorage) => {
          // Clear existing localStorage
          window.localStorage.clear();
          
          // Set localStorage from session
          for (const [key, value] of Object.entries(localStorage)) {
            window.localStorage.setItem(key, value);
          }
          
          // Clear existing sessionStorage
          window.sessionStorage.clear();
          
          // Set sessionStorage from session
          for (const [key, value] of Object.entries(sessionStorage)) {
            window.sessionStorage.setItem(key, value);
          }
          
          return true;
        },
        args: [session.localStorage, session.sessionStorage]
      });
      
      return session;
    } catch (error) {
      console.error('Failed to restore session:', error);
      throw error;
    }
  };
  
  /**
   * Sync local sessions with the backend
   * @returns {Promise<Object>} Sync result
   */
  const syncSessions = async () => {
    try {
      if (!await api.isAuthenticated()) {
        return { success: false, message: 'Not authenticated' };
      }
      
      // Get local sessions
      const localSessions = await getLocalSessions();
      
      // Get remote sessions
      const remoteSessions = await api.getSessions();
      
      // Create maps for easier lookup
      const localSessionMap = new Map(localSessions.map(s => [s.sessionId, s]));
      const remoteSessionMap = new Map(remoteSessions.map(s => [s.sessionId, s]));
      
      // Sessions to add to local storage (remote sessions not in local)
      const sessionsToAdd = remoteSessions.filter(s => !localSessionMap.has(s.sessionId));
      
      // Sessions to add to remote (local sessions not in remote)
      const sessionsToSync = localSessions.filter(s => !remoteSessionMap.has(s.sessionId));
      
      // Add remote sessions to local storage
      if (sessionsToAdd.length > 0) {
        const newLocalSessions = [...localSessions, ...sessionsToAdd];
        await chrome.storage.local.set({ sessions: newLocalSessions });
      }
      
      // Sync local sessions to remote
      for (const session of sessionsToSync) {
        try {
          await api.saveSession(session);
        } catch (error) {
          console.error('Failed to sync session to remote:', error);
        }
      }
      
      return {
        success: true,
        added: sessionsToAdd.length,
        synced: sessionsToSync.length
      };
    } catch (error) {
      console.error('Failed to sync sessions:', error);
      throw error;
    }
  };
  
  /**
   * Group sessions by domain
   * @param {Array} sessions - The sessions to group
   * @returns {Object} Sessions grouped by domain
   */
  const groupSessionsByDomain = (sessions) => {
    const grouped = {};
    
    for (const session of sessions) {
      if (!grouped[session.websiteDomain]) {
        grouped[session.websiteDomain] = [];
      }
      
      grouped[session.websiteDomain].push(session);
    }
    
    return grouped;
  };
  
  // Public API
  return {
    saveCurrentSession,
    getLocalSessions,
    getSessionsForDomain,
    deleteSession,
    restoreSession,
    syncSessions,
    groupSessionsByDomain
  };
})();

// Make sessionManager available globally
window.sessionManager = sessionManager;
