/**
 * Popup script for the Quick Switch Login extension
 */

// DOM Elements
const authSection = document.getElementById('auth-section');
const loggedOutView = document.getElementById('logged-out-view');
const loggedInView = document.getElementById('logged-in-view');
const userEmail = document.getElementById('user-email');
const signInBtn = document.getElementById('sign-in-btn');
const signUpBtn = document.getElementById('sign-up-btn');
const logoutBtn = document.getElementById('logout-btn');
const resetPasswordBtn = document.getElementById('reset-password-btn');
const deleteAccountBtn = document.getElementById('delete-account-btn');

const signInForm = document.getElementById('sign-in-form');
const signUpForm = document.getElementById('sign-up-form');
const forgotPasswordForm = document.getElementById('forgot-password-form');
const deleteAccountConfirm = document.getElementById('delete-account-confirm');

const saveSessionBtn = document.getElementById('save-session-btn');
const saveSessionModal = document.getElementById('save-session-modal');
const saveSessionForm = document.getElementById('save-session-form');
const sessionNameInput = document.getElementById('session-name');
const cancelSaveBtn = document.getElementById('cancel-save');

const sessionsSection = document.getElementById('sessions-section');
const noSessionsMessage = document.getElementById('no-sessions-message');
const sessionsList = document.getElementById('sessions-list');

const restoreConfirmModal = document.getElementById('restore-confirm-modal');
const restoreDomain = document.getElementById('restore-domain');
const restoreName = document.getElementById('restore-name');
const confirmRestoreBtn = document.getElementById('confirm-restore');
const cancelRestoreBtn = document.getElementById('cancel-restore');

const deleteConfirmModal = document.getElementById('delete-confirm-modal');
const deleteName = document.getElementById('delete-name');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const cancelDeleteBtn = document.getElementById('cancel-delete');

const reloadPromptModal = document.getElementById('reload-prompt-modal');
const restoredName = document.getElementById('restored-name');
const reloadNowBtn = document.getElementById('reload-now');
const reloadLaterBtn = document.getElementById('reload-later');

const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const blacklistMode = document.getElementById('blacklist-mode');
const whitelistMode = document.getElementById('whitelist-mode');
const domainList = document.getElementById('domain-list');
const saveSettingsBtn = document.getElementById('save-settings');
const cancelSettingsBtn = document.getElementById('cancel-settings');

const syncStatus = document.getElementById('sync-status');

// State variables
let currentTab = null;
let currentDomain = '';
let currentSessionId = null;
let currentSessionToDelete = null;
let sessions = [];

// Initialize the popup
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Get the current tab
    currentTab = await utils.getCurrentTab();
    
    if (currentTab && utils.isValidUrl(currentTab.url)) {
      currentDomain = utils.getDomainFromUrl(currentTab.url);
      
      // Check if the extension is enabled for this domain
      const isEnabled = await isExtensionEnabledForDomain(currentDomain);
      
      // Enable/disable the save button based on domain validity and extension settings
      saveSessionBtn.disabled = !isEnabled;
      if (!isEnabled) {
        saveSessionBtn.title = `Extension is disabled for ${currentDomain}`;
      } else {
        saveSessionBtn.title = `Save current session for ${currentDomain}`;
      }
    } else {
      saveSessionBtn.disabled = true;
      saveSessionBtn.title = 'Cannot save session for this page';
    }
    
    // Check for authentication
    const isAuthenticated = await api.isAuthenticated();
    updateAuthUI(isAuthenticated);
    
    if (isAuthenticated) {
      try {
        // Get user info
        const user = await api.getCurrentUser();
        userEmail.textContent = user.email;
        
        // Sync sessions
        await syncSessions();
      } catch (error) {
        console.error('Failed to get user info or sync sessions:', error);
        utils.showToast('Failed to sync sessions. Please try again later.', 'error');
      }
    }
    
    // Load sessions
    await loadSessions();
    
    // Check if we have temp save data (from context menu)
    const data = await chrome.storage.local.get(['tempSaveData']);
    if (data.tempSaveData) {
      // Show save session modal with the domain from temp data
      showSaveSessionModal(data.tempSaveData.domain, data.tempSaveData.tabId, data.tempSaveData.defaultName);
      // Clear temp data
      await chrome.storage.local.remove('tempSaveData');
    }
    
    // Load settings
    await loadSettings();
  } catch (error) {
    console.error('Failed to initialize popup:', error);
    utils.showToast('Failed to initialize. Please try again.', 'error');
  }
});

// Check if the extension is enabled for a domain
async function isExtensionEnabledForDomain(domain) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'isExtensionEnabledForDomain',
      domain
    });
    return response.enabled;
  } catch (error) {
    console.error('Failed to check if extension is enabled for domain:', error);
    return true; // Default to enabled if check fails
  }
}

// Update the authentication UI based on login state
function updateAuthUI(isAuthenticated) {
  if (isAuthenticated) {
    loggedOutView.classList.add('hidden');
    loggedInView.classList.remove('hidden');
    syncStatus.textContent = 'Synced';
  } else {
    loggedOutView.classList.remove('hidden');
    loggedInView.classList.add('hidden');
    syncStatus.textContent = 'Local Only';
  }
}

// Load sessions from storage
async function loadSessions() {
  try {
    sessions = await sessionManager.getLocalSessions();
    
    if (sessions.length === 0) {
      noSessionsMessage.classList.remove('hidden');
      sessionsList.classList.add('hidden');
      return;
    }
    
    noSessionsMessage.classList.add('hidden');
    sessionsList.classList.remove('hidden');
    
    // Group sessions by domain
    const groupedSessions = sessionManager.groupSessionsByDomain(sessions);
    
    // Clear the sessions list
    sessionsList.innerHTML = '';
    
    // Add each domain group
    for (const [domain, domainSessions] of Object.entries(groupedSessions)) {
      const domainGroup = document.createElement('div');
      domainGroup.className = 'domain-group';
      
      // Create domain header
      const domainHeader = document.createElement('div');
      domainHeader.className = 'domain-header';
      
      const domainFavicon = document.createElement('img');
      domainFavicon.className = 'domain-favicon';
      domainFavicon.src = utils.getFaviconUrl(domain);
      domainFavicon.alt = domain;
      
      const domainName = document.createElement('span');
      domainName.className = 'domain-name';
      domainName.textContent = domain;
      
      domainHeader.appendChild(domainFavicon);
      domainHeader.appendChild(domainName);
      domainGroup.appendChild(domainHeader);
      
      // Add each session for this domain
      domainSessions.forEach(session => {
        const sessionItem = document.createElement('div');
        sessionItem.className = 'session-item';
        
        const sessionName = document.createElement('span');
        sessionName.className = 'session-name';
        sessionName.textContent = session.sessionName;
        
        const sessionActions = document.createElement('div');
        sessionActions.className = 'session-actions';
        
        const restoreBtn = document.createElement('button');
        restoreBtn.className = 'btn btn-primary btn-small';
        restoreBtn.textContent = 'Restore';
        restoreBtn.disabled = domain !== currentDomain;
        restoreBtn.title = domain !== currentDomain ? 
          `Navigate to ${domain} to restore this session` : 
          `Restore "${session.sessionName}"`;
        
        restoreBtn.addEventListener('click', () => {
          showRestoreConfirmModal(session);
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger btn-small';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => {
          showDeleteConfirmModal(session);
        });
        
        sessionActions.appendChild(restoreBtn);
        sessionActions.appendChild(deleteBtn);
        
        sessionItem.appendChild(sessionName);
        sessionItem.appendChild(sessionActions);
        
        domainGroup.appendChild(sessionItem);
      });
      
      sessionsList.appendChild(domainGroup);
    }
  } catch (error) {
    console.error('Failed to load sessions:', error);
    utils.showToast('Failed to load sessions. Please try again.', 'error');
  }
}

// Load settings from storage
async function loadSettings() {
  try {
    const settings = await chrome.storage.local.get(['restrictionMode', 'domainList']);
    
    if (settings.restrictionMode === 'whitelist') {
      whitelistMode.checked = true;
    } else {
      blacklistMode.checked = true;
    }
    
    domainList.value = settings.domainList || '';
  } catch (error) {
    console.error('Failed to load settings:', error);
    utils.showToast('Failed to load settings. Default settings will be used.', 'warning');
  }
}

// Save settings to storage
async function saveSettings() {
  try {
    const restrictionMode = whitelistMode.checked ? 'whitelist' : 'blacklist';
    const domains = domainList.value.trim();
    
    await chrome.storage.local.set({
      restrictionMode,
      domainList: domains
    });
    
    utils.showToast('Settings saved successfully.', 'success');
    hideSettingsModal();
    
    // Update save button state if needed
    if (currentDomain) {
      const isEnabled = await isExtensionEnabledForDomain(currentDomain);
      saveSessionBtn.disabled = !isEnabled;
      if (!isEnabled) {
        saveSessionBtn.title = `Extension is disabled for ${currentDomain}`;
      } else {
        saveSessionBtn.title = `Save current session for ${currentDomain}`;
      }
    }
  } catch (error) {
    console.error('Failed to save settings:', error);
    utils.showToast('Failed to save settings. Please try again.', 'error');
  }
}

// Sync sessions with the backend
async function syncSessions() {
  try {
    const isAuthenticated = await api.isAuthenticated();
    if (!isAuthenticated) {
      syncStatus.textContent = 'Local Only';
      return;
    }
    
    syncStatus.textContent = 'Syncing...';
    
    const result = await sessionManager.syncSessions();
    
    if (result.success) {
      syncStatus.textContent = 'Synced';
      
      // Reload sessions if any were added
      if (result.added > 0 || result.synced > 0) {
        await loadSessions();
      }
      
      return result;
    } else {
      syncStatus.textContent = 'Sync Failed';
      utils.showToast('Failed to sync sessions. Please try again later.', 'error');
    }
  } catch (error) {
    console.error('Failed to sync sessions:', error);
    syncStatus.textContent = 'Sync Failed';
    utils.showToast('Failed to sync sessions. Please try again later.', 'error');
  }
}

// Show the save session modal
function showSaveSessionModal(domain = currentDomain, tabId = currentTab.id, defaultName = '') {
  // Set default session name if provided
  sessionNameInput.value = defaultName || `Session for ${domain}`;
  
  // Store the domain and tab ID for later use
  saveSessionModal.dataset.domain = domain;
  saveSessionModal.dataset.tabId = tabId;
  
  // Show the modal
  saveSessionModal.classList.remove('hidden');
}

// Hide the save session modal
function hideSaveSessionModal() {
  saveSessionModal.classList.add('hidden');
  sessionNameInput.value = '';
}

// Show the restore confirmation modal
function showRestoreConfirmModal(session) {
  restoreDomain.textContent = session.websiteDomain;
  restoreName.textContent = session.sessionName;
  currentSessionId = session.sessionId;
  restoreConfirmModal.classList.remove('hidden');
}

// Hide the restore confirmation modal
function hideRestoreConfirmModal() {
  restoreConfirmModal.classList.add('hidden');
  currentSessionId = null;
}

// Show the delete confirmation modal
function showDeleteConfirmModal(session) {
  deleteName.textContent = session.sessionName;
  currentSessionToDelete = session;
  deleteConfirmModal.classList.remove('hidden');
}

// Hide the delete confirmation modal
function hideDeleteConfirmModal() {
  deleteConfirmModal.classList.add('hidden');
  currentSessionToDelete = null;
}

// Show the reload prompt modal
function showReloadPromptModal(sessionName) {
  restoredName.textContent = sessionName;
  reloadPromptModal.classList.remove('hidden');
}

// Hide the reload prompt modal
function hideReloadPromptModal() {
  reloadPromptModal.classList.add('hidden');
}

// Show the settings modal
function showSettingsModal() {
  settingsModal.classList.remove('hidden');
}

// Hide the settings modal
function hideSettingsModal() {
  settingsModal.classList.add('hidden');
}

// Save the current session
async function saveCurrentSession() {
  try {
    const domain = saveSessionModal.dataset.domain || currentDomain;
    const tabId = parseInt(saveSessionModal.dataset.tabId || currentTab.id);
    const sessionName = sessionNameInput.value.trim();
    
    if (!sessionName) {
      utils.showToast('Please enter a session name.', 'warning');
      return;
    }
    
    // Hide the modal
    hideSaveSessionModal();
    
    // Show loading state
    utils.showToast('Saving session...', 'info');
    
    // Save the session
    const result = await chrome.runtime.sendMessage({
      action: 'saveSession',
      domain,
      sessionName,
      tabId
    });
    
    if (result.success) {
      utils.showToast('Session saved successfully.', 'success');
      
      // Reload sessions
      await loadSessions();
      
      // Sync if authenticated
      if (await api.isAuthenticated()) {
        await syncSessions();
      }
    } else {
      utils.showToast(`Failed to save session: ${result.error}`, 'error');
    }
  } catch (error) {
    console.error('Failed to save session:', error);
    utils.showToast('Failed to save session. Please try again.', 'error');
  }
}

// Restore a session
async function restoreSession() {
  try {
    if (!currentSessionId) {
      utils.showToast('No session selected for restoration.', 'error');
      return;
    }
    
    // Hide the confirmation modal
    hideRestoreConfirmModal();
    
    // Show loading state
    utils.showToast('Restoring session...', 'info');
    
    // Restore the session
    const result = await chrome.runtime.sendMessage({
      action: 'restoreSession',
      sessionId: currentSessionId,
      tabId: currentTab.id
    });
    
    if (result.success) {
      utils.showToast('Session restored successfully.', 'success');
      
      // Show reload prompt
      showReloadPromptModal(result.session.sessionName);
    } else {
      utils.showToast(`Failed to restore session: ${result.error}`, 'error');
    }
  } catch (error) {
    console.error('Failed to restore session:', error);
    utils.showToast('Failed to restore session. Please try again.', 'error');
  }
}

// Delete a session
async function deleteSession() {
  try {
    if (!currentSessionToDelete) {
      utils.showToast('No session selected for deletion.', 'error');
      return;
    }
    
    const sessionId = currentSessionToDelete.sessionId;
    
    // Hide the confirmation modal
    hideDeleteConfirmModal();
    
    // Show loading state
    utils.showToast('Deleting session...', 'info');
    
    // Delete the session
    const result = await sessionManager.deleteSession(sessionId);
    
    if (result) {
      utils.showToast('Session deleted successfully.', 'success');
      
      // Reload sessions
      await loadSessions();
      
      // Sync if authenticated
      if (await api.isAuthenticated()) {
        await syncSessions();
      }
    } else {
      utils.showToast('Failed to delete session. Please try again.', 'error');
    }
  } catch (error) {
    console.error('Failed to delete session:', error);
    utils.showToast('Failed to delete session. Please try again.', 'error');
  }
}

// Reload the current tab
async function reloadCurrentTab() {
  try {
    await chrome.tabs.reload(currentTab.id);
    hideReloadPromptModal();
  } catch (error) {
    console.error('Failed to reload tab:', error);
    utils.showToast('Failed to reload tab. Please reload manually.', 'error');
  }
}

// Event Listeners

// Authentication
signInBtn.addEventListener('click', () => {
  loggedOutView.classList.add('hidden');
  signInForm.classList.remove('hidden');
});

signUpBtn.addEventListener('click', () => {
  loggedOutView.classList.add('hidden');
  signUpForm.classList.remove('hidden');
});

logoutBtn.addEventListener('click', async () => {
  try {
    await api.logout();
    updateAuthUI(false);
    utils.showToast('Logged out successfully.', 'success');
  } catch (error) {
    console.error('Failed to logout:', error);
    utils.showToast('Failed to logout. Please try again.', 'error');
  }
});

resetPasswordBtn.addEventListener('click', () => {
  loggedInView.classList.add('hidden');
  forgotPasswordForm.classList.remove('hidden');
});

deleteAccountBtn.addEventListener('click', () => {
  loggedInView.classList.add('hidden');
  deleteAccountConfirm.classList.remove('hidden');
});

// Forms
signInForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('signin-email').value.trim();
  const password = document.getElementById('signin-password').value;
  
  if (!utils.isValidEmail(email)) {
    utils.showToast('Please enter a valid email address.', 'warning');
    return;
  }
  
  if (!utils.isValidPassword(password)) {
    utils.showToast('Password must be at least 8 characters long.', 'warning');
    return;
  }
  
  try {
    utils.showToast('Signing in...', 'info');
    
    const result = await api.login(email, password);
    
    if (result.token) {
      signInForm.classList.add('hidden');
      updateAuthUI(true);
      userEmail.textContent = email;
      
      utils.showToast('Signed in successfully.', 'success');
      
      // Sync sessions
      await syncSessions();
    } else {
      utils.showToast('Failed to sign in. Please check your credentials.', 'error');
    }
  } catch (error) {
    console.error('Failed to sign in:', error);
    utils.showToast('Failed to sign in. Please try again.', 'error');
  }
});

signUpForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('signup-confirm-password').value;
  
  if (!utils.isValidEmail(email)) {
    utils.showToast('Please enter a valid email address.', 'warning');
    return;
  }
  
  if (!utils.isValidPassword(password)) {
    utils.showToast('Password must be at least 8 characters long.', 'warning');
    return;
  }
  
  if (password !== confirmPassword) {
    utils.showToast('Passwords do not match.', 'warning');
    return;
  }
  
  try {
    utils.showToast('Creating account...', 'info');
    
    const result = await api.register(email, password);
    
    if (result.success) {
      // Auto-login after registration
      const loginResult = await api.login(email, password);
      
      if (loginResult.token) {
        signUpForm.classList.add('hidden');
        updateAuthUI(true);
        userEmail.textContent = email;
        
        utils.showToast('Account created and signed in successfully.', 'success');
        
        // Sync sessions
        await syncSessions();
      } else {
        utils.showToast('Account created but failed to sign in automatically. Please sign in manually.', 'warning');
        signUpForm.classList.add('hidden');
        loggedOutView.classList.remove('hidden');
      }
    } else {
      utils.showToast('Failed to create account. Email may already be in use.', 'error');
    }
  } catch (error) {
    console.error('Failed to create account:', error);
    utils.showToast('Failed to create account. Please try again.', 'error');
  }
});

forgotPasswordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('reset-email').value.trim();
  
  if (!utils.isValidEmail(email)) {
    utils.showToast('Please enter a valid email address.', 'warning');
    return;
  }
  
  try {
    utils.showToast('Sending password reset email...', 'info');
    
    const result = await api.requestPasswordReset(email);
    
    if (result.success) {
      forgotPasswordForm.classList.add('hidden');
      loggedOutView.classList.remove('hidden');
      
      utils.showToast('Password reset email sent. Please check your inbox.', 'success');
    } else {
      utils.showToast('Failed to send password reset email. Please try again.', 'error');
    }
  } catch (error) {
    console.error('Failed to request password reset:', error);
    utils.showToast('Failed to send password reset email. Please try again.', 'error');
  }
});

document.getElementById('confirm-delete-account').addEventListener('click', async () => {
  try {
    utils.showToast('Deleting account...', 'info');
    
    const result = await api.deleteAccount();
    
    if (result.success) {
      deleteAccountConfirm.classList.add('hidden');
      updateAuthUI(false);
      
      utils.showToast('Account deleted successfully.', 'success');
      
      // Reload sessions (to show only local ones)
      await loadSessions();
    } else {
      utils.showToast('Failed to delete account. Please try again.', 'error');
    }
  } catch (error) {
    console.error('Failed to delete account:', error);
    utils.showToast('Failed to delete account. Please try again.', 'error');
  }
});

// Cancel buttons
document.getElementById('cancel-signin').addEventListener('click', () => {
  signInForm.classList.add('hidden');
  loggedOutView.classList.remove('hidden');
});

document.getElementById('cancel-signup').addEventListener('click', () => {
  signUpForm.classList.add('hidden');
  loggedOutView.classList.remove('hidden');
});

document.getElementById('cancel-reset').addEventListener('click', () => {
  forgotPasswordForm.classList.add('hidden');
  
  // Show the appropriate view based on authentication state
  if (api.isAuthenticated()) {
    loggedInView.classList.remove('hidden');
  } else {
    loggedOutView.classList.remove('hidden');
  }
});

document.getElementById('cancel-delete-account').addEventListener('click', () => {
  deleteAccountConfirm.classList.add('hidden');
  loggedInView.classList.remove('hidden');
});

// Forgot password link
document.getElementById('forgot-password-link').addEventListener('click', (e) => {
  e.preventDefault();
  signInForm.classList.add('hidden');
  forgotPasswordForm.classList.remove('hidden');
});

// Session management
saveSessionBtn.addEventListener('click', () => {
  if (currentDomain) {
    showSaveSessionModal();
  } else {
    utils.showToast('Cannot save session for this page.', 'warning');
  }
});

saveSessionForm.addEventListener('submit', (e) => {
  e.preventDefault();
  saveCurrentSession();
});

cancelSaveBtn.addEventListener('click', () => {
  hideSaveSessionModal();
});

confirmRestoreBtn.addEventListener('click', () => {
  restoreSession();
});

cancelRestoreBtn.addEventListener('click', () => {
  hideRestoreConfirmModal();
});

confirmDeleteBtn.addEventListener('click', () => {
  deleteSession();
});

cancelDeleteBtn.addEventListener('click', () => {
  hideDeleteConfirmModal();
});

reloadNowBtn.addEventListener('click', () => {
  reloadCurrentTab();
});

reloadLaterBtn.addEventListener('click', () => {
  hideReloadPromptModal();
});

// Settings
settingsBtn.addEventListener('click', () => {
  showSettingsModal();
});

saveSettingsBtn.addEventListener('click', () => {
  saveSettings();
});

cancelSettingsBtn.addEventListener('click', () => {
  hideSettingsModal();
});
