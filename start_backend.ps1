# Backend Start Script with Auto-Restart
# Purpose: Keep backend running even if it crashes

$ErrorActionPreference = "SilentlyContinue"
$MAX_RETRIES = 5
$RETRY_DELAY = 2

function Start-Backend {
    param([int]$RetryCount = 0)
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host " Starting Codette Backend Server" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    
    if ($RetryCount -gt 0) {
        Write-Host "Retry $RetryCount of $MAX_RETRIES" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Command: python -u codette_server.py" -ForegroundColor White
    Write-Host ""
    
    # Kill any existing backend processes
    Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep 1
    
    # Start the backend
    try {
        cd i:\ashesinthedawn
        
        # Run with unbuffered output and capture exit code
        & python -u codette_server.py 2>&1
        
        $ExitCode = $LASTEXITCODE
        
        if ($ExitCode -ne 0 -and $RetryCount -lt $MAX_RETRIES) {
            Write-Host ""
            Write-Host "[ERROR] Backend exited with code $ExitCode" -ForegroundColor Red
            Write-Host "Waiting $RETRY_DELAY seconds before retry..." -ForegroundColor Yellow
            Start-Sleep $RETRY_DELAY
            Start-Backend -RetryCount ($RetryCount + 1)
        }
        elseif ($ExitCode -ne 0) {
            Write-Host ""
            Write-Host "[ERROR] Backend failed after $MAX_RETRIES retries" -ForegroundColor Red
            Write-Host "Check the logs above for errors" -ForegroundColor Yellow
            exit 1
        }
    }
    catch {
        Write-Host "[ERROR] Exception: $_" -ForegroundColor Red
        if ($RetryCount -lt $MAX_RETRIES) {
            Write-Host "Retrying in $RETRY_DELAY seconds..." -ForegroundColor Yellow
            Start-Sleep $RETRY_DELAY
            Start-Backend -RetryCount ($RetryCount + 1)
        }
        else {
            exit 1
        }
    }
}

# Start the backend
Start-Backend
