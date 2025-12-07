@echo off
REM CoreLogic Studio - Simple Dependency Installer

cd /d D:\HorizonCore\GitHub

echo ========================================
echo CoreLogic Studio - Dependency Installer
echo ========================================
echo.

REM Check Node.js
echo [1/4] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo   X Node.js not found
    echo   - Download from: https://nodejs.org/
    echo   - Install LTS version and restart terminal
    pause
    exit /b 1
)
echo   OK Node.js found

REM Check npm
echo [2/4] Checking npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo   X npm not found
    pause
    exit /b 1
)
echo   OK npm found

REM Install frontend dependencies
echo [3/4] Installing frontend dependencies...
echo   Running: npm install
call npm install
if %errorlevel% neq 0 (
    echo   X Frontend installation failed
    echo   Try: npm cache clean --force
    pause
    exit /b 1
)
echo   OK Frontend dependencies installed

REM Check Python
echo [4/4] Checking Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    py --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo   X Python not found
        echo   - Download from: https://python.org/downloads/
        echo   - Install version 3.10+ and restart terminal
        echo.
        echo Frontend dependencies installed successfully!
        echo Install Python and run this script again.
        pause
        exit /b 0
    )
    set PYTHON_CMD=py
) else (
    set PYTHON_CMD=python
)
echo   OK Python found

REM Install Python dependencies
echo   Installing Python packages...
%PYTHON_CMD% -m pip install --quiet fastapi uvicorn pydantic numpy scipy
if %errorlevel% neq 0 (
    echo   ! Some Python packages may have failed
    echo   ! Try: pip install fastapi uvicorn pydantic numpy scipy
) else (
    echo   OK Backend dependencies installed
)

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Terminal 1: python run_server.py
echo   2. Terminal 2: npm run dev
echo   3. Browser: http://localhost:5173
echo.
pause
