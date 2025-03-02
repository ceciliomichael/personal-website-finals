# Portfolio Website Backend

This is the backend API for the interactive portfolio website. It handles user management, online user tracking, and feedback submission.

## Features

- User registration and authentication with UDID
- Active user tracking with automatic expiration
- Feedback submission and storage
- MongoDB integration for data persistence

## Setup

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Start the server:

```bash
python app.py
```

The server will run on `http://localhost:5000`.

## API Endpoints

### User Management

- **POST /api/user**: Create a new user or get existing user
  - Request: `{ "name": "username" }`
  - Response: User object with UDID

- **GET /api/user/:udid**: Get user by UDID
  - Response: User object

### Active Users

- **GET /api/users/active**: Get list of active users
  - Response: Array of active users

- **POST /api/users/active**: Update user active status
  - Request: `{ "udid": "user-udid", "name": "username" }`
  - Response: Success status

### Feedback

- **POST /api/feedback**: Submit feedback
  - Request: `{ "name": "username", "email": "user@example.com", "message": "feedback message", "rating": 5, "udid": "user-udid" }`
  - Response: Success status

## Database

This API connects to MongoDB at the specified URI in the application. User data is stored in the following collections:

- `users`: Stores registered users
- `active_users`: Tracks currently active users (with TTL index)
- `feedback`: Stores submitted feedback

## Notes

- Active users automatically expire after 5 minutes of inactivity
- The frontend polls for active users every 30 seconds
- UDIDs are stored in localStorage on the client side for automatic login 