// Create notification container if it doesn't exist
const createNotificationContainer = () => {
    let container = document.getElementById(
        "quick-switch-login-notification-container"
    );

    if (!container) {
        container = document.createElement("div");
        container.id = "quick-switch-login-notification-container";
        container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      width: 300px;
    `;
        document.body.appendChild(container);
    }

    return container;
};

// Show a notification
const showNotification = (message, type = "info") => {
    const container = createNotificationContainer();

    const notification = document.createElement("div");
    notification.className = `quick-switch-login-notification ${type}`;
    notification.style.cssText = `
    padding: 12px 16px;
    margin-bottom: 10px;
    border-radius: 4px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    animation: fadeIn 0.3s ease-in-out;
    color: white;
  `;

    // Set background color based on type
    if (type === "success") {
        notification.style.backgroundColor = "#4CAF50";
    } else if (type === "error") {
        notification.style.backgroundColor = "#F44336";
    } else {
        notification.style.backgroundColor = "#2196F3";
    }

    notification.textContent = message;
    container.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = "0";
        notification.style.transition = "opacity 0.3s ease-in-out";

        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
};

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "showNotification") {
        showNotification(message.message, message.type);
    } else if (message.action === "promptUser") {
        const input = prompt(message.message, message.defaultValue || "");
        sendResponse({ input });
        return true; // Keep the message channel open for the response
    } else if (message.action === "confirmAction") {
        const confirmed = confirm(message.message);
        sendResponse({ confirmed });
        return true; // Keep the message channel open for the response
    }
});
