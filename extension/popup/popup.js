document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const authStatus = document.getElementById('auth-status');
  const loggedOutView = document.getElementById('logged-out-view');
  const loggedInView = document.getElementById('logged-in-view');
  const userEmail = document.getElementById('user-email');
  const signInBtn = document.getElementById('sign-in-btn');
  const signUpBtn = document.getElementById('sign-up-btn');
  const signOutBtn = document.getElementById('sign-out-btn');
  const authForms = document.getElementById('auth-forms');
  const signInForm = document.getElementById('sign-in-form');
  const signUpForm = document.getElementById('sign-up-form');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const cancelLogin = document.getElementById('cancel-login');
  const cancelRegister = document.getElementById('cancel-register');
  const mainContent = document.getElementById('main-content');
  const currentSiteInfo = document.getElementById('current-site-info');
  const siteInfoContent = document.getElementById('site-info-content');
  const siteFavicon = document.getElementById('site-favicon');
  const siteDomain = document.getElementById('site-domain');
  const saveSessionBtn = document.getElementById('save-session-btn');
  const saveSessionModal = document.getElementById('save-session-modal');
  const saveSessionForm = document.getElementById('save-session-form');
  const sessionName = document.getElementById('session-name');
  const cancelSave = document.getElementById('cancel-save');
  const restoreConfirmModal = document.getElementById('restore-confirm-modal');
  const restoreConfirmMessage = document.getElementById('restore-confirm-message');
  const confirmRestore = document.getElementById('confirm-restore');
  const cancelRestore = document.getElementById('cancel-restore');
  const sessionsList = document.getElementById('sessions-list');
  const searchInput = document.getElementById('search-input');
  const toast = document.getElementById('toast');

  // State
  let currentUser = null;
  let currentTab = null;
  let currentDomain = '';
  let currentOrigin = '';
  let sessions = [];
  let sessionToRestore = null;

  // Initialize
  init();

  async function init() {
    // Check authentication status
    currentUser = await StorageManager.getAuthUser();
    updateAuthUI();

    // Get current tab information
    currentTab = await getCurrentTab();
    if (currentTab && currentTab.url) {
      const url = new URL(currentTab.url);
      currentDomain = url.hostname;
      currentOrigin = url.origin;
      updateCurrentSiteUI();
    } else {
      // Hide current site info if no valid tab
      currentSiteInfo.classList.add('hidden');
    }

    // Load saved sessions
    await loadSessions();
  }

  // Authentication UI functions
  function updateAuthUI() {
    if (currentUser) {
      loggedOutView.classList.add('hidden');
      loggedInView.classList.remove('hidden');
      userEmail.textContent = currentUser.email;
    } else {
      loggedOutView.classList.remove('hidden');
      loggedInView.classList.add('hidden');
      userEmail.textContent = '';
    }
  }

  // Current site UI functions
  function updateCurrentSiteUI() {
    siteDomain.textContent = currentDomain;
    siteFavicon.style.backgroundImage = `url(${getFaviconUrl(currentDomain)})`;
  }

  // Session management functions
  async function loadSessions() {
    try {
      // Get sessions from storage
      sessions = await StorageManager.getSessions();
      
      // Filter by search term if any
      const searchTerm = searchInput.value.toLowerCase().trim();
      if (searchTerm) {
        sessions = sessions.filter(session => 
          session.domain.toLowerCase().includes(searchTerm) || 
          session.sessionName.toLowerCase().includes(searchTerm)
        );
      }
      
      // Group sessions by domain
      const sessionsByDomain = groupSessionsByDomain(sessions);
      
      // Render sessions list
      renderSessionsList(sessionsByDomain);
    } catch (error) {
      showToast(`Error loading sessions: ${error.message}`, 'error');
    }
  }

  function groupSessionsByDomain(sessions) {
    return sessions.reduce((groups, session) => {
      if (!groups[session.domain]) {
        groups[session.domain] = [];
      }
      groups[session.domain].push(session);
      return groups;
    }, {});
  }

  function renderSessionsList(sessionsByDomain) {
    sessionsList.innerHTML = '';
    
    if (Object.keys(sessionsByDomain).length === 0) {
      sessionsList.innerHTML = '<p class="no-sessions">No saved sessions found.</p>';
      return;
    }
    
    for (const domain in sessionsByDomain) {
      const domainSessions = sessionsByDomain[domain];
      
      const sessionGroup = document.createElement('div');
      sessionGroup.className = 'session-group';
      
      const groupHeader = document.createElement('div');
      groupHeader.className = 'session-group-header';
      
      const domainFavicon = document.createElement('div');
      domainFavicon.className = 'domain-favicon';
      domainFavicon.style.backgroundImage = `url(${getFaviconUrl(domain)})`;
      
      const domainName = document.createElement('div');
      domainName.className = 'domain-name';
      domainName.textContent = domain;
      
      groupHeader.appendChild(domainFavicon);
      groupHeader.appendChild(domainName);
      sessionGroup.appendChild(groupHeader);
      
      domainSessions.forEach(session => {
        const sessionItem = document.createElement('div');
        sessionItem.className = 'session-item';
        sessionItem.dataset.sessionId = session.sessionId;
        
        const sessionNameElem = document.createElement('div');
        sessionNameElem.className = 'session-name';
        sessionNameElem.textContent = session.sessionName;
        
        const sessionActions = document.createElement('div');
        sessionActions.className = 'session-actions';
        
        const restoreBtn = document.createElement('button');
        restoreBtn.className = 'btn btn-primary';
        restoreBtn.textContent = 'Restore';
        restoreBtn.addEventListener('click', () => handleRestoreSession(session));
        
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-secondary';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => handleEditSession(session));
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-text';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => handleDeleteSession(session));
        
        sessionActions.appendChild(restoreBtn);
        sessionActions.appendChild(editBtn);
        sessionActions.appendChild(deleteBtn);
        
        sessionItem.appendChild(sessionNameElem);
        sessionItem.appendChild(sessionActions);
        
        sessionGroup.appendChild(sessionItem);
      });
      
      sessionsList.appendChild(sessionGroup);
    }
  }

  async function handleSaveSession(e) {
    e.preventDefault();
    
    try {
      const name = sessionName.value.trim();
      if (!name) {
        showToast('Please enter a session name', 'error');
        return;
      }
      
      // Get session data from the current tab
      const sessionData = await getSessionData();
      
      // Create session object
      const session = {
        sessionId: generateUniqueId(),
        sessionName: name,
        domain: currentDomain,
        origin: currentOrigin,
        faviconUrl: getFaviconUrl(currentDomain),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        cookieData: sessionData.cookies,
        localStorageData: sessionData.localStorage,
        sessionStorageData: sessionData.sessionStorage
      };
      
      // Save session to storage
      await StorageManager.saveSession(session);
      
      // Sync with backend if user is logged in
      if (currentUser) {
        try {
          await ApiClient.syncSession(session);
        } catch (error) {
          console.error('Error syncing session with backend:', error);
          // Continue anyway, as the session is saved locally
        }
      }
      
      // Close modal and reload sessions
      saveSessionModal.classList.add('hidden');
      saveSessionForm.reset();
      await loadSessions();
      
      showToast('Session saved successfully', 'success');
    } catch (error) {
      showToast(`Error saving session: ${error.message}`, 'error');
    }
  }

  async function handleRestoreSession(session) {
    try {
      // Check if we're on the same domain
      if (currentDomain === session.domain) {
        // We're on the same domain, show confirmation dialog
        sessionToRestore = session;
        restoreConfirmMessage.textContent = `Restoring '${session.sessionName}' will replace your current session on ${session.domain}. Do you want to proceed? Your current session will be automatically saved as '${session.domain} - Pre-Restore ${new Date().toLocaleTimeString()}'.`;
        restoreConfirmModal.classList.remove('hidden');
      } else {
        // We're on a different domain, navigate to the target domain first
        await navigateToWebsite(session.origin);
        // The page will reload, so we need to store the session to restore
        await StorageManager.setSessionToRestore(session);
      }
    } catch (error) {
      showToast(`Error preparing to restore session: ${error.message}`, 'error');
    }
  }

  async function confirmRestoreSession() {
    try {
      if (!sessionToRestore) {
        showToast('No session to restore', 'error');
        return;
      }
      
      // First, save the current session automatically
      const currentSessionData = await getSessionData();
      const autoSavedSession = {
        sessionId: generateUniqueId(),
        sessionName: `${currentDomain} - Pre-Restore ${new Date().toLocaleTimeString()}`,
        domain: currentDomain,
        origin: currentOrigin,
        faviconUrl: getFaviconUrl(currentDomain),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        cookieData: currentSessionData.cookies,
        localStorageData: currentSessionData.localStorage,
        sessionStorageData: currentSessionData.sessionStorage
      };
      
      await StorageManager.saveSession(autoSavedSession);
      
      // Now restore the selected session
      await restoreSessionData(sessionToRestore);
      
      // Close modal
      restoreConfirmModal.classList.add('hidden');
      sessionToRestore = null;
      
      // Reload the page to apply changes
      await reloadCurrentTab();
      
      showToast('Session restored successfully', 'success');
    } catch (error) {
      showToast(`Error restoring session: ${error.message}`, 'error');
    }
  }

  async function handleEditSession(session) {
    try {
      const newName = prompt('Enter new session name:', session.sessionName);
      if (newName && newName.trim() !== '') {
        // Update session name
        session.sessionName = newName.trim();
        session.updatedAt = new Date().toISOString();
        
        // Save to storage
        await StorageManager.updateSession(session);
        
        // Sync with backend if user is logged in
        if (currentUser) {
          try {
            await ApiClient.syncSession(session);
          } catch (error) {
            console.error('Error syncing session update with backend:', error);
          }
        }
        
        // Reload sessions
        await loadSessions();
        
        showToast('Session renamed successfully', 'success');
      }
    } catch (error) {
      showToast(`Error renaming session: ${error.message}`, 'error');
    }
  }

  async function handleDeleteSession(session) {
    try {
      if (confirm(`Are you sure you want to delete the session '${session.sessionName}'?`)) {
        // Delete from storage
        await StorageManager.deleteSession(session.sessionId);
        
        // Sync with backend if user is logged in
        if (currentUser) {
          try {
            await ApiClient.deleteSession(session.sessionId);
          } catch (error) {
            console.error('Error syncing session deletion with backend:', error);
          }
        }
        
        // Reload sessions
        await loadSessions();
        
        showToast('Session deleted successfully', 'success');
      }
    } catch (error) {
      showToast(`Error deleting session: ${error.message}`, 'error');
    }
  }

  // Authentication functions
  async function handleSignIn(e) {
    e.preventDefault();
    
    try {
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      
      // Validate inputs
      if (!email || !password) {
        showToast('Please enter both email and password', 'error');
        return;
      }
      
      // Sign in with API
      const user = await ApiClient.signIn(email, password);
      
      // Save user to storage
      await StorageManager.setAuthUser(user);
      currentUser = user;
      
      // Update UI
      updateAuthUI();
      authForms.classList.add('hidden');
      loginForm.reset();
      
      // Sync sessions from backend
      await syncSessionsFromBackend();
      
      showToast('Signed in successfully', 'success');
    } catch (error) {
      showToast(`Sign in failed: ${error.message}`, 'error');
    }
  }

  async function handleSignUp(e) {
    e.preventDefault();
    
    try {
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;
      const confirmPassword = document.getElementById('register-confirm-password').value;
      
      // Validate inputs
      if (!email || !password || !confirmPassword) {
        showToast('Please fill in all fields', 'error');
        return;
      }
      
      if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }
      
      // Sign up with API
      const user = await ApiClient.signUp(email, password);
      
      // Save user to storage
      await StorageManager.setAuthUser(user);
      currentUser = user;
      
      // Update UI
      updateAuthUI();
      authForms.classList.add('hidden');
      registerForm.reset();
      
      showToast('Account created successfully', 'success');
    } catch (error) {
      showToast(`Sign up failed: ${error.message}`, 'error');
    }
  }

  async function handleSignOut() {
    try {
      // Sign out with API
      await ApiClient.signOut();
      
      // Clear user from storage
      await StorageManager.clearAuthUser();
      currentUser = null;
      
      // Update UI
      updateAuthUI();
      
      showToast('Signed out successfully', 'success');
    } catch (error) {
      showToast(`Sign out failed: ${error.message}`, 'error');
    }
  }

  // Helper functions
  async function getCurrentTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0]);
      });
    });
  }

  async function getSessionData() {
    return new Promise((resolve, reject) => {
      try {
        // Get cookies for the current domain
        chrome.cookies.getAll({ domain: currentDomain }, async (cookies) => {
          try {
            // Get localStorage and sessionStorage via content script
            const storageData = await chrome.tabs.sendMessage(currentTab.id, { action: 'getStorageData' });
            
            resolve({
              cookies,
              localStorage: storageData.localStorage,
              sessionStorage: storageData.sessionStorage
            });
          } catch (error) {
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async function restoreSessionData(session) {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. Delete existing cookies
        const existingCookies = await new Promise((resolve) => {
          chrome.cookies.getAll({ domain: session.domain }, (cookies) => {
            resolve(cookies);
          });
        });
        
        for (const cookie of existingCookies) {
          await new Promise((resolve) => {
            chrome.cookies.remove({
              url: `${cookie.secure ? 'https' : 'http'}://${cookie.domain}${cookie.path}`,
              name: cookie.name
            }, () => resolve());
          });
        }
        
        // 2. Set cookies from saved session
        for (const cookie of session.cookieData) {
          await new Promise((resolve) => {
            // Create a cookie object compatible with chrome.cookies.set
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
            
            chrome.cookies.set(cookieToSet, () => resolve());
          });
        }
        
        // 3. Restore localStorage and sessionStorage via content script
        await chrome.tabs.sendMessage(currentTab.id, {
          action: 'setStorageData',
          data: {
            localStorage: session.localStorageData,
            sessionStorage: session.sessionStorageData
          }
        });
        
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  async function navigateToWebsite(url) {
    return new Promise((resolve) => {
      chrome.tabs.update(currentTab.id, { url }, () => {
        resolve();
      });
    });
  }

  async function reloadCurrentTab() {
    return new Promise((resolve) => {
      chrome.tabs.reload(currentTab.id, () => {
        resolve();
      });
    });
  }

  function getFaviconUrl(domain) {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  }

  function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async function syncSessionsFromBackend() {
    try {
      // Get sessions from backend
      const remoteSessions = await ApiClient.getSessions();
      
      // Get local sessions
      const localSessions = await StorageManager.getSessions();
      
      // Merge sessions using last-write-wins strategy
      const mergedSessions = mergeSessionsLastWriteWins(localSessions, remoteSessions);
      
      // Save merged sessions to storage
      await StorageManager.setSessions(mergedSessions);
      
      // Reload sessions in UI
      await loadSessions();
    } catch (error) {
      console.error('Error syncing sessions from backend:', error);
      showToast('Failed to sync sessions from server', 'error');
    }
  }

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

  function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = `toast-${type}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  }

  // Event listeners
  signInBtn.addEventListener('click', () => {
    authForms.classList.remove('hidden');
    signInForm.classList.remove('hidden');
    signUpForm.classList.add('hidden');
    mainContent.classList.add('hidden');
  });

  signUpBtn.addEventListener('click', () => {
    authForms.classList.remove('hidden');
    signInForm.classList.add('hidden');
    signUpForm.classList.remove('hidden');
    mainContent.classList.add('hidden');
  });

  signOutBtn.addEventListener('click', handleSignOut);

  cancelLogin.addEventListener('click', () => {
    authForms.classList.add('hidden');
    mainContent.classList.remove('hidden');
    loginForm.reset();
  });

  cancelRegister.addEventListener('click', () => {
    authForms.classList.add('hidden');
    mainContent.classList.remove('hidden');
    registerForm.reset();
  });

  saveSessionBtn.addEventListener('click', () => {
    saveSessionModal.classList.remove('hidden');
    // Set default session name
    sessionName.value = `${currentDomain} - ${new Date().toLocaleTimeString()}`;
  });

  cancelSave.addEventListener('click', () => {
    saveSessionModal.classList.add('hidden');
    saveSessionForm.reset();
  });

  confirmRestore.addEventListener('click', confirmRestoreSession);

  cancelRestore.addEventListener('click', () => {
    restoreConfirmModal.classList.add('hidden');
    sessionToRestore = null;
  });

  searchInput.addEventListener('input', () => {
    loadSessions();
  });

  loginForm.addEventListener('submit', handleSignIn);
  registerForm.addEventListener('submit', handleSignUp);
  saveSessionForm.addEventListener('submit', handleSaveSession);

  // Check if there's a pending session to restore (from a different domain)
  chrome.runtime.onMessage.addListener(async (message) => {
    if (message.action === 'checkPendingRestore') {
      const pendingSession = await StorageManager.getSessionToRestore();
      if (pendingSession && pendingSession.domain === currentDomain) {
        // We've navigated to the correct domain, now restore the session
        sessionToRestore = pendingSession;
        restoreConfirmMessage.textContent = `Restoring '${pendingSession.sessionName}' will replace your current session on ${pendingSession.domain}. Do you want to proceed? Your current session will be automatically saved as '${pendingSession.domain} - Pre-Restore ${new Date().toLocaleTimeString()}'.`;
        restoreConfirmModal.classList.remove('hidden');
        
        // Clear the pending session
        await StorageManager.clearSessionToRestore();
      }
    }
  });
});
