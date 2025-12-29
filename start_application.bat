@echo off
echo Starting Tomato Seed Viability Prediction System
echo ==============================================

cd /d "%~dp0"

echo.
echo Checking Node.js and npm...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not available
    echo Please check your Node.js installation
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are available

echo.
echo Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python from https://python.org/
    echo.
    pause
    exit /b 1
)

echo ✅ Python is available

echo.
echo Installing Node.js dependencies...
call npm install

if errorlevel 1 (
    echo ❌ Failed to install dependencies
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js dependencies installed
echo.

echo.
echo Starting ML Service (Python)...
start "ML Service" cmd /k "python ml_service.py"
timeout /t 3 /nobreak >nul

echo.
echo Starting Next.js development server...
echo.
echo The application will be available at:
echo - Frontend: http://localhost:3000 (or 3001 if 3000 is busy)
echo - ML Service: http://localhost:5000
echo.
echo Features available:
echo - Single Seed Prediction (with Enhanced Analysis)
echo - Multi-Seed Detection
echo - Prediction History with Auto-save
echo - Dashboard with Statistics
echo - Settings with Color Accent Themes
echo.
echo Press Ctrl+C in this window to stop the Next.js server
echo To stop the ML service, close the "ML Service" window
echo.

call npm run dev

if errorlevel 1 (
    echo.
    echo ❌ Failed to start Next.js server
    echo.
    pause
)
