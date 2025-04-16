import { getDomain, getLocalSessionsByDomain, restoreSession, saveCurrentSession } from '../js/session.js';
import { auth, sessions } from '../js/api.js';

// Initialize context menu
chrome.runtime.onInstalled.addListener(() => {
  // Create parent menu item
  chrome.contextMenus.create({
    id: 'quick-switch-login',
    title: 'Quick Switch Login',
    contexts: ['page']
  });
  
  // Create "Save Current Session" menu item
  chrome.contextMenus.create({
    id: 'save-session',
    parentId: 'quick-switch-login',
    title: 'Save Current Session...',
    contexts: ['page']
  });
  
  // Create "Restore Session" submenu
  chrome.contextMenus.create({
    id: 'restore-session',
    parentId: 'quick-switch-login',
    title: 'Restore Session',
    contexts: ['page']
  });
  
  // Create "Manage All Sessions" menu item
  chrome.contextMenus.create({
    id: 'manage-sessions',
    parentId: 'quick-switch-login',
    title: 'Manage All Sessions',
    contexts: ['page']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.url) return;
  
  const domain = getDomain(tab.url);
  
  if (info.menuItemId === 'save-session') {
    // Prompt user for session name
    const sessionName = await promptUser('Enter a name for this session:');
    
    if (!sessionName) return; // User cancelled
    
    try {
      await saveCurrentSession(tab.id, tab.url, sessionName);
      // Notify user of success
      chrome.tabs.sendMessage(tab.id, {
        action: 'showNotification',
        message: `Session "${sessionName}" saved for ${domain}`,
        type: 'success'
      });
    } catch (error) {
      // Notify user of error
      chrome.tabs.sendMessage(tab.id, {
        action: 'showNotification',
        message: `Error saving session: ${error.message}`,
        type: 'error'
      });
    }
  } else if (info.menuItemId === 'manage-sessions') {
    // Open popup
    chrome.action.openPopup();
  } else if (info.menuItemId.startsWith('restore-session-')) {
    // Extract session ID from menu item ID
    const sessionId = info.menuItemId.replace('restore-session-', '');
    
    try {
      // Get session data
      const localSessions = await getLocalSessionsByDomain(domain);
      const sessionData = localSessions.find(session => session.id === sessionId);
      
      if (!sessionData) {
        throw new Error('Session not found');
      }
      
      // Confirm restoration
      const confirmed = await confirmAction(`Replace current session for ${domain} with "${sessionData.name}"?`);
      
      if (!confirmed) return; // User cancelled
      
      // Restore session
      await restoreSession(tab.id, tab.url, sessionData);
      
      // Notify user of success
      chrome.tabs.sendMessage(tab.id, {
        action: 'showNotification',
        message: `Session "${sessionData.name}" restored`,
        type: 'success'
      });
      
      // Ask if user wants to reload the page
      const reload = await confirmAction('Session restored. Reload the page for changes to take effect?');
      
      if (reload) {
        chrome.tabs.reload(tab.id);
      }
    } catch (error) {
      // Notify user of error
      chrome.tabs.sendMessage(tab.id, {
        action: 'showNotification',
        message: `Error restoring session: ${error.message}`,
        type: 'error'
      });
    }
  }
});

// Update context menu based on current tab
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  updateContextMenu(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    updateContextMenu(tabId);
  }
});

// Update context menu with available sessions for the current domain
const updateContextMenu = async (tabId) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    
    if (!tab.url) return;
    
    const domain = getDomain(tab.url);
    
    if (!domain) return;
    
    // Remove existing restore session items
    const items = await chrome.contextMenus.getAll();
    for (const item of items) {
      if (item.id.startsWith('restore-session-')) {
        await chrome.contextMenus.remove(item.id);
      }
    }
    
    // Get sessions for this domain
    const domainSessions = await getLocalSessionsByDomain(domain);
    
    // Update "Restore Session" submenu title
    await chrome.contextMenus.update('restore-session', {
      title: `Restore Session for ${domain}`
    });
    
    // Add session items to the submenu
    for (const session of domainSessions) {
      await chrome.contextMenus.create({
        id: `restore-session-${session.id}`,
        parentId: 'restore-session',
        title: session.name,
        contexts: ['page']
      });
    }
    
    // If no sessions, add a placeholder
    if (domainSessions.length === 0) {
      await chrome.contextMenus.create({
        id: 'no-sessions',
        parentId: 'restore-session',
        title: 'No saved sessions for this domain',
        enabled: false,
        contexts: ['page']
      });
    }
  } catch (error) {
    console.error('Error updating context menu:', error);
  }
};

// Helper function to prompt user for input
const promptUser = (message) => {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        resolve(null);
        return;
      }
      
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'promptUser',
        message
      }, (response) => {
        resolve(response ? response.input : null);
      });
    });
  });
};

// Helper function to confirm action
const confirmAction = (message) => {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        resolve(false);
        return;
      }
      
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'confirmAction',
        message
      }, (response) => {
        resolve(response ? response.confirmed : false);
      });
    });
  });
};
