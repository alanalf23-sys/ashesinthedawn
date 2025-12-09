# CoreLogic Studio - Status Checker
# Check if Python DSP and Frontend servers are running

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          CoreLogic Studio - Service Status Check              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check Python DSP Server (Port 8000)
Write-Host "🐍 Python DSP Server (Port 8000): " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET -TimeoutSec 2 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ ONLINE" -ForegroundColor Green
        $json = $response.Content | ConvertFrom-Json
        Write-Host "   └─ Status: $($json.status)" -ForegroundColor Gray
        Write-Host "   └─ DSP Available: $($json.dsp_available)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ OFFLINE" -ForegroundColor Red
    Write-Host "   └─ Server not responding on port 8000" -ForegroundColor DarkRed
}

Write-Host ""

# Check React Frontend (Port 5173)
Write-Host "⚡ React Frontend (Port 5173): " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 2 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ ONLINE" -ForegroundColor Green
        Write-Host "   └─ Vite dev server running" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ OFFLINE" -ForegroundColor Red
    Write-Host "   └─ Server not responding on port 5173" -ForegroundColor DarkRed
}

Write-Host ""

# Check WebSocket Connection
Write-Host "🔌 WebSocket (Port 8000/ws): " -NoNewline
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $tcp.Connect("localhost", 8000)
    $tcp.Close()
    Write-Host "✅ REACHABLE" -ForegroundColor Green
    Write-Host "   └─ WebSocket endpoint available" -ForegroundColor Gray
} catch {
    Write-Host "❌ UNREACHABLE" -ForegroundColor Red
    Write-Host "   └─ WebSocket connection failed" -ForegroundColor DarkRed
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host ""

# Quick Actions
Write-Host "Quick Actions:" -ForegroundColor Yellow
Write-Host "  • Start All:  " -NoNewline -ForegroundColor White
Write-Host ".\start-all.ps1" -ForegroundColor Cyan
Write-Host "  • Stop All:   " -NoNewline -ForegroundColor White
Write-Host ".\stop-all.ps1" -ForegroundColor Cyan
Write-Host ""

# CoreLogic Studio - Status Checker
# Quick one-time status check with option for live monitoring

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          CoreLogic Studio - Status Check                      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "🕐 Check Time: $timestamp" -ForegroundColor Gray
Write-Host ""

# Check Python DSP Server (Port 8000)
Write-Host "🐍 Python DSP Server (Port 8000): " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET -TimeoutSec 2 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ ONLINE" -ForegroundColor Green
        $json = $response.Content | ConvertFrom-Json
        Write-Host "   └─ Status: $($json.status)" -ForegroundColor Gray
        Write-Host "   └─ DSP Available: $($json.dsp_available)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ OFFLINE" -ForegroundColor Red
    Write-Host "   └─ Server not responding on port 8000" -ForegroundColor DarkRed
}

Write-Host ""

# Check React Frontend (Port 5173)
Write-Host "⚡ React Frontend (Port 5173): " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 2 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ ONLINE" -ForegroundColor Green
        Write-Host "   └─ Vite dev server running" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ OFFLINE" -ForegroundColor Red
    Write-Host "   └─ Server not responding on port 5173" -ForegroundColor DarkRed
}

Write-Host ""

# Check WebSocket Connection
Write-Host "🔌 WebSocket (Port 8000/ws): " -NoNewline
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $tcp.Connect("localhost", 8000)
    $tcp.Close()
    Write-Host "✅ REACHABLE" -ForegroundColor Green
    Write-Host "   └─ WebSocket endpoint available" -ForegroundColor Gray
} catch {
    Write-Host "❌ UNREACHABLE" -ForegroundColor Red
    Write-Host "   └─ WebSocket connection failed" -ForegroundColor DarkRed
}

Write-Host ""
Write-Host "────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""
Write-Host "💡 Options:" -ForegroundColor Cyan
Write-Host "   • For continuous monitoring: .\monitor-live.ps1" -ForegroundColor White
Write-Host "   • For dashboard view: .\monitor-dashboard.ps1" -ForegroundColor White
Write-Host "   • To start servers: .\start-safe.ps1 or .\start-all.ps1" -ForegroundColor White
Write-Host ""

# Ask if user wants live monitoring
$response = Read-Host "Start live monitoring? (Y/n)"
if ($response -eq "" -or $response -eq "y" -or $response -eq "Y") {
    Write-Host ""
    Write-Host "Starting live monitor..." -ForegroundColor Green
    Start-Sleep -Seconds 1
    & "$PSScriptRoot\monitor-dashboard.ps1"
}
