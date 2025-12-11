@echo off
REM Backend Verification Launcher

echo.
echo Verifying Backend Connection...
echo.

if not exist "codette_server_unified.py" (
    echo [ERROR] Run this from project root directory!
    pause
    exit /b 1
)

powershell.exe -ExecutionPolicy Bypass -File "%~dp0verify-backend.ps1"

pause
