# CoreLogic Studio - Backend Startup Script
# Starts the Python backend server on port 8000

Write-Host "=== CoreLogic Studio Backend Startup ===" -ForegroundColor Cyan
Write-Host ""

# Check if codette_server_unified.py exists
if (-not (Test-Path "codette_server_unified.py")) {
    Write-Host "[ERROR] codette_server_unified.py not found!" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Yellow
    exit 1
}

# Check if port 8000 is available
Write-Host "Checking port 8000..." -ForegroundColor Yellow
$existingProcess = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($existingProcess) {
    Write-Host "[WARNING] Port 8000 is already in use by process $($existingProcess.OwningProcess)" -ForegroundColor Yellow
    $response = Read-Host "Kill existing process and continue? (Y/n)"
    if ($response -eq "" -or $response -eq "y" -or $response -eq "Y") {
        Stop-Process -Id $existingProcess.OwningProcess -Force
        Write-Host "[OK] Process killed" -ForegroundColor Green
        Start-Sleep -Seconds 2
    } else {
        Write-Host "[CANCELLED] Please stop the existing process manually" -ForegroundColor Red
        exit 1
    }
}

Write-Host "[OK] Port 8000 is available" -ForegroundColor Green
Write-Host ""

# Verify .env configuration
Write-Host "Checking .env configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" | Select-String "VITE_CODETTE_API"
    if ($envContent) {
        Write-Host "[OK] Found: $envContent" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] VITE_CODETTE_API not found in .env" -ForegroundColor Yellow
        Write-Host "Adding VITE_CODETTE_API=http://localhost:8000 to .env..." -ForegroundColor Yellow
        Add-Content -Path ".env" -Value "`nVITE_CODETTE_API=http://localhost:8000"
        Write-Host "[OK] Added to .env" -ForegroundColor Green
    }
} else {
    Write-Host "[WARNING] .env file not found" -ForegroundColor Yellow
    Write-Host "Creating .env with VITE_CODETTE_API=http://localhost:8000..." -ForegroundColor Yellow
    Set-Content -Path ".env" -Value "VITE_CODETTE_API=http://localhost:8000"
    Write-Host "[OK] Created .env" -ForegroundColor Green
}
Write-Host ""

# Start the backend server
Write-Host "Starting backend server..." -ForegroundColor Yellow
Write-Host "Command: python codette_server_unified.py" -ForegroundColor Gray
Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Backend server will start in this window." -ForegroundColor White
Write-Host "Press Ctrl+C to stop the server." -ForegroundColor White
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# Start Python server
python codette_server_unified.py
