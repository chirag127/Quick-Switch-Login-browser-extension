# Quick Switch Login Browser Extension

A browser extension that allows users to easily save and restore complete web sessions (including cookies, localStorage, and sessionStorage) for specific websites. The extension streamlines the process of switching between different user accounts or states on the same website with a single click.

## Features

- **Session Saving**: Save the current session state (cookies, localStorage, sessionStorage) of any website.
- **Session Restoring**: Restore a previously saved session for a website, replacing the current session state.
- **User Authentication**: Secure Email/Password authentication system for user accounts.
- **Session Synchronization**: Synchronize saved sessions securely across devices for logged-in users.
- **Offline Functionality**: Works reliably even when offline (local save/restore).
- **Intuitive Interface**: Easy-to-use popup and context menu for managing sessions.

## Project Structure

The project is organized into two main parts:

1. **Browser Extension (frontend)**: Located in the `extension/` directory.
2. **Backend Server**: Located in the `backend/` directory.

### Extension Structure

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

### Backend Structure

```
backend/
├── server.js            # Main entry point
├── config/              # Configuration files
│   └── db.js            # MongoDB connection
├── routes/              # API routes
│   ├── authRoutes.js    # Authentication routes
│   └── sessionRoutes.js # Session management routes
├── controllers/         # Request handlers
│   ├── authController.js    # Authentication logic
│   └── sessionController.js # Session management logic
├── models/              # Database models
│   ├── User.js          # User model
│   └── Session.js       # Session model
├── middleware/          # Middleware functions
│   ├── auth.js          # Authentication middleware
│   └── rateLimiter.js   # Rate limiting middleware
└── package.json         # Dependencies and scripts
```

## Setup and Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Chrome/Edge browser (for extension development)

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/quick-switch-login
   JWT_SECRET=your_jwt_secret_key_change_in_production
   JWT_EXPIRATION=7d
   ```

4. Start the server:
   ```
   npm start
   ```
   
   For development with auto-reload:
   ```
   npm run dev
   ```

### Extension Setup

1. Generate the extension icons:
   ```
   npm install sharp
   node generate-icons.js
   ```

2. Load the extension in Chrome/Edge:
   - Open Chrome/Edge and navigate to `chrome://extensions` or `edge://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension` directory

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

## Security Considerations

- All communication between the extension and backend uses HTTPS
- Passwords are securely hashed using bcrypt
- JWT is used for authentication
- Rate limiting is implemented to prevent brute-force attacks
- The extension requests only the necessary permissions

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Chirag Singhal
