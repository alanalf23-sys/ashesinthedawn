@echo off
REM CoreLogic Studio - Development Server Launcher
REM Automatically uses D:\Program Files\nodejs installation

echo =====================================================================
echo   CORELOGIC STUDIO - DEVELOPMENT SERVER
echo =====================================================================
echo.

REM Check if running as Administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Running as Administrator
) else (
    echo [!] Not running as Administrator
    echo [!] Attempting to restart with elevated privileges...
    echo.
    
    REM Restart this script as Administrator
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo.
echo Current directory: %CD%
echo Navigating to project...
cd /d "D:\HorizonCore\GitHub"
echo [OK] Project directory: %CD%
echo.

REM Set Node.js path
set NODE_PATH=D:\Program Files\nodejs
set NODE_EXE=%NODE_PATH%\node.exe
set NPM_CMD=%NODE_PATH%\npm.cmd

echo Checking Node.js installation...
if exist "%NODE_EXE%" (
    echo [OK] Node.js found: %NODE_EXE%
    "%NODE_EXE%" --version
) else (
    echo [ERROR] Node.js not found at: %NODE_EXE%
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo Checking npm...
if exist "%NPM_CMD%" (
    echo [OK] npm found: %NPM_CMD%
    "%NPM_CMD%" --version
) else (
    echo [ERROR] npm not found at: %NPM_CMD%
    pause
    exit /b 1
)

echo.
echo Checking dependencies...
if exist "node_modules" (
    echo [OK] node_modules folder exists
) else (
    echo [!] node_modules not found, installing dependencies...
    "%NPM_CMD%" install
    if %errorLevel% neq 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo Starting Vite development server...
echo.
echo =====================================================================
echo   Press Ctrl+C to stop the server
echo =====================================================================
echo.

REM Run npm dev
"%NPM_CMD%" run dev

REM If server exits, pause to see any error messages
if %errorLevel% neq 0 (
    echo.
    echo [ERROR] Development server exited with error code: %errorLevel%
    pause
)
