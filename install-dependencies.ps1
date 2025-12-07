# CoreLogic Studio - Dependency Installation Script
# Installs both frontend (Node.js) and backend (Python) dependencies

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CoreLogic Studio - Dependency Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to project directory
Set-Location "D:\HorizonCore\GitHub"

# Check Node.js
Write-Host "[1/4] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "  ? Node.js installed: $nodeVersion" -ForegroundColor Green
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-Host "  ? Node.js not found" -ForegroundColor Red
    Write-Host "  ? Download from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "  ? Install LTS version (v20+)" -ForegroundColor Yellow
    Write-Host ""
    $installNode = Read-Host "Open download page? (y/n)"
    if ($installNode -eq "y") {
        Start-Process "https://nodejs.org/en/download/"
    }
    exit 1
}

# Check npm
Write-Host "[2/4] Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-Host "  ? npm installed: v$npmVersion" -ForegroundColor Green
    } else {
        throw "npm not found"
    }
} catch {
    Write-Host "  ? npm not found" -ForegroundColor Red
    exit 1
}

# Install frontend dependencies
Write-Host "[3/4] Installing frontend dependencies..." -ForegroundColor Yellow
Write-Host "  ? Running: npm install" -ForegroundColor Cyan
try {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ? Frontend dependencies installed successfully" -ForegroundColor Green
        
        # Count installed packages
        $packageCount = (Get-Content "node_modules\.package-lock.json" -Raw | ConvertFrom-Json).packages.PSObject.Properties.Count
        Write-Host "  ? Installed $packageCount packages" -ForegroundColor Cyan
    } else {
        throw "npm install failed"
    }
} catch {
    Write-Host "  ? Frontend installation failed" -ForegroundColor Red
    Write-Host "  ? Try running: npm cache clean --force" -ForegroundColor Yellow
    Write-Host "  ? Then run this script again" -ForegroundColor Yellow
    exit 1
}

# Check Python
Write-Host "[4/4] Checking Python..." -ForegroundColor Yellow
$pythonCmd = $null
try {
    $pythonVersion = python --version 2>$null
    if ($pythonVersion) {
        $pythonCmd = "python"
        Write-Host "  ? Python installed: $pythonVersion" -ForegroundColor Green
    }
} catch {
    try {
        $pythonVersion = py --version 2>$null
        if ($pythonVersion) {
            $pythonCmd = "py"
            Write-Host "  ? Python installed: $pythonVersion" -ForegroundColor Green
        }
    } catch {
        Write-Host "  ? Python not found" -ForegroundColor Red
        Write-Host "  ? Download from: https://python.org/downloads/" -ForegroundColor Yellow
        Write-Host "  ? Install version 3.10 or higher" -ForegroundColor Yellow
        Write-Host "  ? Make sure to check 'Add Python to PATH'" -ForegroundColor Yellow
        Write-Host ""
        $installPython = Read-Host "Open download page? (y/n)"
        if ($installPython -eq "y") {
            Start-Process "https://www.python.org/downloads/"
        }
        Write-Host ""
        Write-Host "Frontend dependencies installed successfully!" -ForegroundColor Green
        Write-Host "Install Python and run this script again to install backend dependencies." -ForegroundColor Yellow
        exit 0
    }
}

# Install Python dependencies
if ($pythonCmd) {
    Write-Host "  ? Installing Python packages..." -ForegroundColor Cyan
    
    $packages = @("fastapi", "uvicorn", "pydantic", "numpy", "scipy")
    
    foreach ($package in $packages) {
        Write-Host "    Installing $package..." -ForegroundColor Gray
        & $pythonCmd -m pip install $package --quiet
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    ? $package" -ForegroundColor Green
        } else {
            Write-Host "    ? $package failed" -ForegroundColor Red
        }
    }
    
    Write-Host "  ? Backend dependencies installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Open Terminal 1: python run_server.py" -ForegroundColor White
Write-Host "  2. Open Terminal 2: npm run dev" -ForegroundColor White
Write-Host "  3. Open browser: http://localhost:5173" -ForegroundColor White
Write-Host ""
