# API Documentation

## Overview
This document provides detailed information about the API endpoints available in the Online Tutoring Platform.

## Base URLs
- Backend API: `http://localhost:3000`
- AI Service API: `http://localhost:5000`

## Authentication
Currently, the API does not require authentication. Future versions will implement JWT-based authentication.

---

## Backend API Endpoints

### Health & Status

#### Get Health Status
```
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "backend",
  "timestamp": "2025-11-24T10:30:00.000Z"
}
```

---

### User Management

#### Register User
```
POST /api/users/register
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "role": "student"
}
```

**Response (201):**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "role": "student",
  "createdAt": "2025-11-24T10:30:00.000Z"
}
```

**Error Responses:**
- 400: Missing required fields
- 409: User already exists

#### Get All Users
```
GET /api/users
```

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "role": "student",
      "createdAt": "2025-11-24T10:30:00.000Z"
    }
  ]
}
```

#### Get User by ID
```
GET /api/users/:id
```

**Response:**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "role": "student",
  "createdAt": "2025-11-24T10:30:00.000Z"
}
```

---

### Course Management

#### Get All Courses
```
GET /api/courses?subject=<subject>&level=<level>
```

**Query Parameters:**
- `subject` (optional): Filter by subject (math, science, programming)
- `level` (optional): Filter by level (beginner, intermediate, advanced)

**Response:**
```json
{
  "courses": [
    {
      "id": 1,
      "title": "Introduction to Mathematics",
      "subject": "math",
      "level": "beginner",
      "enrolled": 10
    }
  ]
}
```

#### Get Course by ID
```
GET /api/courses/:id
```

**Response:**
```json
{
  "id": 1,
  "title": "Introduction to Mathematics",
  "subject": "math",
  "level": "beginner",
  "enrolled": 10
}
```

#### Enroll in Course
```
POST /api/courses/:id/enroll
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": 1
}
```

**Response:**
```json
{
  "message": "Successfully enrolled",
  "course": { ... },
  "user": { ... }
}
```

---

### AI Tutoring Integration

#### Ask AI Tutor
```
POST /api/tutoring/ask
Content-Type: application/json
```

**Request Body:**
```json
{
  "question": "How do I solve quadratic equations?",
  "subject": "math"
}
```

**Response:**
```json
{
  "answer": "I can help you with algebra...",
  "subject": "math",
  "timestamp": "2025-11-24T10:30:00.000Z",
  "confidence": 0.85
}
```

#### Get Learning Recommendations
```
POST /api/tutoring/recommendations
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": 1,
  "level": "beginner",
  "interests": ["math", "programming"]
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "topic": "Introduction to Math",
      "difficulty": "beginner",
      "duration": "30 minutes",
      "type": "interactive"
    }
  ]
}
```

---

## AI Service API Endpoints

### Health Check

#### Get Service Health
```
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "ai-service",
  "timestamp": "2025-11-24T10:30:00.000Z"
}
```

---

### AI Query Processing

#### Query AI
```
POST /api/ai/query
Content-Type: application/json
```

**Request Body:**
```json
{
  "question": "Explain Newton's laws of motion",
  "subject": "science"
}
```

**Response:**
```json
{
  "answer": "I can assist with physics, chemistry...",
  "subject": "science",
  "timestamp": "2025-11-24T10:30:00.000Z",
  "confidence": 0.85
}
```

---

### Session Management

#### Get All Sessions
```
GET /api/ai/sessions
```

**Response:**
```json
{
  "sessions": [
    {
      "id": 1,
      "student_id": 1,
      "subject": "math",
      "created_at": "2025-11-24T10:30:00.000Z",
      "status": "active"
    }
  ]
}
```

#### Create Session
```
POST /api/ai/sessions
Content-Type: application/json
```

**Request Body:**
```json
{
  "student_id": 1,
  "subject": "math"
}
```

**Response (201):**
```json
{
  "id": 1,
  "student_id": 1,
  "subject": "math",
  "created_at": "2025-11-24T10:30:00.000Z",
  "status": "active"
}
```

---

### Recommendations

#### Get AI Recommendations
```
POST /api/ai/recommend
Content-Type: application/json
```

**Request Body:**
```json
{
  "level": "beginner",
  "interests": ["math", "programming", "science"]
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "topic": "Introduction to Math",
      "difficulty": "beginner",
      "duration": "30 minutes",
      "type": "interactive"
    },
    {
      "topic": "Introduction to Programming",
      "difficulty": "beginner",
      "duration": "30 minutes",
      "type": "interactive"
    }
  ]
}
```

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "error": "Description of the error"
}
```

### Common HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request (invalid input)
- **404**: Not Found
- **409**: Conflict (duplicate resource)
- **500**: Internal Server Error
- **503**: Service Unavailable

---

## Rate Limiting
Currently not implemented. Will be added in future versions.

## WebSocket Support
Not currently supported. Real-time features planned for future releases.

---

Last Updated: November 24, 2025
