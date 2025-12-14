pip# CoreLogic Studio - Complete Startup Script
# Starts Python DSP Server + React Frontend

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           CoreLogic Studio - Starting All Services            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Change to project directory
$ProjectDir = "I:\ashesinthedawn"
Set-Location $ProjectDir

# Check if virtual environment exists
if (-not (Test-Path "venv\Scripts\Activate.ps1")) {
    Write-Host "❌ Virtual environment not found!" -ForegroundColor Red
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "✅ Virtual environment created" -ForegroundColor Green
    Write-Host ""
}

# Start Python DSP Server
Write-Host "🐍 Starting Python DSP Server..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    @"
Set-Location '$ProjectDir'
. .\venv\Scripts\Activate.ps1
Write-Host '╔════════════════════════════════════════════════════════════════╗' -ForegroundColor Magenta
Write-Host '║              Python DSP Server (Port 8000)                     ║' -ForegroundColor Magenta
Write-Host '╚════════════════════════════════════════════════════════════════╝' -ForegroundColor Magenta
Write-Host ''
Write-Host '✅ Virtual environment: ACTIVATED' -ForegroundColor Green
Write-Host '🚀 Starting Codette AI + Python DSP Server...' -ForegroundColor Yellow
Write-Host ''
python codette_server_unified.py
"@
)

Start-Sleep -Seconds 3

# Start React Frontend
Write-Host "⚡ Starting React Frontend (Vite)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    @"
Set-Location '$ProjectDir'
Write-Host '╔════════════════════════════════════════════════════════════════╗' -ForegroundColor Cyan
Write-Host '║           React Frontend (Vite Dev Server)                     ║' -ForegroundColor Cyan
Write-Host '╚════════════════════════════════════════════════════════════════╝' -ForegroundColor Cyan
Write-Host ''
Write-Host '⚡ Starting Vite development server...' -ForegroundColor Yellow
Write-Host ''
npm run dev
"@
)

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    🎉 All Services Started!                    ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📌 Python DSP Server: " -NoNewline -ForegroundColor White
Write-Host "http://localhost:8000" -ForegroundColor Yellow
Write-Host "📌 React Frontend:    " -NoNewline -ForegroundColor White
Write-Host "http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Tip: Check the Python server window for DSP effects loading status" -ForegroundColor Gray
Write-Host "💡 Tip: Frontend will auto-connect to Python DSP when both are running" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to close this window (servers will keep running)..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
