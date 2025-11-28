# TutorPro Project Summary

## 1. Project Overview
TutorPro is an online tutoring platform designed to connect students with tutors, facilitate course enrollment, session scheduling, and provide AI-assisted learning support. The project is currently in a prototype/MVP stage with a focus on core functionality, authentication, and role-based access control.

**Current Version:** 2.0.0 (Phase 1 Complete)
**Last Updated:** November 29, 2025

---

## 2. Features & Implementation Status

### Core Features (Implemented)
*   **User Management**: Registration, Login (JWT-based), Role-based access (Student, Tutor, Admin).
*   **Course Management**: Course catalog, filtering by subject/level, enrollment system.
*   **Session Management**:
    *   Tutors can create/edit/delete sessions.
    *   Students can book/cancel sessions for enrolled courses.
    *   Capacity management (max students).
*   **Resource Management**: Tutors can upload files (PDF, Video, etc.) for their courses.
*   **Communication**: Real-time chat between students and tutors (restricted to enrolled courses).
*   **AI Integration**:
    *   AI Tutor Chatbot for Q&A.
    *   Learning recommendations based on user interests.
*   **Rating & Feedback**: Students can rate sessions and provide feedback.
*   **Notifications**: System notifications for bookings, cancellations, and updates.
*   **Admin Dashboard**: User management, system statistics, and basic reporting.

### Missing / Future Features
*   **External Integrations**: HCMUT_SSO, HCMUT_Datacore, HCMUT_Library.
*   **Data Persistence**: Currently using in-memory storage (resets on restart).
*   **Advanced Analytics**: Detailed reporting and export capabilities.
*   **Video Conferencing**: Integration with Zoom/Jitsi.

---

## 3. Technical Architecture

### Backend (Node.js/Express)
*   **API**: RESTful API structure.
*   **Auth**: JWT (JSON Web Tokens) for stateless authentication.
*   **Security**: Bcrypt password hashing, protected routes middleware.
*   **Storage**: In-memory data store (`dataStore.js`) with file upload support (`multer`).
*   **Documentation**: See Section 5 for API details.

### Frontend (Vanilla JS)
*   **UI**: Responsive, card-based design with "Moodle-inspired" color scheme.
*   **Logic**: `app.js` handles API calls, state management, and DOM manipulation.
*   **Routing**: Hash-based navigation (SPA-like feel).

### AI Service (Python/Flask)
*   **Functionality**: Handles AI queries and recommendation logic.
*   **Endpoints**: `/api/ai/query`, `/api/ai/recommend`.

---

## 4. Setup & Installation

### Prerequisites
*   Node.js (v18+)
*   Python (v3.11+)
*   Git

### Quick Start (Windows)
1.  Run `start.bat` in the root directory.
2.  Access Frontend: `http://localhost:8080`
3.  Access Backend: `http://localhost:3000`

### Manual Setup
**Backend:**
```bash
cd backend
npm install
npm start
```

**AI Service:**
```bash
cd ai-service
pip install -r requirements.txt
python app.py
```

**Frontend:**
```bash
cd frontend
python -m http.server 8080
```

---

## 5. API Documentation Summary

### Base URL: `http://localhost:3000/api`

#### Authentication
*   `POST /auth/register`: Register new user.
*   `POST /auth/login`: Login and receive JWT.
*   `GET /auth/me`: Get current user info.

#### Users
*   `GET /users`: List all users (Admin).
*   `DELETE /admin/users/:id`: Delete user (Admin).

#### Courses
*   `GET /courses`: List all courses.
*   `POST /courses/:id/enroll`: Enroll in a course.
*   `GET /courses/my-courses`: Get enrolled courses.
*   `POST /tutor/courses`: Create a course (Tutor).

#### Sessions
*   `GET /sessions`: Get available sessions.
*   `POST /sessions`: Create session (Tutor).
*   `POST /sessions/:id/book`: Book a session.

#### Resources
*   `GET /resources`: Get course resources.
*   `POST /resources`: Upload a file/resource (Tutor).

#### AI & Chat
*   `POST /tutoring/ask`: Ask AI a question.
*   `GET /chat/rooms`: Get chat conversations.
*   `POST /chat/message`: Send a message.

---

## 6. Stakeholder Analysis Summary

| Stakeholder | Met Needs | Missing Needs |
| :--- | :--- | :--- |
| **Student** | Login, Enroll, Chat, Book Sessions, Rate, View Resources | SSO, Calendar Sync, External Library Access |
| **Tutor** | Create Courses, Manage Sessions, Upload Resources, View Progress | Advanced Student Analytics, Community Forum |
| **Admin** | User Management, System Stats, Role Control | Detailed Reports, Export Data, System Logs |

**Overall Coverage:** ~70% of initial requirements met.

---

## 7. Testing

### Backend Tests
```bash
cd backend
npm test
```
*   Covers: Auth, Courses, API endpoints.

### AI Service Tests
```bash
cd ai-service
pytest
```
*   Covers: Health check, Query processing.

---

*For detailed original documentation, please refer to the project history or previous commits.*
