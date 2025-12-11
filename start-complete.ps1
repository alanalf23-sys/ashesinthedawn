# CoreLogic Studio - Complete Startup (Automated)
# Starts backend and frontend with full verification

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "   CoreLogic Studio - Automated Startup" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill existing processes
Write-Host "Step 1: Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "   [OK] Cleanup complete" -ForegroundColor Green
Write-Host ""

# Step 2: Verify .env
Write-Host "Step 2: Checking .env configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" | Select-String "VITE_CODETTE_API"
    if ($envContent) {
        Write-Host "   [OK] $envContent" -ForegroundColor Green
    } else {
        Write-Host "   [FIX] Adding VITE_CODETTE_API to .env..." -ForegroundColor Yellow
        Add-Content -Path ".env" -Value "`nVITE_CODETTE_API=http://localhost:8000"
        Write-Host "   [OK] Fixed" -ForegroundColor Green
    }
} else {
    Write-Host "   [FIX] Creating .env file..." -ForegroundColor Yellow
    Set-Content -Path ".env" -Value "VITE_CODETTE_API=http://localhost:8000"
    Write-Host "   [OK] Created" -ForegroundColor Green
}
Write-Host ""

# Step 3: Start Backend
Write-Host "Step 3: Starting backend server..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    python codette_server_unified.py
}
Write-Host "   [OK] Backend starting (Job ID: $($backendJob.Id))" -ForegroundColor Green
Write-Host "   Waiting 8 seconds for initialization..." -ForegroundColor Gray
Start-Sleep -Seconds 8
Write-Host ""

# Step 4: Verify Backend
Write-Host "Step 4: Verifying backend connection..." -ForegroundColor Yellow
$retries = 0
$maxRetries = 5
$backendReady = $false

while ($retries -lt $maxRetries -and -not $backendReady) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET -TimeoutSec 3 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $backendReady = $true
            Write-Host "   [OK] Backend is responding!" -ForegroundColor Green
            $json = $response.Content | ConvertFrom-Json
            Write-Host "   +- Status: $($json.status)" -ForegroundColor Gray
        }
    } catch {
        $retries++
        if ($retries -lt $maxRetries) {
            Write-Host "   [WAIT] Attempt $retries/$maxRetries - Waiting..." -ForegroundColor Gray
            Start-Sleep -Seconds 2
        }
    }
}

if (-not $backendReady) {
    Write-Host "   [ERROR] Backend failed to respond after $maxRetries attempts" -ForegroundColor Red
    Write-Host "   Check backend output with: Receive-Job $($backendJob.Id)" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 5: Start Frontend
Write-Host "Step 5: Starting frontend server..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run dev
}
Write-Host "   [OK] Frontend starting (Job ID: $($frontendJob.Id))" -ForegroundColor Green
Write-Host "   Waiting 5 seconds for initialization..." -ForegroundColor Gray
Start-Sleep -Seconds 5
Write-Host ""

# Step 6: Verify Frontend
Write-Host "Step 6: Verifying frontend connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 3 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   [OK] Frontend is running!" -ForegroundColor Green
    }
} catch {
    Write-Host "   [WARNING] Frontend not responding yet (might still be starting)" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "===================================================" -ForegroundColor Green
Write-Host "   STARTUP COMPLETE" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:" -ForegroundColor Cyan
Write-Host "   * Running on: http://localhost:8000" -ForegroundColor White
Write-Host "   * Job ID: $($backendJob.Id)" -ForegroundColor Gray
Write-Host "   * View logs: Receive-Job $($backendJob.Id)" -ForegroundColor Gray
Write-Host ""
Write-Host "Frontend:" -ForegroundColor Cyan
Write-Host "   * Running on: http://localhost:5173" -ForegroundColor White
Write-Host "   * Job ID: $($frontendJob.Id)" -ForegroundColor Gray
Write-Host "   * View logs: Receive-Job $($frontendJob.Id)" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Open browser: http://localhost:5173" -ForegroundColor White
Write-Host "   2. Hard refresh: Ctrl+Shift+R" -ForegroundColor White
Write-Host "   3. Check connection status in UI" -ForegroundColor White
Write-Host ""
Write-Host "To stop servers:" -ForegroundColor Yellow
Write-Host "   Stop-Job $($backendJob.Id); Stop-Job $($frontendJob.Id)" -ForegroundColor White
Write-Host "   Remove-Job $($backendJob.Id); Remove-Job $($frontendJob.Id)" -ForegroundColor White
Write-Host ""
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""
