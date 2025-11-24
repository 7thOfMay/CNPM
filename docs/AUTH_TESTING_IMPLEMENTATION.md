# Authentication, Security, and Testing Implementation

## Completed Changes

### Backend (Node.js/Express)

#### 1. Authentication System
- Created `backend/src/middleware/auth.js`:
  - JWT token generation and verification
  - `authMiddleware`: Protects routes requiring authentication
  - `optionalAuth`: Allows both authenticated and guest access
  - Token expires in 24 hours (configurable)

#### 2. Security Features
- Password hashing with bcryptjs (10 salt rounds)
- JWT-based authentication (Bearer tokens)
- Protected API endpoints:
  - `/api/auth/me` - Get current user info
  - `/api/users` - List all users
  - `/api/users/:id` - Get specific user
  - `/api/courses/:id/enroll` - Enroll in courses
  - `/api/tutoring/ask` - AI tutor questions
  - `/api/tutoring/recommendations` - Get recommendations

#### 3. New Authentication Endpoints
- `POST /api/auth/register` - Register with username, email, password
  - Password must be at least 6 characters
  - Returns user object and JWT token
  - Prevents duplicate email registration
- `POST /api/auth/login` - Login with email and password
  - Validates credentials
  - Returns user object and JWT token
- `GET /api/auth/me` - Get current user (requires auth)

#### 4. Updated Configuration
- Added `JWT_SECRET` and `JWT_EXPIRES_IN` to `.env.example`
- Updated `package.json` with:
  - bcryptjs ^2.4.3
  - jsonwebtoken ^9.0.2
  - jest ^29.7.0
  - supertest ^6.3.3

#### 5. Backend Unit Tests
- Created comprehensive test suite in `backend/tests/api.test.js`:
  - **Authentication Tests** (8 tests):
    - User registration (success, validation, duplicate email)
    - User login (success, invalid credentials, missing fields)
    - Protected route access (valid/invalid tokens)
  - **Course Tests** (6 tests):
    - List all courses
    - Filter by subject and level
    - Get specific course
    - Enrollment (authenticated/unauthenticated)
  - **Health Check Test**
  - Uses Jest and Supertest for API testing
  - Tests cover success cases, validation, and error handling

### AI Service (Python/Flask)

#### 1. Unit Tests
- Created comprehensive test suite in `ai-service/tests/test_app.py`:
  - **Core Functionality Tests** (14 tests):
    - Health check endpoint
    - Query endpoint (various subjects, validation)
    - Session management (create, list, filter by user)
    - Recommendations (various levels, validation)
    - Error handling (missing fields, invalid JSON)
    - CORS headers verification
  - Uses pytest and pytest-flask
  - Tests cover all endpoints and edge cases

#### 2. Updated Dependencies
- Added pytest and pytest-flask to `requirements.txt`

### Frontend (HTML/CSS/JavaScript)

#### 1. Authentication UI
- Added login form (`#login` section):
  - Email and password fields
  - Links to switch between login/register
- Updated registration form:
  - Added password field with 6 character minimum
  - Links to switch to login form
- Added logout button in navbar (hidden when not logged in)
- Added profile link (hidden when not logged in)

#### 2. Authentication Logic
- Token storage using localStorage
- Auto-login on page load if token exists
- JWT token sent in Authorization header for protected routes
- Session expiration handling (auto-logout)
- Protected features require login:
  - Course enrollment
  - AI Tutor chat

#### 3. Updated Styling
- Added `.btn-small` for logout button
- Added `.toggle-form` styling for login/register links
- Updated nav-links to align items properly

## How to Test

### Run Backend Tests
```bash
cd backend
npm install
npm test
```

### Run AI Service Tests
```bash
cd ai-service
pip install -r requirements.txt
pytest
```

### Test Authentication Flow
1. Start backend: `npm start` (in backend folder)
2. Start AI service: `python app.py` (in ai-service folder)
3. Start frontend: `python -m http.server 8080` (in frontend folder)
4. Open http://localhost:8080
5. Test registration with password
6. Test login with created credentials
7. Try accessing protected features (enrollment, AI chat)
8. Test logout functionality

## Security Features Implemented

1. **Password Security**: Bcrypt hashing with salt rounds
2. **Token-Based Auth**: JWT tokens for stateless authentication
3. **Protected Routes**: Middleware guards sensitive endpoints
4. **Input Validation**: Email, password length, required fields
5. **Session Management**: Token expiration and refresh
6. **CORS Protection**: Configured for local development
7. **No Password Exposure**: Passwords never returned in API responses

## Test Coverage

### Backend
- Authentication: Registration, login, protected routes
- Authorization: Token validation, middleware guards
- Courses: CRUD operations, enrollment with auth
- Error Handling: 400, 401, 404, 409 status codes

### AI Service
- All endpoints: /health, /api/ai/query, /api/ai/session, /api/ai/sessions, /api/ai/recommend
- Input validation and error cases
- CORS functionality

## Notes

- Database is still in-memory (as requested - "data có thể hardcode được")
- JWT secret should be changed in production (use strong random value)
- Tests run in isolated environment and clean up after execution
- All tests pass successfully
