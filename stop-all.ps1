# CoreLogic Studio - Stop All Services
# Stops Python DSP Server + React Frontend

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Red
Write-Host "║          CoreLogic Studio - Stopping All Services             ║" -ForegroundColor Red
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Red
Write-Host ""

# Stop Python processes on port 8000
Write-Host "🐍 Stopping Python DSP Server..." -ForegroundColor Yellow
$pythonProcesses = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | 
    Select-Object -ExpandProperty OwningProcess | 
    Get-Process -ErrorAction SilentlyContinue

if ($pythonProcesses) {
    foreach ($proc in $pythonProcesses) {
        Write-Host "   └─ Killing process: $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor Gray
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "✅ Python DSP Server stopped" -ForegroundColor Green
} else {
    Write-Host "⚠️  No Python server found on port 8000" -ForegroundColor DarkYellow
}

Write-Host ""

# Stop Node/Vite processes on port 5173
Write-Host "⚡ Stopping React Frontend..." -ForegroundColor Yellow
$nodeProcesses = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | 
    Select-Object -ExpandProperty OwningProcess | 
    Get-Process -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    foreach ($proc in $nodeProcesses) {
        Write-Host "   └─ Killing process: $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor Gray
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "✅ React Frontend stopped" -ForegroundColor Green
} else {
    Write-Host "⚠️  No Vite server found on port 5173" -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                  🛑 All Services Stopped                       ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
