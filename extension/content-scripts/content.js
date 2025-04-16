/**
 * Content script for Quick Switch Login extension
 * Handles access to localStorage and sessionStorage
 */

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    if (message.action === 'getStorageData') {
      // Get localStorage and sessionStorage data
      const storageData = {
        localStorage: getLocalStorage(),
        sessionStorage: getSessionStorage()
      };
      
      sendResponse(storageData);
    } else if (message.action === 'setStorageData') {
      // Set localStorage and sessionStorage data
      setLocalStorage(message.data.localStorage);
      setSessionStorage(message.data.sessionStorage);
      
      sendResponse({ success: true });
    }
  } catch (error) {
    console.error('Content script error:', error);
    sendResponse({ error: error.message });
  }
  
  // Return true to indicate that we will send a response asynchronously
  return true;
});

/**
 * Get all key-value pairs from localStorage
 * @returns {Object} localStorage data
 */
function getLocalStorage() {
  const data = {};
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    try {
      data[key] = localStorage.getItem(key);
    } catch (error) {
      console.error(`Error getting localStorage item ${key}:`, error);
    }
  }
  
  return data;
}

/**
 * Get all key-value pairs from sessionStorage
 * @returns {Object} sessionStorage data
 */
function getSessionStorage() {
  const data = {};
  
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    try {
      data[key] = sessionStorage.getItem(key);
    } catch (error) {
      console.error(`Error getting sessionStorage item ${key}:`, error);
    }
  }
  
  return data;
}

/**
 * Set localStorage from saved data
 * @param {Object} data localStorage data to set
 */
function setLocalStorage(data) {
  // Clear existing localStorage
  localStorage.clear();
  
  // Set new values
  for (const key in data) {
    try {
      localStorage.setItem(key, data[key]);
    } catch (error) {
      console.error(`Error setting localStorage item ${key}:`, error);
    }
  }
}

/**
 * Set sessionStorage from saved data
 * @param {Object} data sessionStorage data to set
 */
function setSessionStorage(data) {
  // Clear existing sessionStorage
  sessionStorage.clear();
  
  // Set new values
  for (const key in data) {
    try {
      sessionStorage.setItem(key, data[key]);
    } catch (error) {
      console.error(`Error setting sessionStorage item ${key}:`, error);
    }
  }
}

// Notify the background script that the page has loaded
// This is used for automatic session saving
window.addEventListener('load', () => {
  chrome.runtime.sendMessage({ action: 'pageLoaded', url: window.location.href });
});
