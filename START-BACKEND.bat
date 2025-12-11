@echo off
REM Backend Only Launcher

echo.
echo Starting Backend Server...
echo.

if not exist "codette_server_unified.py" (
    echo [ERROR] Run this from project root directory!
    pause
    exit /b 1
)

powershell.exe -ExecutionPolicy Bypass -File "%~dp0start-backend.ps1"

pause
