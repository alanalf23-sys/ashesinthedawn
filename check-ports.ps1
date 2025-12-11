# Port Connection Diagnostic Script
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Port Connection Diagnostic" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check .env configuration
Write-Host "1. Checking .env configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" | Select-String "CODETTE_API|DAW_API|CODETTE_PORT"
    foreach ($line in $envContent) {
        Write-Host "   $line" -ForegroundColor White
    }
} else {
    Write-Host "   [ERROR] .env file not found!" -ForegroundColor Red
}
Write-Host ""

# Check if ports are listening
Write-Host "2. Checking active ports..." -ForegroundColor Yellow
$port8000 = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
$port8001 = Get-NetTCPConnection -LocalPort 8001 -State Listen -ErrorAction SilentlyContinue

if ($port8000) {
    Write-Host "   [OK] Port 8000 is LISTENING" -ForegroundColor Green
    Write-Host "       Process: $($port8000.OwningProcess)" -ForegroundColor Gray
} else {
    Write-Host "   [!] Port 8000 is NOT listening" -ForegroundColor Red
}

if ($port8001) {
    Write-Host "   [OK] Port 8001 is LISTENING" -ForegroundColor Green
    Write-Host "       Process: $($port8001.OwningProcess)" -ForegroundColor Gray
} else {
    Write-Host "   [!] Port 8001 is NOT listening" -ForegroundColor Yellow
}
Write-Host ""

# Test HTTP connections
Write-Host "3. Testing HTTP connections..." -ForegroundColor Yellow

try {
    $response8000 = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   [OK] http://localhost:8000/health responds with:" -ForegroundColor Green
    Write-Host "       Status: $($response8000.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "   [X] http://localhost:8000/health - $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $response8001 = Invoke-WebRequest -Uri "http://localhost:8001/health" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   [OK] http://localhost:8001/health responds with:" -ForegroundColor Green
    Write-Host "       Status: $($response8001.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "   [X] http://localhost:8001/health - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Check frontend process
Write-Host "4. Checking frontend dev server..." -ForegroundColor Yellow
$viteProcess = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*vite*" -or $_.MainWindowTitle -like "*Vite*"
}

if ($viteProcess) {
    Write-Host "   [OK] Vite dev server is running" -ForegroundColor Green
    Write-Host "       PID: $($viteProcess.Id)" -ForegroundColor Gray
} else {
    Write-Host "   [!] Vite dev server not detected" -ForegroundColor Yellow
}
Write-Host ""

# Recommendations
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Recommendations:" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

if (-not $port8000) {
    Write-Host "1. Start the backend server:" -ForegroundColor Yellow
    Write-Host "   python codette_server_unified.py" -ForegroundColor White
    Write-Host ""
}

if ($viteProcess) {
    Write-Host "2. Restart the frontend to reload .env:" -ForegroundColor Yellow
    Write-Host "   - Stop: Ctrl+C in the terminal running 'npm run dev'" -ForegroundColor White
    Write-Host "   - Start: npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "3. OR hard refresh the browser:" -ForegroundColor Yellow
    Write-Host "   - Chrome/Edge: Ctrl+Shift+R" -ForegroundColor White
    Write-Host "   - Firefox: Ctrl+F5" -ForegroundColor White
}

Write-Host ""
Write-Host "If issue persists, check the browser console (F12) for the actual URL being used." -ForegroundColor Cyan
Write-Host ""
