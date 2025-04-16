import { auth, sessions } from './api.js';

// Get domain from URL
const getDomain = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    console.error('Invalid URL:', error);
    return null;
  }
};

// Get favicon URL for a domain
const getFaviconUrl = (domain) => {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
};

// Get all cookies for a domain
const getCookies = async (domain) => {
  try {
    const cookies = await chrome.cookies.getAll({ domain });
    return cookies.map(cookie => {
      // For HttpOnly cookies, we can't access the value but we can store metadata
      if (cookie.httpOnly) {
        return {
          ...cookie,
          value: null, // Can't access value of HttpOnly cookies
          httpOnly: true
        };
      }
      return cookie;
    });
  } catch (error) {
    console.error('Error getting cookies:', error);
    throw error;
  }
};

// Get localStorage for the current tab
const getLocalStorage = async (tabId) => {
  try {
    const result = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          data[key] = localStorage.getItem(key);
        }
        return data;
      }
    });
    
    return result[0].result || {};
  } catch (error) {
    console.error('Error getting localStorage:', error);
    return {};
  }
};

// Get sessionStorage for the current tab
const getSessionStorage = async (tabId) => {
  try {
    const result = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const data = {};
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          data[key] = sessionStorage.getItem(key);
        }
        return data;
      }
    });
    
    return result[0].result || {};
  } catch (error) {
    console.error('Error getting sessionStorage:', error);
    return {};
  }
};

// Save current session
const saveCurrentSession = async (tabId, url, sessionName) => {
  try {
    const domain = getDomain(url);
    
    if (!domain) {
      throw new Error('Invalid URL');
    }
    
    // Get session data
    const cookies = await getCookies(domain);
    const localStorage = await getLocalStorage(tabId);
    const sessionStorage = await getSessionStorage(tabId);
    const faviconUrl = getFaviconUrl(domain);
    
    // Create session object
    const sessionData = {
      name: sessionName,
      domain,
      faviconUrl,
      cookies,
      localStorage,
      sessionStorage
    };
    
    // Save to local storage
    const localSessions = await getLocalSessions();
    localSessions.push({
      ...sessionData,
      id: Date.now().toString(), // Generate a local ID
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    await chrome.storage.local.set({ sessions: localSessions });
    
    // If user is logged in, sync with backend
    const isLoggedIn = await auth.isLoggedIn();
    if (isLoggedIn) {
      try {
        await sessions.saveSession(sessionData);
      } catch (error) {
        console.error('Error syncing session with backend:', error);
        // Continue with local save even if sync fails
      }
    }
    
    return sessionData;
  } catch (error) {
    console.error('Error saving session:', error);
    throw error;
  }
};

// Get all sessions from local storage
const getLocalSessions = async () => {
  try {
    const data = await chrome.storage.local.get('sessions');
    return data.sessions || [];
  } catch (error) {
    console.error('Error getting local sessions:', error);
    return [];
  }
};

// Get sessions for a specific domain from local storage
const getLocalSessionsByDomain = async (domain) => {
  try {
    const sessions = await getLocalSessions();
    return sessions.filter(session => session.domain === domain);
  } catch (error) {
    console.error('Error getting local sessions by domain:', error);
    return [];
  }
};

// Delete a session from local storage
const deleteLocalSession = async (sessionId) => {
  try {
    const sessions = await getLocalSessions();
    const updatedSessions = sessions.filter(session => session.id !== sessionId);
    await chrome.storage.local.set({ sessions: updatedSessions });
    
    // If user is logged in, sync with backend
    const isLoggedIn = await auth.isLoggedIn();
    if (isLoggedIn) {
      try {
        await sessions.deleteSession(sessionId);
      } catch (error) {
        console.error('Error syncing session deletion with backend:', error);
        // Continue with local delete even if sync fails
      }
    }
    
    return { message: 'Session deleted successfully' };
  } catch (error) {
    console.error('Error deleting local session:', error);
    throw error;
  }
};

// Clear all cookies for a domain
const clearCookies = async (domain) => {
  try {
    const cookies = await chrome.cookies.getAll({ domain });
    
    for (const cookie of cookies) {
      const url = `${cookie.secure ? 'https' : 'http'}://${cookie.domain}${cookie.path}`;
      await chrome.cookies.remove({
        url,
        name: cookie.name
      });
    }
  } catch (error) {
    console.error('Error clearing cookies:', error);
    throw error;
  }
};

// Set cookies for a domain
const setCookies = async (cookies) => {
  try {
    for (const cookie of cookies) {
      // Skip HttpOnly cookies as we can't set them directly
      if (cookie.httpOnly && !cookie.value) continue;
      
      // Prepare cookie for setting
      const cookieToSet = {
        url: `${cookie.secure ? 'https' : 'http'}://${cookie.domain}${cookie.path}`,
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
        expirationDate: cookie.expirationDate
      };
      
      await chrome.cookies.set(cookieToSet);
    }
  } catch (error) {
    console.error('Error setting cookies:', error);
    throw error;
  }
};

// Clear localStorage for the current tab
const clearLocalStorage = async (tabId) => {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        localStorage.clear();
      }
    });
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    throw error;
  }
};

// Set localStorage for the current tab
const setLocalStorage = async (tabId, data) => {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (storageData) => {
        for (const [key, value] of Object.entries(storageData)) {
          localStorage.setItem(key, value);
        }
      },
      args: [data]
    });
  } catch (error) {
    console.error('Error setting localStorage:', error);
    throw error;
  }
};

// Clear sessionStorage for the current tab
const clearSessionStorage = async (tabId) => {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        sessionStorage.clear();
      }
    });
  } catch (error) {
    console.error('Error clearing sessionStorage:', error);
    throw error;
  }
};

// Set sessionStorage for the current tab
const setSessionStorage = async (tabId, data) => {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (storageData) => {
        for (const [key, value] of Object.entries(storageData)) {
          sessionStorage.setItem(key, value);
        }
      },
      args: [data]
    });
  } catch (error) {
    console.error('Error setting sessionStorage:', error);
    throw error;
  }
};

// Restore a session
const restoreSession = async (tabId, url, sessionData) => {
  try {
    const domain = getDomain(url);
    
    if (!domain || domain !== sessionData.domain) {
      throw new Error('Domain mismatch');
    }
    
    // Clear existing data
    await clearCookies(domain);
    await clearLocalStorage(tabId);
    await clearSessionStorage(tabId);
    
    // Set new data
    await setCookies(sessionData.cookies);
    await setLocalStorage(tabId, sessionData.localStorage);
    await setSessionStorage(tabId, sessionData.sessionStorage);
    
    return { message: 'Session restored successfully' };
  } catch (error) {
    console.error('Error restoring session:', error);
    throw error;
  }
};

// Sync sessions with backend
const syncSessions = async () => {
  try {
    const isLoggedIn = await auth.isLoggedIn();
    
    if (!isLoggedIn) {
      return { message: 'User not logged in, skipping sync' };
    }
    
    // Get sessions from backend
    const backendData = await sessions.getAllSessions();
    const backendSessions = backendData.sessions;
    
    // Get local sessions
    const localSessions = await getLocalSessions();
    
    // Merge sessions (backend is source of truth)
    // This is a simple implementation - in a real app, you might want more sophisticated conflict resolution
    await chrome.storage.local.set({ sessions: backendSessions });
    
    return { message: 'Sessions synced successfully' };
  } catch (error) {
    console.error('Error syncing sessions:', error);
    throw error;
  }
};

export {
  getDomain,
  getFaviconUrl,
  saveCurrentSession,
  getLocalSessions,
  getLocalSessionsByDomain,
  deleteLocalSession,
  restoreSession,
  syncSessions
};
