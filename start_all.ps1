# CoreLogic Studio Complete Startup Manager

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "" -ForegroundColor Green
Write-Host "   CoreLogic Studio - Startup Manager   " -ForegroundColor Green
Write-Host "" -ForegroundColor Green
Write-Host ""

# Step 1: Cleanup
Write-Host "Step 1: Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep 2
Write-Host "      [OK] Processes cleaned" -ForegroundColor Green
Write-Host ""

# Step 2: Start Backend
Write-Host "Step 2: Starting Backend on port 8000..." -ForegroundColor Yellow
$pythonPath = (Get-Command python).Source
$backendProc = Start-Process -FilePath $pythonPath `
    -ArgumentList "codette_server.py" `
    -WorkingDirectory "i:\ashesinthedawn" `
    -WindowStyle Hidden `
    -PassThru

Write-Host "      [OK] Backend started (PID: $($backendProc.Id))" -ForegroundColor Green
Write-Host "      Waiting 5 seconds for initialization..." -ForegroundColor Cyan
Start-Sleep 5

# Test backend
try {
    $null = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "      [OK] Backend is responding" -ForegroundColor Green
}
catch {
    Write-Host "      [ERROR] Backend not responding" -ForegroundColor Red
}
Write-Host ""

# Step 3: Start Frontend
Write-Host "Step 3: Starting Frontend on port 5173..." -ForegroundColor Yellow
$null = Start-Job -ScriptBlock {
    Set-Location "i:\ashesinthedawn"
    npm run dev
}
Write-Host "      [OK] Frontend dev server starting" -ForegroundColor Green
Write-Host "      Waiting 5 seconds for initialization..." -ForegroundColor Cyan
Start-Sleep 5

# Test frontend
try {
    $null = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "      [OK] Frontend is running" -ForegroundColor Green
}
catch {
    Write-Host "      [WARNING] Frontend not yet ready" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Status
Write-Host "========================================" -ForegroundColor Green
Write-Host "System Status" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$backendRunning = Get-Process python -ErrorAction SilentlyContinue
$frontendRunning = Get-Process node -ErrorAction SilentlyContinue

if ($backendRunning) {
    Write-Host "[OK] Backend running on port 8000" -ForegroundColor Green
}
else {
    Write-Host "[ERROR] Backend not running" -ForegroundColor Red
}

if ($frontendRunning) {
    Write-Host "[OK] Frontend running on port 5173" -ForegroundColor Green
}
else {
    Write-Host "[ERROR] Frontend not running" -ForegroundColor Red
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Go to: http://localhost:5173" -ForegroundColor Cyan
Write-Host "  2. Hard refresh: Ctrl+Shift+R" -ForegroundColor Cyan
Write-Host "  3. Codette AI should show Online" -ForegroundColor Cyan
Write-Host ""
