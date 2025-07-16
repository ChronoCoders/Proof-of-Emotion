@echo off
REM EmotionalChain - Proof of Emotion Blockchain Platform
REM Windows Start Script

echo.
echo ========================================
echo   EmotionalChain PoE Blockchain Platform
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH
    echo Please install npm or reinstall Node.js
    pause
    exit /b 1
)

REM Display Node.js and npm versions
echo Node.js version: 
node --version
echo npm version: 
npm --version
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo Dependencies installed successfully!
    echo.
) else (
    echo Dependencies already installed.
    echo.
)

REM Set environment variables for Windows
set NODE_ENV=development
set PORT=5000

REM Check if database is configured
echo Checking database configuration...
if not defined DATABASE_URL (
    echo WARNING: DATABASE_URL environment variable not set
    echo The application will use in-memory storage
    echo For persistent data, please configure PostgreSQL
    echo.
)

REM Display startup information
echo Starting EmotionalChain Platform...
echo.
echo Available endpoints:
echo   - Web Interface: http://localhost:5000
echo   - API Base: http://localhost:5000/api
echo   - WebSocket: ws://localhost:5000/ws
echo   - Analytics Dashboard: http://localhost:5000/analytics
echo   - Consensus Monitor: http://localhost:5000/consensus
echo   - Biometrics Manager: http://localhost:5000/biometrics
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the application
npm run dev

REM If the application exits, show message
echo.
echo EmotionalChain server has stopped.
pause