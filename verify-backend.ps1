# Backend Verification Script
# Tests if the backend is responding correctly

Write-Host "=== Backend Verification ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Testing connection to http://localhost:8000/health..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        Write-Host "? SUCCESS! Backend is responding" -ForegroundColor Green
        Write-Host ""
        Write-Host "Response:" -ForegroundColor Cyan
        $json = $response.Content | ConvertFrom-Json
        $json | ConvertTo-Json -Depth 5 | Write-Host -ForegroundColor White
        Write-Host ""
        Write-Host "=== Backend is ready for frontend connection ===" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Open a new terminal" -ForegroundColor White
        Write-Host "2. Run: npm run dev" -ForegroundColor White
        Write-Host "3. Open browser: http://localhost:5173" -ForegroundColor White
        Write-Host "4. Hard refresh: Ctrl+Shift+R" -ForegroundColor White
    }
} catch {
    Write-Host "? FAILED - Backend not responding" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Cyan
    Write-Host "1. Make sure backend is running: .\start-backend.ps1" -ForegroundColor White
    Write-Host "2. Check for error messages in backend terminal" -ForegroundColor White
    Write-Host "3. Verify Python dependencies are installed" -ForegroundColor White
    Write-Host "4. Check if port 8000 is blocked by firewall" -ForegroundColor White
}

Write-Host ""
