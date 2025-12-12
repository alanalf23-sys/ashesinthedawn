#!/usr/bin/env pwsh
# Quick setup script for Codette environment

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Codette Environment Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if .env exists
$envFile = "Codette\.env"
$exampleFile = "Codette\.env.example"

Write-Host "[1] Checking .env file..." -ForegroundColor Yellow

if (Test-Path $envFile) {
    Write-Host "    ? .env exists at: $envFile" -ForegroundColor Green
    Write-Host "    ??  Your configuration is already set up" -ForegroundColor Cyan
} else {
    Write-Host "    ? .env not found" -ForegroundColor Red
    
    if (Test-Path $exampleFile) {
        Write-Host "    ?? Copying .env.example to .env..." -ForegroundColor Yellow
        Copy-Item $exampleFile $envFile
        Write-Host "    ? Created .env from template" -ForegroundColor Green
        Write-Host "    ??  IMPORTANT: Edit $envFile with your settings" -ForegroundColor Yellow
    } else {
        Write-Host "    ? .env.example not found either!" -ForegroundColor Red
        Write-Host "    Please create $envFile manually" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Step 2: Check .gitignore
Write-Host "[2] Checking .gitignore..." -ForegroundColor Yellow

if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    if ($gitignoreContent -match "\.env") {
        Write-Host "    ? .env is in .gitignore" -ForegroundColor Green
    } else {
        Write-Host "    ??  .env not found in .gitignore" -ForegroundColor Yellow
        Write-Host "    Adding .env to .gitignore..." -ForegroundColor Yellow
        Add-Content ".gitignore" "`n# Environment`n.env`n.env.local`n.env.*.local"
        Write-Host "    ? Added .env to .gitignore" -ForegroundColor Green
    }
} else {
    Write-Host "    ??  .gitignore not found" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Run verification
Write-Host "[3] Verifying environment..." -ForegroundColor Yellow
Write-Host "    Running: python verify_env.py" -ForegroundColor Gray
Write-Host ""

try {
    python verify_env.py
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  ? Setup Complete!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Yellow
        Write-Host "  ??  Setup completed with warnings" -ForegroundColor Yellow
        Write-Host "========================================" -ForegroundColor Yellow
    }
} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ? Verification failed" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Edit $envFile if needed" -ForegroundColor White
Write-Host "  2. Start backend: python codette_server_unified.py" -ForegroundColor White
Write-Host "  3. Start frontend: npm run dev" -ForegroundColor White
Write-Host ""
