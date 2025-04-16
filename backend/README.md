# Quick Switch Login Backend

This is the backend API for the Quick Switch Login browser extension. It provides authentication and session management functionality.

## Features

- User authentication (register, login, password reset)
- Session management (save, retrieve, delete)
- Secure API with JWT authentication
- Rate limiting to prevent abuse
- MongoDB database for data storage

## Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)

### Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file based on the `.env.example` file:
   ```
   cp .env.example .env
   ```

3. Update the `.env` file with your configuration:
   - Set a strong `JWT_SECRET`
   - Configure your MongoDB connection string
   - Set up email configuration for password reset functionality

### Running the Server

For development with auto-reload:
```
npm run dev
```

For production:
```
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/me` - Get current user info (requires authentication)
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:resetToken` - Reset password with token
- `DELETE /api/auth/delete-account` - Delete user account (requires authentication)

### Sessions

- `GET /api/sessions` - Get all sessions for the current user
- `POST /api/sessions` - Create a new session or update existing
- `GET /api/sessions/domain/:domain` - Get sessions for a specific domain
- `GET /api/sessions/:id` - Get a single session by ID
- `DELETE /api/sessions/:id` - Delete a session

## Security

- All passwords are securely hashed using bcrypt
- JWT is used for authentication
- Rate limiting is implemented to prevent brute-force attacks
- CORS is configured to allow only the extension to access the API
- Helmet is used to set security-related HTTP headers

## Data Structure

### User

```json
{
  "email": "user@example.com",
  "password": "hashed_password",
  "resetPasswordToken": "optional_reset_token",
  "resetPasswordExpires": "optional_expiry_date",
  "createdAt": "date"
}
```

### Session

```json
{
  "sessionId": "unique_id",
  "userId": "user_id_reference",
  "sessionName": "Custom Session Name",
  "websiteDomain": "example.com",
  "websiteFaviconUrl": "https://example.com/favicon.ico",
  "createdAt": "date",
  "updatedAt": "date",
  "cookies": [
    {
      "name": "cookie_name",
      "value": "cookie_value",
      "domain": "cookie_domain",
      "path": "cookie_path",
      "secure": true,
      "httpOnly": false,
      "sameSite": "Lax",
      "expirationDate": "expiry_timestamp"
    }
  ],
  "localStorage": {
    "key1": "value1",
    "key2": "value2"
  },
  "sessionStorage": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

## License

This project is licensed under the MIT License.
