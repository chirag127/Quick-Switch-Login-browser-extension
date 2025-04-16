// API base URL - change this to your deployed backend URL in production
const API_BASE_URL = 'http://localhost:3000/api';

// Get auth token from storage
const getToken = async () => {
  const data = await chrome.storage.local.get('authToken');
  return data.authToken;
};

// Generic API request function with authentication
const apiRequest = async (endpoint, method = 'GET', data = null) => {
  const token = await getToken();
  
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    method,
    headers
  };
  
  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    config.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.message || 'API request failed');
    }
    
    return responseData;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Auth API functions
const auth = {
  // Register a new user
  signup: async (email, password) => {
    const response = await apiRequest('/auth/signup', 'POST', { email, password });
    
    // Save token to storage
    if (response.token) {
      await chrome.storage.local.set({ authToken: response.token, user: response.user });
    }
    
    return response;
  },
  
  // Login user
  login: async (email, password) => {
    const response = await apiRequest('/auth/login', 'POST', { email, password });
    
    // Save token to storage
    if (response.token) {
      await chrome.storage.local.set({ authToken: response.token, user: response.user });
    }
    
    return response;
  },
  
  // Logout user
  logout: async () => {
    await chrome.storage.local.remove(['authToken', 'user']);
    return { message: 'Logged out successfully' };
  },
  
  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await apiRequest('/auth/me');
      return response.user;
    } catch (error) {
      // If token is invalid, clear it
      if (error.message.includes('Token is not valid')) {
        await chrome.storage.local.remove(['authToken', 'user']);
      }
      throw error;
    }
  },
  
  // Check if user is logged in
  isLoggedIn: async () => {
    const token = await getToken();
    return !!token;
  }
};

// Session API functions
const sessions = {
  // Save a session
  saveSession: async (sessionData) => {
    return await apiRequest('/sessions/save', 'POST', sessionData);
  },
  
  // Get all sessions
  getAllSessions: async () => {
    return await apiRequest('/sessions');
  },
  
  // Get sessions for a specific domain
  getSessionsByDomain: async (domain) => {
    return await apiRequest(`/sessions/domain/${domain}`);
  },
  
  // Get a specific session by ID
  getSessionById: async (id) => {
    return await apiRequest(`/sessions/${id}`);
  },
  
  // Delete a session
  deleteSession: async (id) => {
    return await apiRequest(`/sessions/${id}`, 'DELETE');
  }
};

export { auth, sessions };
