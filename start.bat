@echo off
echo Starting TutorPro Application...
echo.

REM Start Backend Server
echo [1/3] Starting Backend Server...
start "Backend Server" cmd /k "cd backend && node src/index.js"
timeout /t 3 /nobreak >nul

REM Start AI Service
echo [2/3] Starting AI Service...
start "AI Service" cmd /k "cd ai-service && python app.py"
timeout /t 3 /nobreak >nul

REM Start Frontend Server
echo [3/3] Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && python -m http.server 8080"
timeout /t 3 /nobreak >nul

REM Open Browser
echo.
echo Opening browser...
timeout /t 2 /nobreak >nul
start http://localhost:8080

echo.
echo ========================================
echo TutorPro is running!
echo ========================================
echo Backend:  http://localhost:3000
echo AI Service: http://localhost:5000
echo Frontend: http://localhost:8080
echo ========================================
echo.
echo Press any key to stop all services...
pause >nul

REM Stop all services
taskkill /FI "WindowTitle eq Backend Server*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq AI Service*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq Frontend Server*" /T /F >nul 2>&1

echo All services stopped.
