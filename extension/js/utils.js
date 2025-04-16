/**
 * Utility functions for the Quick Switch Login extension
 */

const utils = {
  /**
   * Shows a toast notification
   * @param {string} message - The message to display
   * @param {string} type - The type of toast (success, error, warning, info)
   * @param {number} duration - Duration in milliseconds
   */
  showToast: (message, type = 'info', duration = 3000) => {
    const toast = document.getElementById('toast');
    if (!toast) return;

    // Clear any existing toast
    clearTimeout(toast.timeoutId);
    
    // Set toast content and type
    toast.textContent = message;
    toast.className = 'toast show';
    toast.classList.add(type);
    
    // Show the toast
    toast.style.display = 'block';
    
    // Hide the toast after duration
    toast.timeoutId = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.style.display = 'none';
        toast.className = 'toast hidden';
      }, 300);
    }, duration);
  },

  /**
   * Gets the current active tab
   * @returns {Promise<chrome.tabs.Tab>} The active tab
   */
  getCurrentTab: async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
  },

  /**
   * Extracts the domain from a URL
   * @param {string} url - The URL to extract domain from
   * @returns {string} The domain
   */
  getDomainFromUrl: (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      console.error('Invalid URL:', url);
      return '';
    }
  },

  /**
   * Generates a unique ID
   * @returns {string} A unique ID
   */
  generateId: () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  },

  /**
   * Checks if a URL is valid for session management
   * @param {string} url - The URL to check
   * @returns {boolean} Whether the URL is valid
   */
  isValidUrl: (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (error) {
      return false;
    }
  },

  /**
   * Checks if the extension is enabled for a specific domain
   * @param {string} domain - The domain to check
   * @returns {Promise<boolean>} Whether the extension is enabled
   */
  isExtensionEnabledForDomain: async (domain) => {
    const settings = await chrome.storage.local.get(['restrictionMode', 'domainList']);
    
    if (!settings.restrictionMode || !settings.domainList) {
      return true; // Default to enabled if settings not found
    }

    const domainList = settings.domainList.split('\n')
      .map(d => d.trim())
      .filter(d => d.length > 0);
    
    const isDomainInList = domainList.some(d => {
      // Support for wildcard domains (e.g., *.example.com)
      if (d.startsWith('*.')) {
        const baseDomain = d.substring(2);
        return domain.endsWith(baseDomain);
      }
      return d === domain;
    });

    // In blacklist mode, return true if domain is NOT in the list
    // In whitelist mode, return true if domain IS in the list
    return settings.restrictionMode === 'blacklist' ? !isDomainInList : isDomainInList;
  },

  /**
   * Gets the favicon URL for a domain
   * @param {string} domain - The domain to get favicon for
   * @returns {string} The favicon URL
   */
  getFaviconUrl: (domain) => {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  },

  /**
   * Validates an email address
   * @param {string} email - The email to validate
   * @returns {boolean} Whether the email is valid
   */
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validates a password (minimum 8 characters)
   * @param {string} password - The password to validate
   * @returns {boolean} Whether the password is valid
   */
  isValidPassword: (password) => {
    return password && password.length >= 8;
  },

  /**
   * Escapes HTML to prevent XSS
   * @param {string} str - The string to escape
   * @returns {string} The escaped string
   */
  escapeHtml: (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

// Make utils available globally
window.utils = utils;
