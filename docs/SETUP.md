# Setup Guide - Online Tutoring Platform

## Prerequisites

Before you begin, ensure you have the following installed:

### For All Methods:
- Git (for version control)
- Text editor (VS Code recommended)

### For Docker Method:
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose

### For Manual Setup:
- Python 3.11 or higher
- Node.js 18 or higher
- npm or yarn

---

## Method 1: Docker Setup (Recommended)

### Step 1: Install Docker

#### Windows:
1. Download Docker Desktop from https://www.docker.com/products/docker-desktop
2. Run the installer
3. Restart your computer
4. Verify installation:
```powershell
docker --version
docker-compose --version
```

#### Mac:
1. Download Docker Desktop for Mac
2. Install and start Docker Desktop
3. Verify installation:
```bash
docker --version
docker-compose --version
```

#### Linux:
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Step 2: Clone or Navigate to Project

```bash
cd c:\Users\ideqt\Downloads\tutor-demo-full
```

### Step 3: Build and Run

```powershell
# Build and start all services
docker-compose up --build

# Or run in detached mode (background)
docker-compose up -d --build
```

### Step 4: Verify Services

Open your browser and check:
- Frontend: http://localhost:8080
- Backend API: http://localhost:3000/health
- AI Service: http://localhost:5000/health

### Step 5: Stop Services

```powershell
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

---

## Method 2: Manual Setup

### Step 1: Setup AI Service

#### 1. Navigate to AI Service Directory
```powershell
cd ai-service
```

#### 2. Create Virtual Environment
```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate
```

#### 3. Install Dependencies
```powershell
pip install -r requirements.txt
```

#### 4. Configure Environment
```powershell
# Copy example environment file
Copy-Item .env.example .env

# Edit .env if needed
```

#### 5. Run the Service
```powershell
python app.py
```

The AI service should now be running on http://localhost:5000

---

### Step 2: Setup Backend

#### 1. Open New Terminal and Navigate to Backend
```powershell
cd backend
```

#### 2. Install Dependencies
```powershell
npm install
```

#### 3. Configure Environment
```powershell
# Copy example environment file
Copy-Item .env.example .env

# Edit .env if needed
```

#### 4. Run the Backend
```powershell
npm start

# Or for development with auto-reload
npm run dev
```

The backend should now be running on http://localhost:3000

---

### Step 3: Setup Frontend

#### Option A: Simple Method (Open in Browser)
Simply open `frontend/index.html` in your web browser.

#### Option B: Using Python HTTP Server
```powershell
cd frontend
python -m http.server 8080
```

#### Option C: Using Node.js
```powershell
cd frontend
npx serve -p 8080
```

The frontend should now be accessible at http://localhost:8080

---

## Verification Steps

### 1. Check All Services are Running

**AI Service Health Check:**
```powershell
curl http://localhost:5000/health
```

**Backend Health Check:**
```powershell
curl http://localhost:3000/health
```

**Frontend:**
Open http://localhost:8080 in your browser

### 2. Test Basic Functionality

#### Test User Registration:
```powershell
curl -X POST http://localhost:3000/api/users/register `
  -H "Content-Type: application/json" `
  -d '{\"username\":\"testuser\",\"email\":\"test@example.com\",\"role\":\"student\"}'
```

#### Test AI Query:
```powershell
curl -X POST http://localhost:3000/api/tutoring/ask `
  -H "Content-Type: application/json" `
  -d '{\"question\":\"What is Python?\",\"subject\":\"programming\"}'
```

#### Test Course Retrieval:
```powershell
curl http://localhost:3000/api/courses
```

---

## Troubleshooting

### Problem: Port Already in Use

**Windows:**
```powershell
# Check what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace <PID> with actual process ID)
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
# Check what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Problem: Python Not Found

**Windows:**
1. Download Python from https://www.python.org/downloads/
2. During installation, check "Add Python to PATH"
3. Restart terminal

**Mac:**
```bash
brew install python@3.11
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install python3.11 python3-pip
```

### Problem: Node.js Not Found

**Windows:**
1. Download from https://nodejs.org/
2. Run installer
3. Restart terminal

**Mac:**
```bash
brew install node
```

**Linux:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Problem: Virtual Environment Not Activating

**Windows PowerShell:**
```powershell
# Enable script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then activate again
.\venv\Scripts\activate
```

### Problem: CORS Errors

Make sure:
1. All services are running on the correct ports
2. Frontend is making requests to the right URLs
3. CORS is enabled in both backend and AI service (already configured)

### Problem: Docker Build Fails

```powershell
# Clean up Docker
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
docker-compose up
```

---

## Development Tips

### Hot Reload Setup

**Backend (Nodemon):**
```powershell
npm install -g nodemon
nodemon src/index.js
```

**AI Service (Flask Debug Mode):**
Already enabled in development mode

### Using Different Ports

Edit the `.env` files in each service directory:

**ai-service/.env:**
```
PORT=5001
```

**backend/.env:**
```
PORT=3001
AI_SERVICE_URL=http://localhost:5001
```

**frontend/app.js:**
Update the API_BASE_URL and AI_SERVICE_URL constants

---

## Next Steps

After successful setup:
1. Explore the frontend interface
2. Register a test user
3. Browse available courses
4. Try the AI tutor feature
5. Check the system status dashboard

For API documentation, see `docs/API.md`

---

Last Updated: November 24, 2025
