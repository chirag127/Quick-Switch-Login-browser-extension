# Quick Switch Login Browser Extension

This is the frontend part of the Quick Switch Login browser extension. It allows users to save and restore web sessions (cookies, localStorage, sessionStorage) for easy account switching.

## Features

- Save the current session state for any website
- Restore previously saved sessions with a single click
- Manage saved sessions (view, delete)
- Sync sessions across devices (when logged in)
- Work offline with local session storage
- Configure website restrictions (whitelist/blacklist)

## Setup

### Prerequisites

- Chrome, Edge, or Firefox browser
- Node.js (for icon generation)

### Installation

1. Generate the extension icons:
   ```
   npm run generate-icons
   ```

2. Load the extension in your browser:
   - Open Chrome/Edge and navigate to `chrome://extensions` or `edge://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension` directory

## Usage

### Save a Session

1. Navigate to a website where you're logged in
2. Click the extension icon in the toolbar
3. Click "Save Current Session" and provide a name
4. The session will be saved locally and synced if you're logged in

### Restore a Session

1. Navigate to the same website domain as the saved session
2. Click the extension icon in the toolbar
3. Find the session in the list and click "Restore"
4. Confirm the restoration
5. The page will reload with the restored session

### Sync Across Devices

1. Create an account or log in using the extension popup
2. Your sessions will automatically sync across devices where you're logged in

### Configure Website Restrictions

1. Click the "Settings" button in the extension popup
2. Choose between blacklist mode (disable on specific sites) or whitelist mode (enable only on specific sites)
3. Add domains to the list (one per line)
4. Save your settings

## Project Structure

```
extension/
├── manifest.json        # Extension manifest file
├── popup/               # Popup UI
│   ├── popup.html       # Popup HTML
│   ├── popup.css        # Popup styles
│   ├── popup.js         # Popup logic
│   └── save-session.html # Save session popup for context menu
├── background/          # Background scripts
│   └── background.js    # Background service worker
├── js/                  # Shared JavaScript modules
│   ├── api.js           # Backend API communication
│   ├── session.js       # Session management logic
│   ├── utils.js         # Utility functions
│   └── content.js       # Content script for page interaction
└── icons/               # Extension icons
```

## Permissions

The extension requires the following permissions:

- `cookies`: To read, write, and delete cookies for target websites
- `storage`: To store settings and session data
- `activeTab`: To get the URL/domain of the current tab
- `contextMenus`: To add the "Save Session" option to the right-click menu
- `scripting`: To execute scripts for localStorage/sessionStorage access
- `<all_urls>`: To interact with cookies and storage on websites

## Security Considerations

- All communication with the backend uses HTTPS
- Sensitive data is only transmitted when the user is authenticated
- The extension follows the principle of least privilege
- User data is protected by proper authentication and authorization

## License

This project is licensed under the MIT License.
