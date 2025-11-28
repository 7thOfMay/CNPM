# TutorPro Application Launcher
Write-Host "Starting TutorPro Application..." -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    pause
    exit 1
}

# Check if Python is installed
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Python is not installed!" -ForegroundColor Red
    Write-Host "Please install Python from https://python.org/" -ForegroundColor Yellow
    pause
    exit 1
}

# Store current location
$rootPath = $PSScriptRoot

# Start Backend Server
Write-Host "[1/2] Starting Backend Server..." -ForegroundColor Green
$backendPath = Join-Path $rootPath "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Backend Server Running...' -ForegroundColor Green; node src/index.js"
Start-Sleep -Seconds 3

# Start Frontend Server
Write-Host "[2/2] Starting Frontend Server..." -ForegroundColor Green
$frontendPath = Join-Path $rootPath "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host 'Frontend Server Running...' -ForegroundColor Green; python -m http.server 8080"
Start-Sleep -Seconds 3

# Open Browser
Write-Host ""
Write-Host "Opening browser..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Start-Process "http://localhost:8080"

# Display status
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TutorPro is running!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Backend:     http://localhost:3000" -ForegroundColor White
Write-Host "Frontend:    http://localhost:8080" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Close the service windows to stop the application." -ForegroundColor Yellow
Write-Host ""
