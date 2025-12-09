# Quick Codette Connection Test (PowerShell)
# Tests backend connectivity without timeouts

Write-Host "`n" -ForegroundColor White
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " ?? CODETTE API QUICK CONNECTION TEST" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "`n"

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -Method Get -UseBasicParsing -TimeoutSec 3
    if ($response.StatusCode -eq 200) {
        $data = $response.Content | ConvertFrom-Json
        Write-Host "? Backend Health: $($data.status)" -ForegroundColor Green
        Write-Host "   - Real Engine: $($data.real_engine)"
        Write-Host "   - Training Available: $($data.training_available)"
        Write-Host "   - Codette Available: $($data.codette_available)"
    }
} catch {
    Write-Host "? Health check failed: $_" -ForegroundColor Red
}

# Test 2: API Health
Write-Host "`nTest 2: API Health" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -Method Get -UseBasicParsing -TimeoutSec 3
    if ($response.StatusCode -eq 200) {
        $data = $response.Content | ConvertFrom-Json
        Write-Host "? API Status: Success" -ForegroundColor Green
        Write-Host "   - Status: $($data.data.status)"
        Write-Host "   - Service: $($data.data.service)"
    }
} catch {
    Write-Host "? API health check failed: $_" -ForegroundColor Red
}

# Test 3: Chat Endpoint
Write-Host "`nTest 3: Chat Endpoint" -ForegroundColor Green
try {
    $body = @{
        message = "What is gain staging?"
        perspective = "mix_engineering"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:8000/codette/chat" `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -UseBasicParsing `
        -TimeoutSec 3
    
    if ($response.StatusCode -eq 200) {
        $data = $response.Content | ConvertFrom-Json
        Write-Host "? Chat endpoint working" -ForegroundColor Green
        Write-Host "   - Response: $($data.response.Substring(0, 80))..."
        Write-Host "   - Confidence: $($data.confidence)"
    }
} catch {
    Write-Host "? Chat test failed: $_" -ForegroundColor Red
}

# Test 4: Status Endpoint
Write-Host "`nTest 4: Status Endpoint" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/status" -Method Get -UseBasicParsing -TimeoutSec 3
    if ($response.StatusCode -eq 200) {
        $data = $response.Content | ConvertFrom-Json
        Write-Host "? Status endpoint working" -ForegroundColor Green
        Write-Host "   - Status: $($data.status)"
        Write-Host "   - Codette Available: $($data.codette_available)"
        Write-Host "   - API Status: $($data.api_status)"
    }
} catch {
    Write-Host "??  Status check failed (endpoint may not exist, but /health works)" -ForegroundColor Yellow
}

# Test 5: WebSocket Endpoint (info only)
Write-Host "`nTest 5: WebSocket Support" -ForegroundColor Green
Write-Host "??  WebSocket test requires wscat or websocat" -ForegroundColor Yellow
Write-Host "   Install: npm install -g wscat" -ForegroundColor Gray
Write-Host "   Test: wscat -c ws://localhost:8000/ws/transport/clock" -ForegroundColor Gray
Write-Host "`n?? For full WebSocket test, run:" -ForegroundColor Cyan
Write-Host "   wscat -c ws://localhost:8000/ws" -ForegroundColor Cyan
Write-Host "   OR" -ForegroundColor Cyan
Write-Host "   wscat -c ws://localhost:8000/ws/transport/clock" -ForegroundColor Cyan

Write-Host "`n" -ForegroundColor White
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " ? QUICK TEST COMPLETE" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "`nFor full debugging, see:" -ForegroundColor Green
Write-Host "  • CODETTE_QUICK_FIX_GUIDE.md" -ForegroundColor Gray
Write-Host "  • CODETTE_CONNECTION_DEBUG_GUIDE.md" -ForegroundColor Gray
Write-Host "  • CODETTE_CONNECTION_CHECKLIST.md" -ForegroundColor Gray
Write-Host "`n"
