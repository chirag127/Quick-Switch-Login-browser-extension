/**
 * API Client for the Quick Switch Login extension
 * Handles all interactions with the backend API
 */
const ApiClient = {
  // API base URL - will be replaced with actual backend URL in production
  baseUrl: 'http://localhost:3000/api',
  
  /**
   * Get the authentication token
   * @returns {Promise<string|null>} Auth token or null
   */
  getAuthToken: async function() {
    const user = await StorageManager.getAuthUser();
    return user ? user.token : null;
  },
  
  /**
   * Make an API request
   * @param {string} endpoint API endpoint
   * @param {Object} options Fetch options
   * @returns {Promise<Object>} Response data
   */
  request: async function(endpoint, options = {}) {
    const token = await this.getAuthToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  },
  
  /**
   * Sign up a new user
   * @param {string} email User email
   * @param {string} password User password
   * @returns {Promise<Object>} User data with token
   */
  signUp: async function(email, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },
  
  /**
   * Sign in an existing user
   * @param {string} email User email
   * @param {string} password User password
   * @returns {Promise<Object>} User data with token
   */
  signIn: async function(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },
  
  /**
   * Sign out the current user
   * @returns {Promise<void>}
   */
  signOut: async function() {
    // No need to call the backend for sign out in this implementation
    // Just clear the local auth data
    return Promise.resolve();
  },
  
  /**
   * Get all sessions for the current user
   * @returns {Promise<Array>} Array of session objects
   */
  getSessions: async function() {
    return this.request('/sessions');
  },
  
  /**
   * Sync a session with the backend
   * @param {Object} session Session object to sync
   * @returns {Promise<Object>} Updated session
   */
  syncSession: async function(session) {
    return this.request(`/sessions/${session.sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(session)
    });
  },
  
  /**
   * Delete a session from the backend
   * @param {string} sessionId ID of the session to delete
   * @returns {Promise<void>}
   */
  deleteSession: async function(sessionId) {
    return this.request(`/sessions/${sessionId}`, {
      method: 'DELETE'
    });
  },
  
  /**
   * Sync offline changes with the backend
   * @param {Object} changes Object with created, updated, and deleted changes
   * @returns {Promise<Object>} Sync result
   */
  syncOfflineChanges: async function(changes) {
    return this.request('/sessions/sync', {
      method: 'POST',
      body: JSON.stringify(changes)
    });
  }
};
