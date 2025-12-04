@echo off
REM Restart Codette AI Server (Windows)
echo ============================================
echo Restarting Codette AI Server
echo ============================================
echo.

echo Stopping existing server (if running)...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq codette_server_unified*" 2>nul

echo Waiting 2 seconds...
timeout /t 2 /nobreak >nul

echo.
echo Starting Codette AI Server...
echo Press Ctrl+C to stop the server
echo.

python codette_server_unified.py

pause
