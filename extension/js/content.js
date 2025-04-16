/**
 * Content script for the Quick Switch Login extension
 * This script is injected into web pages to interact with localStorage and sessionStorage
 */

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getStorageData') {
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
    
    sendResponse({ localStorage, sessionStorage });
    return true;
  }
  
  if (request.action === 'setStorageData') {
    try {
      // Clear and set localStorage
      if (request.localStorage) {
        window.localStorage.clear();
        for (const [key, value] of Object.entries(request.localStorage)) {
          window.localStorage.setItem(key, value);
        }
      }
      
      // Clear and set sessionStorage
      if (request.sessionStorage) {
        window.sessionStorage.clear();
        for (const [key, value] of Object.entries(request.sessionStorage)) {
          window.sessionStorage.setItem(key, value);
        }
      }
      
      sendResponse({ success: true });
    } catch (error) {
      console.error('Failed to set storage data:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }
});
