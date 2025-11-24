@echo off
REM Codette Server Launcher for Windows
REM This script starts the Codette FastAPI server

cd /d "%~dp0"
python run_server.py
pause
