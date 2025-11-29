@echo off
REM Start both servers for CoreLogic Studio + Codette AI

echo.
echo ====================================================================
echo  CORELOGIC STUDIO + CODETTE AI - STARTUP SCRIPT
echo ====================================================================
echo.

REM Start Codette AI Server (Port 8001)
echo Starting Codette AI Server on port 8001...
start "Codette AI Server" cmd /k "cd /d i:\ashesinthedawn && python codette_server_production.py"
timeout /t 3 /nobreak

REM Start React DAW Frontend (Port 5173)
echo Starting React DAW Frontend on port 5173...
start "CoreLogic Studio - React Frontend" cmd /k "cd /d i:\ashesinthedawn && npm run dev"

echo.
echo ====================================================================
echo  SERVERS STARTING...
echo ====================================================================
echo.
echo  DAW Frontend:    http://localhost:5173
echo  Codette AI API:  http://localhost:8001
echo  Codette Swagger: http://localhost:8001/docs
echo.
echo  Wait 10 seconds for servers to start, then open http://localhost:5173
echo.
echo ====================================================================
echo.

timeout /t 10
start http://localhost:5173
