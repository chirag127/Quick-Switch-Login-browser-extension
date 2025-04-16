/**
 * Background Service Worker for Quick Switch Login extension
 * Handles events and background tasks
 */

// Initialize context menu items
chrome.runtime.onInstalled.addListener(() => {
  // Create parent menu item
  chrome.contextMenus.create({
    id: 'quick-switch-login',
    title: 'Quick Switch Login',
    contexts: ['page']
  });
  
  // Create "Save current session" menu item
  chrome.contextMenus.create({
    id: 'save-session',
    parentId: 'quick-switch-login',
    title: 'Save current session...',
    contexts: ['page']
  });
  
  // Create "Restore session" submenu (will be populated dynamically)
  chrome.contextMenus.create({
    id: 'restore-session',
    parentId: 'quick-switch-login',
    title: 'Restore session for current domain',
    contexts: ['page']
  });
  
  // Set up alarm for periodic sync (every 15 minutes)
  chrome.alarms.create('syncSessions', { periodInMinutes: 15 });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'save-session') {
    // Open popup to save current session
    chrome.action.openPopup();
  } else if (info.menuItemId.startsWith('restore-session-')) {
    // Extract session ID from menu item ID
    const sessionId = info.menuItemId.replace('restore-session-', '');
    
    // Get the session from storage
    const sessions = await StorageManager.getSessions();
    const session = sessions.find(s => s.sessionId === sessionId);
    
    if (session) {
      // Send message to restore the session
      chrome.tabs.sendMessage(tab.id, {
        action: 'restoreSession',
        session
      });
    }
  }
});

// Update context menu items when tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await updateContextMenu(activeInfo.tabId);
});

// Update context menu items when tab URL changes
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    await updateContextMenu(tabId);
    
    // Check if there's a pending session to restore
    const sessionToRestore = await StorageManager.getSessionToRestore();
    if (sessionToRestore) {
      const url = new URL(tab.url);
      const domain = url.hostname;
      
      if (domain === sessionToRestore.domain) {
        // We've navigated to the correct domain, notify popup to show restore confirmation
        chrome.runtime.sendMessage({ action: 'checkPendingRestore' });
      }
    }
  }
});

// Handle automatic session saving when page loads
chrome.runtime.onMessage.addListener(async (message, sender) => {
  if (message.action === 'pageLoaded' && sender.tab) {
    try {
      const url = new URL(message.url);
      const domain = url.hostname;
      const origin = url.origin;
      
      // Get cookies for the domain
      const cookies = await new Promise((resolve) => {
        chrome.cookies.getAll({ domain }, (cookies) => {
          resolve(cookies);
        });
      });
      
      // Get localStorage and sessionStorage via content script
      const storageData = await chrome.tabs.sendMessage(sender.tab.id, { action: 'getStorageData' });
      
      // Create auto-save session data
      const sessionData = {
        domain,
        origin,
        cookieData: cookies,
        localStorageData: storageData.localStorage,
        sessionStorageData: storageData.sessionStorage
      };
      
      // Save to auto-saves storage
      await StorageManager.setAutoSave(domain, sessionData);
    } catch (error) {
      console.error('Error auto-saving session:', error);
    }
  }
});

// Handle alarm events (periodic sync)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'syncSessions') {
    await syncWithBackend();
  }
});

/**
 * Update the context menu with sessions for the current domain
 * @param {number} tabId ID of the active tab
 */
async function updateContextMenu(tabId) {
  try {
    // Get the tab information
    const tab = await new Promise((resolve) => {
      chrome.tabs.get(tabId, (tab) => {
        resolve(tab);
      });
    });
    
    if (!tab.url || tab.url.startsWith('chrome://')) {
      return; // Skip for chrome:// URLs
    }
    
    // Get the domain from the URL
    const url = new URL(tab.url);
    const domain = url.hostname;
    
    // Clear existing restore session menu items
    const existingItems = await new Promise((resolve) => {
      chrome.contextMenus.getAll((items) => {
        resolve(items.filter(item => item.id.startsWith('restore-session-')));
      });
    });
    
    for (const item of existingItems) {
      await new Promise((resolve) => {
        chrome.contextMenus.remove(item.id, () => {
          resolve();
        });
      });
    }
    
    // Get sessions for the current domain
    const sessions = await StorageManager.getSessions();
    const domainSessions = sessions.filter(session => session.domain === domain);
    
    if (domainSessions.length === 0) {
      // No sessions for this domain, add a placeholder item
      chrome.contextMenus.create({
        id: 'no-sessions',
        parentId: 'restore-session',
        title: 'No saved sessions for this domain',
        enabled: false,
        contexts: ['page']
      });
    } else {
      // Add menu items for each session
      for (const session of domainSessions) {
        chrome.contextMenus.create({
          id: `restore-session-${session.sessionId}`,
          parentId: 'restore-session',
          title: session.sessionName,
          contexts: ['page']
        });
      }
    }
  } catch (error) {
    console.error('Error updating context menu:', error);
  }
}

/**
 * Sync sessions with the backend
 */
async function syncWithBackend() {
  try {
    // Check if user is logged in
    const user = await StorageManager.getAuthUser();
    if (!user) {
      return; // Not logged in, skip sync
    }
    
    // Get offline changes
    const offlineChanges = await StorageManager.getOfflineChanges();
    
    // If there are offline changes, sync them
    if (offlineChanges.created.length > 0 || offlineChanges.updated.length > 0 || offlineChanges.deleted.length > 0) {
      await ApiClient.syncOfflineChanges(offlineChanges);
      await StorageManager.clearOfflineChanges();
    }
    
    // Get sessions from backend
    const remoteSessions = await ApiClient.getSessions();
    
    // Get local sessions
    const localSessions = await StorageManager.getSessions();
    
    // Merge sessions using last-write-wins strategy
    const mergedSessions = mergeSessionsLastWriteWins(localSessions, remoteSessions);
    
    // Save merged sessions to storage
    await StorageManager.setSessions(mergedSessions);
  } catch (error) {
    console.error('Error syncing with backend:', error);
    
    // If there was an error, we'll try again on the next sync
  }
}

/**
 * Merge local and remote sessions using last-write-wins strategy
 * @param {Array} localSessions Local sessions
 * @param {Array} remoteSessions Remote sessions
 * @returns {Array} Merged sessions
 */
function mergeSessionsLastWriteWins(localSessions, remoteSessions) {
  const sessionsMap = new Map();
  
  // Add all local sessions to the map
  localSessions.forEach(session => {
    sessionsMap.set(session.sessionId, session);
  });
  
  // Add or update with remote sessions based on updatedAt timestamp
  remoteSessions.forEach(remoteSession => {
    const localSession = sessionsMap.get(remoteSession.sessionId);
    
    if (!localSession || new Date(remoteSession.updatedAt) > new Date(localSession.updatedAt)) {
      sessionsMap.set(remoteSession.sessionId, remoteSession);
    }
  });
  
  // Convert map back to array
  return Array.from(sessionsMap.values());
}
