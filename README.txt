# Online Tutoring Platform - Full Stack Application

A modern online tutoring platform with course management and real-time tutoring capabilities.

#Architecture

The application consists of two main services:

# 1. Backend (Node.js/Express)
- Port: 3000
- Architecture: MVC (Model-View-Controller)
- RESTful API with modular routing
- User management (Auth, Roles, SSO Mock)
- Course & Session management
- Community Forum & Resource Library

# 2. Frontend (HTML/CSS/JavaScript)
- Port: 8080 (when using nginx)
- Responsive web interface
- Multi-page application structure:
  - `index.html`: Landing page
  - `login.html`: Authentication (Login/Register)
  - `student.html`: Student Dashboard
  - `tutor.html`: Tutor Dashboard
  - `admin.html`: Admin Dashboard
- Course browsing and enrollment
- User registration

# Quick Start

# Option 1: Docker Compose (Recommended)

1. Install Docker and Docker Compose
2. Run all services:
```bash
docker-compose up --build
```

3. Access the application:
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:3000

# Option 2: Manual Setup

# Backend Setup
```bash
cd backend
npm install
npm start
```

# Frontend Setup
Simply open `frontend/index.html` in a browser, or use a local server:
```bash
cd frontend
# Using Python:
python -m http.server 8080
# Or using Node.js:
npx serve -p 8080
```

# Features

# User Management
- User registration (students and tutors)
- Profile management
- Role-based access

# Course Management
- Browse available courses
- Filter by subject and level
- Course enrollment
- Track enrolled students
- Resource management (PDFs, Videos, Links)

# Community & Library
- Discussion Forum (Posts, Comments)
- Digital Library (Search, Categories)
- Resource sharing

# Admin & Analytics
- Dashboard statistics
- Data export (JSON/CSV)
- User & Content management
- Mock integration with HCMUT Datacore

# System Monitoring
- Health check endpoints
- Real-time status monitoring
- Service availability tracking

# API Documentation

# Backend API Endpoints

# Health Check
```
GET /health
```

# User Endpoints
```
POST /api/users/register
Body: { username, email, role }

GET /api/users
GET /api/users/:id
```

# Course Endpoints
```
GET /api/courses?subject=<subject>&level=<level>
GET /api/courses/:id
POST /api/courses/:id/enroll
Body: { userId }
```

# Environment Variables

# Backend (.env)
```
PORT=3000
NODE_ENV=development
```

# Dependencies

# Backend
- express 4.18.2
- cors 2.8.5
- axios 1.6.2
- dotenv 16.3.1

# Testing

Run backend tests:
```bash
cd backend
npm test
```

# Development

# Code Structure

```
tutor-demo-full/
├── backend/
│   ├── src/
│   │   ├── controllers/   # Business logic (Auth, Course, Session, etc.)
│   │   ├── middleware/    # Authentication & Validation
│   │   ├── models/        # Data models & In-memory storage
│   │   ├── routes/        # API Route definitions
│   │   ├── utils/         # Helper utilities
│   │   └── index.js       # Application entry point
│   ├── package.json       # Node.js dependencies
│   ├── Dockerfile        # Container configuration
│   └── .env.example      # Environment template
├── frontend/
│   ├── index.html        # Landing page
│   ├── login.html        # Login/Register page
│   ├── student.html      # Student Dashboard
│   ├── tutor.html        # Tutor Dashboard
│   ├── admin.html        # Admin Dashboard
│   ├── styles.css        # Shared styling
│   └── app.js           # Shared frontend logic
├── docs/                # Project documentation
├── docker-compose.yml   # Multi-container setup
└── README.txt          # This file
```
