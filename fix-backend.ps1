# Fix Backend Server
# Kill existing process and restart cleanly

Write-Host "=== CoreLogic Studio Backend Fix ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill any Python process on port 8000
Write-Host "1. Stopping existing backend..." -ForegroundColor Yellow
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "   [OK] Backend stopped" -ForegroundColor Green
Write-Host ""

# Step 2: Kill anything holding port 8000
Write-Host "2. Clearing port 8000..." -ForegroundColor Yellow
$process = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($process) {
    $pid = $process.OwningProcess
    Write-Host "   Found process $pid on port 8000" -ForegroundColor Gray
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}
Write-Host "   [OK] Port 8000 cleared" -ForegroundColor Green
Write-Host ""

# Step 3: Check .env
Write-Host "3. Verifying .env configuration..." -ForegroundColor Yellow
$envContent = Get-Content ".env" -ErrorAction SilentlyContinue | Select-String "VITE_CODETTE_API"
if ($envContent) {
    Write-Host "   [OK] Found: $envContent" -ForegroundColor Green
} else {
    Write-Host "   [WARNING] VITE_CODETTE_API not found in .env" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Start backend
Write-Host "4. Starting backend server..." -ForegroundColor Yellow
Write-Host "   Command: python codette_server_unified.py" -ForegroundColor Gray
Write-Host ""
Write-Host "   [MANUAL] Please run this in a separate terminal:" -ForegroundColor Cyan
Write-Host "   python codette_server_unified.py" -ForegroundColor White
Write-Host ""
Write-Host "   After server starts, you should see:" -ForegroundColor Gray
Write-Host "   ? FastAPI app created with CORS enabled" -ForegroundColor Green
Write-Host "   ? Uvicorn running on http://0.0.0.0:8000" -ForegroundColor Green
Write-Host ""

# Step 5: Provide verification command
Write-Host "5. To verify backend is working:" -ForegroundColor Yellow
Write-Host "   Invoke-WebRequest -Uri 'http://localhost:8000/health' -Method Get" -ForegroundColor White
Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Start backend in a new terminal window" -ForegroundColor White
Write-Host "2. Wait for 'Uvicorn running' message" -ForegroundColor White
Write-Host "3. Start frontend: npm run dev" -ForegroundColor White
Write-Host "4. Open browser: http://localhost:5173" -ForegroundColor White
Write-Host "5. Hard refresh: Ctrl+Shift+R" -ForegroundColor White
Write-Host ""
