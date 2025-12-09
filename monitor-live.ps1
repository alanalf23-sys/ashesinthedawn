# CoreLogic Studio - Live Status Monitor
# Continuously monitors Python server and React frontend

Write-Host "??????????????????????????????????????????????????????????????????" -ForegroundColor Cyan
Write-Host "?          CoreLogic Studio - Live Status Monitor               ?" -ForegroundColor Cyan
Write-Host "??????????????????????????????????????????????????????????????????" -ForegroundColor Cyan
Write-Host ""
Write-Host "Monitoring servers... Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

$iteration = 0

while ($true) {
    $iteration++
    
    # Clear previous status (move cursor up)
    if ($iteration -gt 1) {
        Write-Host "`r`n" -NoNewline
    }
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] Checking..." -ForegroundColor Gray
    Write-Host ""
    
    # Check Python DSP Server (Port 8000)
    Write-Host "?? Python DSP Server: " -NoNewline
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $json = $response.Content | ConvertFrom-Json
            Write-Host "? ONLINE" -ForegroundColor Green
            Write-Host "   ?? Status: $($json.status)" -ForegroundColor Gray
            Write-Host "   ?? DSP Available: $($json.dsp_available)" -ForegroundColor $(if ($json.dsp_available) {'Green'} else {'Yellow'})
            Write-Host "   ?? Codette Available: $($json.codette_available)" -ForegroundColor $(if ($json.codette_available) {'Green'} else {'Red'})
        }
    } catch {
        Write-Host "? OFFLINE" -ForegroundColor Red
        Write-Host "   ?? Server not responding on port 8000" -ForegroundColor DarkRed
        Write-Host "   ?? Check Python server window for errors" -ForegroundColor DarkYellow
    }
    
    Write-Host ""
    
    # Check React Frontend (Port 5173)
    Write-Host "? React Frontend: " -NoNewline
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "? ONLINE" -ForegroundColor Green
            Write-Host "   ?? Vite dev server running" -ForegroundColor Gray
            Write-Host "   ?? URL: http://localhost:5173" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "? OFFLINE" -ForegroundColor Red
        Write-Host "   ?? Server not responding on port 5173" -ForegroundColor DarkRed
        Write-Host "   ?? Run: npm run dev" -ForegroundColor DarkYellow
    }
    
    Write-Host ""
    
    # Check WebSocket Connection
    Write-Host "?? WebSocket: " -NoNewline
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("localhost", 8000)
        $tcp.Close()
        Write-Host "? REACHABLE" -ForegroundColor Green
        Write-Host "   ?? WebSocket endpoint available" -ForegroundColor Gray
    } catch {
        Write-Host "? UNREACHABLE" -ForegroundColor Red
        Write-Host "   ?? Python server must be online first" -ForegroundColor DarkRed
    }
    
    Write-Host ""
    Write-Host "????????????????????????????????????????????????????????????????" -ForegroundColor DarkGray
    Write-Host "Refreshing in 5 seconds... (Ctrl+C to stop)" -ForegroundColor Gray
    Write-Host ""
    
    Start-Sleep -Seconds 5
}
