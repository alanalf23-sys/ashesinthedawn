@echo off
REM CoreLogic Studio - PowerShell Script Launcher
REM Ensures scripts run with PowerShell, not Python

echo.
echo Starting CoreLogic Studio...
echo.

REM Check if running from correct directory
if not exist "codette_server_unified.py" (
    echo [ERROR] codette_server_unified.py not found!
    echo Please run this from the project root directory.
    pause
    exit /b 1
)

REM Run the PowerShell script
powershell.exe -ExecutionPolicy Bypass -File "%~dp0start-complete.ps1"

pause
