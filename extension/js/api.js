/**
 * API communication module for the Quick Switch Login extension
 */

const api = (() => {
  // Default API base URL - should be updated from environment or settings
  const API_BASE_URL = 'http://localhost:3000/api';
  
  // Queue for operations that need to be synced when online
  let syncQueue = [];
  
  /**
   * Initialize the API module
   */
  const init = async () => {
    // Load any pending sync operations from storage
    const data = await chrome.storage.local.get(['syncQueue']);
    if (data.syncQueue) {
      syncQueue = data.syncQueue;
    }
    
    // Process any pending operations if we're online
    if (navigator.onLine) {
      processSyncQueue();
    }
    
    // Listen for online events to process the queue
    window.addEventListener('online', processSyncQueue);
  };
  
  /**
   * Process the sync queue
   */
  const processSyncQueue = async () => {
    if (syncQueue.length === 0) return;
    
    const token = await getAuthToken();
    if (!token) return; // Can't sync without authentication
    
    // Process each operation in the queue
    const newQueue = [];
    for (const operation of syncQueue) {
      try {
        switch (operation.type) {
          case 'save':
            await saveSession(operation.session, true);
            break;
          case 'delete':
            await deleteSession(operation.sessionId, true);
            break;
          default:
            // Unknown operation type, keep it in the queue
            newQueue.push(operation);
        }
      } catch (error) {
        console.error('Failed to process sync operation:', error);
        // Keep failed operations in the queue
        newQueue.push(operation);
      }
    }
    
    // Update the queue
    syncQueue = newQueue;
    await chrome.storage.local.set({ syncQueue });
  };
  
  /**
   * Add an operation to the sync queue
   * @param {Object} operation - The operation to add
   */
  const addToSyncQueue = async (operation) => {
    syncQueue.push(operation);
    await chrome.storage.local.set({ syncQueue });
  };
  
  /**
   * Get the authentication token from storage
   * @returns {Promise<string|null>} The authentication token or null
   */
  const getAuthToken = async () => {
    const data = await chrome.storage.local.get(['authToken']);
    return data.authToken || null;
  };
  
  /**
   * Set the authentication token in storage
   * @param {string} token - The token to store
   */
  const setAuthToken = async (token) => {
    await chrome.storage.local.set({ authToken: token });
  };
  
  /**
   * Clear the authentication token from storage
   */
  const clearAuthToken = async () => {
    await chrome.storage.local.remove('authToken');
  };
  
  /**
   * Make an API request
   * @param {string} endpoint - The API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} The response data
   */
  const apiRequest = async (endpoint, options = {}) => {
    const token = await getAuthToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  };
  
  /**
   * Register a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} The response data
   */
  const register = async (email, password) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  };
  
  /**
   * Login a user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} The response data with token
   */
  const login = async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (data.token) {
      await setAuthToken(data.token);
    }
    
    return data;
  };
  
  /**
   * Logout the current user
   */
  const logout = async () => {
    await clearAuthToken();
  };
  
  /**
   * Request a password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} The response data
   */
  const requestPasswordReset = async (email) => {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  };
  
  /**
   * Reset a password with token
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Promise<Object>} The response data
   */
  const resetPassword = async (token, password) => {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password })
    });
  };
  
  /**
   * Delete the current user account
   * @returns {Promise<Object>} The response data
   */
  const deleteAccount = async () => {
    const result = await apiRequest('/auth/delete-account', {
      method: 'DELETE'
    });
    
    await clearAuthToken();
    return result;
  };
  
  /**
   * Save a session to the server
   * @param {Object} session - The session to save
   * @param {boolean} forceSync - Force sync even if already in queue
   * @returns {Promise<Object>} The response data
   */
  const saveSession = async (session, forceSync = false) => {
    const token = await getAuthToken();
    
    // If not authenticated or offline, add to sync queue
    if (!token || (!navigator.onLine && !forceSync)) {
      await addToSyncQueue({
        type: 'save',
        session
      });
      return { success: true, synced: false, session };
    }
    
    return apiRequest('/sessions', {
      method: 'POST',
      body: JSON.stringify(session)
    });
  };
  
  /**
   * Get all sessions for the current user
   * @returns {Promise<Array>} The sessions
   */
  const getSessions = async () => {
    return apiRequest('/sessions');
  };
  
  /**
   * Delete a session from the server
   * @param {string} sessionId - The ID of the session to delete
   * @param {boolean} forceSync - Force sync even if already in queue
   * @returns {Promise<Object>} The response data
   */
  const deleteSession = async (sessionId, forceSync = false) => {
    const token = await getAuthToken();
    
    // If not authenticated or offline, add to sync queue
    if (!token || (!navigator.onLine && !forceSync)) {
      await addToSyncQueue({
        type: 'delete',
        sessionId
      });
      return { success: true, synced: false };
    }
    
    return apiRequest(`/sessions/${sessionId}`, {
      method: 'DELETE'
    });
  };
  
  /**
   * Check if the user is authenticated
   * @returns {Promise<boolean>} Whether the user is authenticated
   */
  const isAuthenticated = async () => {
    const token = await getAuthToken();
    return !!token;
  };
  
  /**
   * Get the current user's information
   * @returns {Promise<Object>} The user data
   */
  const getCurrentUser = async () => {
    return apiRequest('/auth/me');
  };
  
  // Initialize the module
  init();
  
  // Public API
  return {
    register,
    login,
    logout,
    requestPasswordReset,
    resetPassword,
    deleteAccount,
    saveSession,
    getSessions,
    deleteSession,
    isAuthenticated,
    getCurrentUser,
    processSyncQueue
  };
})();

// Make api available globally
window.api = api;
