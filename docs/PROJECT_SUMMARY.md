# TutorPro Project Summary

## 1. Project Overview
TutorPro is an online tutoring platform designed for the HCMUT environment, connecting students with tutors through a role-based system. The project focuses on a seamless user experience with simulated Single Sign-On (SSO) and strict role enforcement.

**Current Version:** 2.1.0 (Frontend Refinement & SSO Integration)
**Last Updated:** November 29, 2025

---

## 2. Key Features & Implementation Status

### Authentication & Security
*   **Simulated HCMUT SSO (CAS)**: Login flow mimics the Central Authentication Service.
*   **Role-Based Access Control (RBAC)**:
    *   **Strict Role Enforcement**: Users must log in via the correct role portal (Student, Tutor, or Admin). Mismatches (e.g., Student trying to log in as Tutor) are blocked.
    *   **Secure Session Management**: JWT-based authentication with local storage.
    *   **Logout Redirection**: Logging out securely redirects users to the main landing page (`index.html`), preventing unauthorized access loops.

### User Roles
*   **Student**: Browse courses, enroll, book sessions, rate tutors, and access resources.
*   **Tutor**: Create courses, manage sessions, upload resources, and track student progress.
*   **Admin**: System oversight, user management, and platform statistics.

### Core Functionality
*   **Course Management**: Catalog view, filtering, and enrollment.
*   **Session Scheduling**: Booking system with capacity management.
*   **Resource Sharing**: File sharing capabilities for courses.
*   **Communication**: Integrated chat system for enrolled courses.

---

## 3. Technical Architecture

### Frontend (`/frontend`)
*   **Technology**: Vanilla JavaScript, HTML5, CSS3.
*   **Architecture**: Single Page Application (SPA) feel with hash-based routing.
*   **Entry Point**: `index.html` (Role Selection) -> `login.html` (CAS Auth) -> Role Dashboard.
*   **State Management**: `localStorage` for user sessions and tokens.

### Backend (`/backend`)
*   **Technology**: Node.js, Express.js.
*   **Database**: In-memory data store (`dataStore.js`) for rapid prototyping.
*   **API**: RESTful endpoints for Auth, Courses, Sessions, and Users.
*   **Testing**: Jest framework for unit and integration testing.

---

## 4. Project Structure

```
tutor-demo-full/
├── backend/                # Node.js API Server
│   ├── src/                # Source code
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Data models (in-memory)
│   │   ├── routes/         # API route definitions
│   │   └── utils/          # Helper functions
│   ├── tests/              # Unit tests (Jest)
│   └── package.json        # Dependencies
├── frontend/               # Web Application
│   ├── assets/             # Images and static files
│   ├── index.html          # Landing Page (Role Selection)
│   ├── login.html          # CAS Login Page
│   ├── student.html        # Student Dashboard
│   ├── tutor.html          # Tutor Dashboard
│   ├── admin.html          # Admin Dashboard
│   ├── app.js              # Main application logic
│   └── styles.css          # Global styles
├── docs/                   # Documentation
│   └── PROJECT_SUMMARY.md  # This file
├── start.bat               # Windows Startup Script
└── start.ps1               # PowerShell Startup Script
```

---

## 5. Setup & Execution

### Prerequisites
*   Node.js (v18 or higher)
*   Python (for simple HTTP server)

### Quick Start
1.  Run `start.bat` (Command Prompt) or `start.ps1` (PowerShell) in the root directory.
2.  The system will launch:
    *   **Backend API**: `http://localhost:3000`
    *   **Frontend**: `http://localhost:8080`
3.  A browser window will open automatically to the landing page.

### Manual Startup
**Backend:**
```bash
cd backend
npm install
npm start
```

**Frontend:**
```bash
cd frontend
python -m http.server 8080
```

---

## 6. Recent Updates (v2.1.0)
*   **Removed**: AI Service (Python) has been deprecated and removed from the workspace.
*   **Cleanup**: Removed temporary test scripts (`check_data.js`, `test-admin-login.js`) to streamline the codebase.
*   **UI/UX**:
    *   Redesigned `index.html` for clear role selection.
    *   Updated `login.html` to match HCMUT CAS styling.
    *   Fixed logout navigation flow.
