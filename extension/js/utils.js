// Show a notification in the popup
const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  const container = document.getElementById('notification-container');
  if (container) {
    container.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }
};

// Format date for display
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

// Group sessions by domain
const groupSessionsByDomain = (sessions) => {
  const grouped = {};
  
  sessions.forEach(session => {
    if (!grouped[session.domain]) {
      grouped[session.domain] = [];
    }
    
    grouped[session.domain].push(session);
  });
  
  return grouped;
};

// Check if a URL is valid for session management
const isValidUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (error) {
    return false;
  }
};

// Create a confirmation dialog
const confirmAction = (message) => {
  return new Promise((resolve) => {
    const confirmed = window.confirm(message);
    resolve(confirmed);
  });
};

// Prompt user for input
const promptUser = (message, defaultValue = '') => {
  return new Promise((resolve) => {
    const input = window.prompt(message, defaultValue);
    resolve(input);
  });
};

export {
  showNotification,
  formatDate,
  groupSessionsByDomain,
  isValidUrl,
  confirmAction,
  promptUser
};
