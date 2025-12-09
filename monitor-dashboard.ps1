# CoreLogic Studio - Real-Time Dashboard Monitor
# Beautiful live monitoring with auto-refresh

function Get-ServerStatus {
    param($url, $timeout = 2)
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec $timeout -ErrorAction Stop
        return @{
            Online = $true
            StatusCode = $response.StatusCode
            Content = $response.Content
        }
    } catch {
        return @{
            Online = $false
            Error = $_.Exception.Message
        }
    }
}

function Draw-StatusBox {
    param($title, $status, $details, $color)
    
    Write-Host "???????????????????????????????????????????" -ForegroundColor $color
    Write-Host "? $title" -NoNewline -ForegroundColor $color
    $padding = 41 - $title.Length
    Write-Host (" " * $padding) -NoNewline
    Write-Host "?" -ForegroundColor $color
    Write-Host "???????????????????????????????????????????" -ForegroundColor $color
    
    foreach ($line in $details) {
        Write-Host "? " -NoNewline -ForegroundColor $color
        Write-Host $line -NoNewline
        $linePadding = 39 - ([System.Text.Encoding]::UTF8.GetByteCount($line))
        Write-Host (" " * $linePadding) -NoNewline
        Write-Host "?" -ForegroundColor $color
    }
    
    Write-Host "???????????????????????????????????????????" -ForegroundColor $color
}

Clear-Host

Write-Host ""
Write-Host "???????????????????????????????????????????????????????????????????" -ForegroundColor Cyan
Write-Host "?                                                                 ?" -ForegroundColor Cyan
Write-Host "?         CoreLogic Studio - Real-Time Dashboard                 ?" -ForegroundColor Cyan
Write-Host "?                                                                 ?" -ForegroundColor Cyan
Write-Host "???????????????????????????????????????????????????????????????????" -ForegroundColor Cyan
Write-Host ""

$iteration = 0
$startTime = Get-Date

while ($true) {
    $iteration++
    $uptime = ((Get-Date) - $startTime).ToString("hh\:mm\:ss")
    
    # Move cursor to top (except first iteration)
    if ($iteration -gt 1) {
        [Console]::SetCursorPosition(0, 7)
    }
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "?? Status Update: $timestamp | Uptime: $uptime" -ForegroundColor White
    Write-Host "???????????????????????????????????????????????????????????????????" -ForegroundColor DarkGray
    Write-Host ""
    
    # Python DSP Server
    $pythonStatus = Get-ServerStatus "http://localhost:8000/health"
    if ($pythonStatus.Online) {
        $json = $pythonStatus.Content | ConvertFrom-Json
        Draw-StatusBox "?? Python DSP Server" "ONLINE" @(
            "Status      : ? $($json.status)",
            "Port        : 8000",
            "DSP Effects : $(if ($json.dsp_available) {'? Available'} else {'??  Unavailable'})",
            "Codette AI  : $(if ($json.codette_available) {'? Active'} else {'? Inactive'})"
        ) "Green"
    } else {
        Draw-StatusBox "?? Python DSP Server" "OFFLINE" @(
            "Status      : ? Not responding",
            "Port        : 8000",
            "Action      : Check Python window",
            "Command     : .\start-safe.ps1"
        ) "Red"
    }
    
    Write-Host ""
    
    # React Frontend
    $reactStatus = Get-ServerStatus "http://localhost:5173"
    if ($reactStatus.Online) {
        Draw-StatusBox "? React Frontend (Vite)" "ONLINE" @(
            "Status      : ? Running",
            "Port        : 5173",
            "URL         : http://localhost:5173",
            "Type        : Vite Dev Server"
        ) "Green"
    } else {
        Draw-StatusBox "? React Frontend (Vite)" "OFFLINE" @(
            "Status      : ? Not responding",
            "Port        : 5173",
            "Action      : Start frontend",
            "Command     : npm run dev"
        ) "Red"
    }
    
    Write-Host ""
    
    # WebSocket Connection
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("localhost", 8000)
        $tcp.Close()
        Draw-StatusBox "?? WebSocket Connection" "ACTIVE" @(
            "Status      : ? Reachable",
            "Endpoint    : ws://localhost:8000/ws",
            "Protocol    : WebSocket",
            "State       : Ready for connections"
        ) "Green"
    } catch {
        Draw-StatusBox "?? WebSocket Connection" "UNAVAILABLE" @(
            "Status      : ? Unreachable",
            "Endpoint    : ws://localhost:8000/ws",
            "Reason      : Python server offline",
            "Action      : Start Python server first"
        ) "Red"
    }
    
    Write-Host ""
    Write-Host "???????????????????????????????????????????????????????????????????" -ForegroundColor DarkGray
    Write-Host "Auto-refresh in 3 seconds... Press Ctrl+C to stop monitoring" -ForegroundColor Gray
    Write-Host ""
    
    Start-Sleep -Seconds 3
}
