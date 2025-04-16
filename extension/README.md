# Quick Switch Login Browser Extension

This is the frontend browser extension for Quick Switch Login. It allows users to easily save and restore complete web sessions (including cookies, localStorage, and sessionStorage) for specific websites.

## Features

- **Session Saving**: Save the current session state of any website.
- **Session Restoring**: Restore a previously saved session for a website.
- **User Authentication**: Sign up and log in to sync sessions across devices.
- **Offline Functionality**: Works reliably even when offline.
- **Intuitive Interface**: Easy-to-use popup and context menu for managing sessions.

## Extension Structure

```
extension/
├── manifest.json        # Extension manifest file
├── popup/               # Popup UI
│   ├── popup.html       # Popup HTML
│   ├── popup.css        # Popup styles
│   └── popup.js         # Popup logic
├── background/          # Background scripts
│   └── background.js    # Background service worker
├── js/                  # Shared JavaScript modules
│   ├── api.js           # Backend API communication
│   ├── session.js       # Session management logic
│   ├── utils.js         # Utility functions
│   └── content.js       # Content script for page interaction
└── icons/               # Extension icons
```

## Installation

### Development Mode

1. Clone the repository:
   ```
   git clone https://github.com/chirag127/Quick-Switch-Login-browser-extension.git
   ```

2. Generate the extension icons:
   ```
   npm install sharp
   node generate-icons.js
   ```

3. Load the extension in Chrome/Edge:
   - Open Chrome/Edge and navigate to `chrome://extensions` or `edge://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension` directory

### Production Mode

The extension is not yet available on the Chrome Web Store or Microsoft Edge Add-ons.

## Usage

1. **Save a Session**:
   - Navigate to a website where you're logged in
   - Click the extension icon or right-click on the page
   - Select "Save Current Session" and provide a name

2. **Restore a Session**:
   - Navigate to the same website
   - Click the extension icon or right-click on the page
   - Select "Restore Session" and choose the session to restore

3. **Sync Across Devices**:
   - Sign up or log in using the extension popup
   - Your sessions will automatically sync across devices where you're logged in

## Permissions

The extension requires the following permissions:

- `storage`: To store sessions and authentication data locally
- `cookies`: To read and write cookies for target domains
- `activeTab`: To get the URL/domain of the current tab
- `scripting`: To access localStorage and sessionStorage
- `contextMenus`: To add options to the right-click menu
- `<all_urls>`: To work with any website the user chooses

## Backend Communication

The extension communicates with a backend server for user authentication and session synchronization. The API base URL can be configured in `js/api.js`.

## Security Considerations

- All communication with the backend uses HTTPS
- Authentication tokens are securely stored in `chrome.storage.local`
- Session data is handled securely in transit
- The extension requests only the necessary permissions

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Chirag Singhal
