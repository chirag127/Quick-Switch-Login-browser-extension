# Quick Switch Login Browser Extension

Quick Switch Login is a browser extension designed to significantly improve user productivity and workflow when managing multiple accounts or sessions on the same website. It allows users to save complete session states (including cookies, `localStorage`, and `sessionStorage`) for any website and restore them with ease, effectively switching between logged-in states in potentially one click.

## Features

-   **Save and Restore Sessions**: Save your current session state on any website and restore it later with a single click.
-   **Automatic Session Saving**: The extension automatically saves your session state when you visit a website.
-   **Cross-Device Synchronization**: Sync your saved sessions across multiple devices by signing in to your account.
-   **Secure Storage**: All sensitive session data is encrypted both locally and on the server.
-   **Intuitive UI**: Easy-to-use interface for managing your saved sessions.
-   **Context Menu Integration**: Right-click on any webpage to save or restore sessions.

## Installation

### From Chrome Web Store (Coming Soon)

1. Visit the Chrome Web Store
2. Search for "Quick Switch Login"
3. Click "Add to Chrome"

### Manual Installation (Developer Mode)

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the `extension` folder from this repository

## Usage

### Saving a Session

1. Log in to a website with your account
2. Click the Quick Switch Login extension icon in the toolbar
3. Click "Save Current Session"
4. Enter a name for the session (e.g., "Work Account")
5. Click "Save"

### Restoring a Session

1. Navigate to the website where you have a saved session
2. Click the Quick Switch Login extension icon in the toolbar
3. Find the session you want to restore in the list
4. Click "Restore"
5. Confirm the restoration when prompted

### Managing Sessions

-   **Rename a Session**: Click the "Edit" button next to a session and enter a new name
-   **Delete a Session**: Click the "Delete" button next to a session and confirm the deletion
-   **Search Sessions**: Use the search bar in the popup to filter your saved sessions

## Privacy & Security

-   **Local Storage**: Session data is stored locally in your browser using `chrome.storage.local`
-   **Encryption**: All sensitive session data is encrypted using AES-256 encryption
-   **HttpOnly Cookies**: The extension cannot access HttpOnly cookies due to browser security restrictions
-   **Permissions**: The extension requires permissions to access cookies, localStorage, and sessionStorage for the websites you visit

## Development

### Extension Structure

```
extension/
├── manifest.json
├── icons/
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── background/
│   └── service-worker.js
├── content-scripts/
│   └── content.js
└── common/
    ├── storage.js
    └── api-client.js
```

### Backend Structure

```
backend/
├── server.js
├── package.json
└── src/
    ├── controllers/
    ├── models/
    ├── routes/
    ├── middleware/
    ├── config/
    └── utils/
```

### Setup Development Environment

1. Clone the repository
2. Install dependencies for the backend:
    ```
    cd backend
    npm install
    ```
3. Create a `.env` file in the backend directory based on `.env.example`
4. Start the backend server:
    ```
    npm run dev
    ```
5. Load the extension in Chrome as described in the Manual Installation section

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

-   [Chrome Extension API](https://developer.chrome.com/docs/extensions/reference/)
-   [Express.js](https://expressjs.com/)
-   [MongoDB](https://www.mongodb.com/)
-   [Node.js](https://nodejs.org/)
