# Online Tutoring Platform - Full Stack Application

A modern online tutoring platform with AI-powered assistance, course management, and real-time tutoring capabilities.

## Architecture

The application consists of three main services:

### 1. AI Service (Python/Flask)
- Port: 5000
- AI-powered tutoring assistance
- Question answering and recommendations
- Session management

### 2. Backend (Node.js/Express)
- Port: 3000
- RESTful API
- User management
- Course management
- Integration with AI service

### 3. Frontend (HTML/CSS/JavaScript)
- Port: 8080 (when using nginx)
- Responsive web interface
- Real-time chat with AI tutor
- Course browsing and enrollment
- User registration

## Quick Start

### Option 1: Docker Compose (Recommended)

1. Install Docker and Docker Compose
2. Run all services:
```bash
docker-compose up --build
```

3. Access the application:
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:3000
   - AI Service: http://localhost:5000

### Option 2: Manual Setup

#### AI Service Setup
```bash
cd ai-service
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
python app.py
```

#### Backend Setup
```bash
cd backend
npm install
npm start
```

#### Frontend Setup
Simply open `frontend/index.html` in a browser, or use a local server:
```bash
cd frontend
# Using Python:
python -m http.server 8080
# Or using Node.js:
npx serve -p 8080
```

## Features

### User Management
- User registration (students and tutors)
- Profile management
- Role-based access

### Course Management
- Browse available courses
- Filter by subject and level
- Course enrollment
- Track enrolled students

### AI Tutoring
- Real-time question answering
- Subject-specific assistance (Math, Science, Programming)
- Personalized learning recommendations
- Chat history

### System Monitoring
- Health check endpoints
- Real-time status monitoring
- Service availability tracking

## API Documentation

### Backend API Endpoints

#### Health Check
```
GET /health
```

#### User Endpoints
```
POST /api/users/register
Body: { username, email, role }

GET /api/users
GET /api/users/:id
```

#### Course Endpoints
```
GET /api/courses?subject=<subject>&level=<level>
GET /api/courses/:id
POST /api/courses/:id/enroll
Body: { userId }
```

#### Tutoring Endpoints
```
POST /api/tutoring/ask
Body: { question, subject }

POST /api/tutoring/recommendations
Body: { userId, level, interests }
```

### AI Service API Endpoints

#### Health Check
```
GET /health
```

#### AI Endpoints
```
POST /api/ai/query
Body: { question, subject }

GET /api/ai/sessions
POST /api/ai/sessions
Body: { student_id, subject }

POST /api/ai/recommend
Body: { level, interests }
```

## Environment Variables

### AI Service (.env)
```
PORT=5000
FLASK_ENV=development
FLASK_DEBUG=True
```

### Backend (.env)
```
PORT=3000
AI_SERVICE_URL=http://localhost:5000
NODE_ENV=development
```

## Dependencies

### AI Service
- Flask 3.0.0
- flask-cors 4.0.0
- python-dotenv 1.0.0
- gunicorn 21.2.0

### Backend
- express 4.18.2
- cors 2.8.5
- axios 1.6.2
- dotenv 16.3.1

## Testing

Run backend tests:
```bash
cd backend
npm test
```

Run AI service tests:
```bash
cd ai-service
pytest
```

## Development

### Code Structure

```
tutor-demo-full/
├── ai-service/
│   ├── app.py              # Flask application
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile         # Container configuration
│   └── .env.example       # Environment template
├── backend/
│   ├── src/
│   │   └── index.js       # Express server
│   ├── package.json       # Node.js dependencies
│   ├── Dockerfile        # Container configuration
│   └── .env.example      # Environment template
├── frontend/
│   ├── index.html        # Main HTML file
│   ├── styles.css        # Styling
│   └── app.js           # Frontend logic
├── docs/                # Project documentation
├── docker-compose.yml   # Multi-container setup
└── README.txt          # This file
```

## Development Workflow

1. Make changes to the code
2. Test locally
3. Commit changes with descriptive messages
4. Push to repository
5. Deploy using Docker Compose

## Troubleshooting

### Port Already in Use
If you get port conflicts:
```bash
# Check what's using the port (Windows)
netstat -ano | findstr :3000

# Check what's using the port (Mac/Linux)
lsof -i :3000

# Kill the process
taskkill /PID <PID> /F  # Windows
kill -9 <PID>           # Mac/Linux
```

### Services Not Connecting
1. Ensure all services are running
2. Check the health endpoints
3. Verify environment variables
4. Check Docker network (if using Docker)

### CORS Issues
CORS is enabled on both services. If you still face issues:
1. Check the CORS configuration in backend and AI service
2. Verify the frontend is making requests to the correct URLs

## Additional Resources

See `docs/` folder for:
- Project specifications
- Architecture diagrams
- API documentation
- Report documents

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational purposes.

## Support

For questions or issues, please refer to the documentation in the `docs/` folder.

---

Last Updated: November 24, 2025
Version: 1.0.0

