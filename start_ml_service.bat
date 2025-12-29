@echo off
echo Starting Tomato Seed Viability ML Service
echo ========================================

cd /d "%~dp0"

echo.
echo Checking Python environment...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org/
    pause
    exit /b 1
)

echo ✅ Python is available

echo.
echo Checking if model file exists...
if not exist "references\fully_trained_custom_cnn.keras" (
    echo ❌ Model file not found: references\fully_trained_custom_cnn.keras
    echo Please ensure the model file is in the references/ directory
    pause
    exit /b 1
)

echo ✅ Model file found

echo.
echo Installing Python dependencies...
pip install -r requirements.txt >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Warning: Could not install Python dependencies
    echo The service may not work properly without required packages
) else (
    echo ✅ Python dependencies installed
)

echo.
echo Starting ML service...
echo.
echo The ML service will be available at: http://localhost:5000
echo Health check: http://localhost:5000/health
echo Prediction endpoint: http://localhost:5000/predict
echo.
echo Press Ctrl+C to stop the service
echo.

python start_ml_service.py
