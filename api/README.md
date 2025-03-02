# Portfolio Website API

This is the backend API for the interactive portfolio website. It provides endpoints for user management, chat functionality, and feedback submission.

## Features

- User registration with unique username requirement
- User authentication via UDIDs
- Real-time chat functionality with message persistence
- Active user tracking
- Feedback collection

## Setup

### Prerequisites

- Python 3.8 or higher
- MongoDB installed and running locally on port 27017
- Required Python packages (see requirements.txt)

### Installation

1. Clone the repository
2. Install dependencies:

```
pip install -r requirements.txt
```

3. Make sure MongoDB is running locally on port 27017 (default MongoDB port)

### Running the API

```
python app.py
```

The API will be available at `http://localhost:5000`.

## Database Structure

The API uses MongoDB with the following collections:

- `users`: Stores user information including name, UDID, and activity timestamps
- `messages`: Stores chat messages with automatic pruning to keep only the most recent 20

## API Endpoints

### User Management

#### POST /user
Creates a new user or returns an error if the username is already taken.

**Request Body:**
```json
{
  "name": "username"
}
```

**Response:**
```json
{
  "name": "username",
  "udid": "generated-uuid",
  "created_at": "timestamp",
  "last_active": "timestamp"
}
```

**Error Response (Username Taken):**
```json
{
  "error": "Username already taken"
}
```

#### GET /user/:udid
Retrieves user information by UDID.

**Response:**
```json
{
  "name": "username",
  "udid": "udid",
  "created_at": "timestamp",
  "last_active": "timestamp"
}
```

#### PUT /user/:udid/activity
Updates the user's last active timestamp.

**Response:**
```json
{
  "status": "success"
}
```

#### GET /users/active
Gets all users active in the last 5 minutes.

**Response:**
```json
[
  {
    "name": "username",
    "udid": "udid",
    "created_at": "timestamp",
    "last_active": "timestamp"
  }
]
```

### Chat Functionality

#### GET /messages
Retrieves the 20 most recent chat messages.

**Response:**
```json
[
  {
    "id": "message-id",
    "udid": "user-udid",
    "userName": "username",
    "message": "message content",
    "timestamp": "timestamp"
  }
]
```

#### POST /messages
Sends a new chat message and stores it in the database.

**Request Body:**
```json
{
  "udid": "user-udid",
  "userName": "username",
  "message": "message content"
}
```

**Response:**
```json
{
  "id": "message-id",
  "udid": "user-udid",
  "userName": "username",
  "message": "message content",
  "timestamp": "timestamp"
}
```

### Feedback

#### POST /feedback
Submits user feedback.

**Request Body:**
```json
{
  "name": "username",
  "email": "user@example.com",
  "message": "feedback message",
  "rating": 5
}
```

**Response:**
```json
{
  "status": "success",
  "id": "feedback-id"
}
```

## Message Persistence and Limitations

- Chat messages are stored in MongoDB
- The system automatically limits the chat history to the 20 most recent messages
- When a new message is added that would exceed this limit, the oldest message is automatically removed
- This keeps the database efficient and prevents unbounded growth

## Error Handling

The API returns appropriate HTTP status codes:

- 200: Successful request
- 400: Bad request (missing parameters)
- 404: Resource not found
- 409: Conflict (e.g., username already taken)
- 500: Server error 