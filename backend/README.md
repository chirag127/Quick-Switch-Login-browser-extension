# Quick Switch Login Backend

This is the backend server for the Quick Switch Login browser extension. It provides API endpoints for user authentication and session synchronization.

## Features

- **User Authentication**: Secure Email/Password authentication system.
- **Session Storage**: Store and retrieve session data for users.
- **Security**: Implements JWT authentication, password hashing, and rate limiting.

## API Endpoints

### Authentication

- `POST /api/auth/signup`: Register a new user
  - Request body: `{ email, password }`
  - Response: `{ message, token, user }`

- `POST /api/auth/login`: Login a user
  - Request body: `{ email, password }`
  - Response: `{ message, token, user }`

- `GET /api/auth/me`: Get current user (protected route)
  - Headers: `Authorization: Bearer <token>`
  - Response: `{ user }`

### Session Management

All session endpoints require authentication with a valid JWT token in the `Authorization` header.

- `POST /api/sessions/save`: Save a new session or update existing one
  - Request body: `{ name, domain, faviconUrl, cookies, localStorage, sessionStorage }`
  - Response: `{ message, session }`

- `GET /api/sessions`: Get all sessions for the current user
  - Response: `{ sessions }`

- `GET /api/sessions/domain/:domain`: Get sessions for a specific domain
  - Response: `{ sessions }`

- `GET /api/sessions/:id`: Get a specific session by ID
  - Response: `{ session }`

- `DELETE /api/sessions/:id`: Delete a session
  - Response: `{ message }`

## Setup and Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)

### Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file with the following variables:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/quick-switch-login
   JWT_SECRET=your_jwt_secret_key_change_in_production
   JWT_EXPIRATION=7d
   ```

3. Start the server:
   ```
   npm start
   ```
   
   For development with auto-reload:
   ```
   npm run dev
   ```

## Project Structure

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

## Security Considerations

- Passwords are securely hashed using bcrypt
- JWT is used for authentication
- Rate limiting is implemented to prevent brute-force attacks
- Authorization checks ensure users can only access their own data

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Chirag Singhal
