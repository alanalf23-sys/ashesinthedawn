#!/usr/bin/env pwsh
# CoreLogic Studio - Development Server Launcher (PowerShell)
# Automatically uses D:\Program Files\nodejs installation

$ErrorActionPreference = "Continue"

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  CORELOGIC STUDIO - DEVELOPMENT SERVER" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "[!] Not running as Administrator" -ForegroundColor Yellow
    Write-Host "[!] Attempting to restart with elevated privileges..." -ForegroundColor Yellow
    Write-Host ""
    
    # Restart as Administrator
    Start-Process powershell -Verb RunAs -ArgumentList "-NoExit", "-File", $PSCommandPath
    exit
}

Write-Host "[OK] Running as Administrator" -ForegroundColor Green
Write-Host ""

# Navigate to project
Write-Host "Navigating to project directory..." -ForegroundColor Yellow
Set-Location "D:\HorizonCore\GitHub"
Write-Host "[OK] Project directory: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# Set Node.js paths
$nodePath = "D:\Program Files\nodejs"
$nodeExe = Join-Path $nodePath "node.exe"
$npmCmd = Join-Path $nodePath "npm.cmd"

# Check Node.js installation
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
if (Test-Path $nodeExe) {
    Write-Host "[OK] Node.js found: $nodeExe" -ForegroundColor Green
    $nodeVersion = & $nodeExe --version
    Write-Host "   Version: $nodeVersion" -ForegroundColor Cyan
} else {
    Write-Host "[ERROR] Node.js not found at: $nodeExe" -ForegroundColor Red
    Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

# Check npm
Write-Host "Checking npm..." -ForegroundColor Yellow
if (Test-Path $npmCmd) {
    Write-Host "[OK] npm found: $npmCmd" -ForegroundColor Green
    $npmVersion = & $npmCmd --version
    Write-Host "   Version: $npmVersion" -ForegroundColor Cyan
} else {
    Write-Host "[ERROR] npm not found at: $npmCmd" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

# Check dependencies
Write-Host "Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    $packageCount = (Get-ChildItem "node_modules" -Directory).Count
    Write-Host "[OK] node_modules folder exists ($packageCount packages)" -ForegroundColor Green
    
    # Check if vite is installed
    if (-not (Test-Path "node_modules\vite")) {
        Write-Host "[!] Vite not found, reinstalling dependencies..." -ForegroundColor Yellow
        & $npmCmd install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
            Read-Host "Press Enter to exit"
            exit 1
        }
    }
} else {
    Write-Host "[!] node_modules not found, installing dependencies..." -ForegroundColor Yellow
    & $npmCmd install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}
Write-Host ""

# Start development server
Write-Host "Starting Vite development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  Press Ctrl+C to stop the server" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# Run npm dev
& $npmCmd run dev

# If server exits with error
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] Development server exited with error code: $LASTEXITCODE" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common solutions:" -ForegroundColor Yellow
    Write-Host "  1. Check if port 5173 is already in use" -ForegroundColor Gray
    Write-Host "  2. Try: npm install --force" -ForegroundColor Gray
    Write-Host "  3. Delete node_modules and package-lock.json, then reinstall" -ForegroundColor Gray
    Write-Host ""
    Read-Host "Press Enter to exit"
}
