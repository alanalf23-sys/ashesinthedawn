# Codette AI Backend Server Startup Script
# This script starts the FastAPI backend server for Codette AI integration

param(
    [int]$Port = 8000,
    [string]$Host = "127.0.0.1",
    [switch]$Debug = $false
)

Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          Codette AI Backend Server Startup                   ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Get current directory
$scriptDir = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
$projectRoot = $scriptDir

Write-Host "📁 Project Root: $projectRoot" -ForegroundColor Green
Write-Host ""

# Step 1: Check Python
Write-Host "🔍 Step 1: Checking Python Installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found! Please install Python 3.10 or later." -ForegroundColor Red
    Write-Host "   Download from: https://www.python.org/downloads/" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Check Python dependencies
Write-Host "🔍 Step 2: Checking Python Dependencies..." -ForegroundColor Yellow
$requiredPackages = @("fastapi", "uvicorn", "pydantic", "vaderSentiment", "nltk")
$missingPackages = @()

foreach ($package in $requiredPackages) {
    try {
        $check = python -c "import $package" 2>&1
        if ($check) {
            Write-Host "   ✅ $package" -ForegroundColor Green
        } else {
            Write-Host "   ✅ $package" -ForegroundColor Green
        }
    } catch {
        Write-Host "   ❌ $package - MISSING" -ForegroundColor Red
        $missingPackages += $package
    }
}

if ($missingPackages.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠️  Missing packages detected! Installing..." -ForegroundColor Yellow
    Write-Host ""
    
    # Install missing packages
    $packageList = $missingPackages -join " "
    Write-Host "Running: pip install $packageList" -ForegroundColor Cyan
    Write-Host ""
    
    python -m pip install $missingPackages 2>&1 | Tee-Object -Variable pipOutput
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install packages!" -ForegroundColor Red
        Write-Host "You may need to install manually:" -ForegroundColor Yellow
        Write-Host "   pip install $packageList" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Packages installed successfully!" -ForegroundColor Green
}

# Step 3: Check for Codette files
Write-Host ""
Write-Host "🔍 Step 3: Checking Codette Installation..." -ForegroundColor Yellow
$codettePath = Join-Path $projectRoot "Codette"

if (Test-Path "$codettePath\codette.py") {
    Write-Host "✅ Codette.py found at: $codettePath\codette.py" -ForegroundColor Green
} else {
    Write-Host "❌ Codette.py not found at: $codettePath\codette.py" -ForegroundColor Red
    Write-Host "   Please ensure Codette folder exists with codette.py file" -ForegroundColor Yellow
}

# Step 4: Check for server script
Write-Host ""
Write-Host "🔍 Step 4: Checking Server Script..." -ForegroundColor Yellow
$serverScript = Join-Path $projectRoot "codette_server.py"

if (Test-Path $serverScript) {
    Write-Host "✅ Server script found: $serverScript" -ForegroundColor Green
} else {
    Write-Host "❌ Server script not found: $serverScript" -ForegroundColor Red
    exit 1
}

# Step 5: Set environment variables
Write-Host ""
Write-Host "⚙️  Step 5: Setting Environment Variables..." -ForegroundColor Yellow
$env:CODETTE_PORT = $Port
$env:CODETTE_HOST = $Host
$env:PYTHONUNBUFFERED = "1"

Write-Host "   CODETTE_PORT: $Port" -ForegroundColor Cyan
Write-Host "   CODETTE_HOST: $Host" -ForegroundColor Cyan
Write-Host "   PYTHONUNBUFFERED: 1" -ForegroundColor Cyan

# Step 6: Start server
Write-Host ""
Write-Host "🚀 Step 6: Starting Codette Backend Server..." -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

try {
    if ($Debug) {
        Write-Host "Debug mode enabled - showing all output" -ForegroundColor Cyan
        Write-Host ""
        python -u $serverScript
    } else {
        # Normal mode with cleaner output
        $serverProcess = Start-Process python -ArgumentList "-u", $serverScript -PassThru -NoNewWindow -ErrorAction Continue
        
        # Give server time to start
        Start-Sleep -Seconds 2
        
        if ($serverProcess.HasExited) {
            Write-Host "❌ Server failed to start" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "✅ Server started successfully! (PID: $($serverProcess.Id))" -ForegroundColor Green
        Write-Host ""
        Write-Host "📡 Codette Backend Server is now running:" -ForegroundColor Green
        Write-Host "   URL: http://$Host`:$Port" -ForegroundColor Cyan
        Write-Host "   Health: http://$Host`:$Port/health" -ForegroundColor Cyan
        Write-Host "   Docs: http://$Host`:$Port/docs" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Frontend configuration:" -ForegroundColor Green
        Write-Host "   Add to .env.local: VITE_CODETTE_API_URL=http://$Host`:$Port" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
        Write-Host ""
        
        # Keep the process running
        $serverProcess.WaitForExit()
    }
} catch {
    Write-Host "❌ Error starting server: $_" -ForegroundColor Red
    exit 1
}
