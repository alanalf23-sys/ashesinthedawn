# CoreLogic Studio - First-Time Setup Script
# Run this ONCE before starting the application

Write-Host "`n🔧 CoreLogic Studio - First-Time Setup`n" -ForegroundColor Cyan

# Check if venv exists
if (-not (Test-Path "venv\Scripts\Activate.ps1")) {
    Write-Host "❌ Virtual environment not found!" -ForegroundColor Red
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to create virtual environment" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Virtual environment created" -ForegroundColor Green
}

# Activate virtual environment
Write-Host "`n📦 Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# Upgrade pip
Write-Host "`n⬆️  Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upgrade pip" -ForegroundColor Red
    exit 1
}
Write-Host "✅ pip upgraded" -ForegroundColor Green

# Install Python dependencies
Write-Host "`n🐍 Installing Python dependencies (this may take 3-5 minutes)..." -ForegroundColor Yellow
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install Python dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Python dependencies installed" -ForegroundColor Green

# Clean node_modules if exists (fixes corrupted dependencies)
if (Test-Path "node_modules") {
    Write-Host "`n🧹 Cleaning existing node_modules..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force node_modules
    Write-Host "✅ Old dependencies removed" -ForegroundColor Green
}

# Clean package-lock.json if exists
if (Test-Path "package-lock.json") {
    Write-Host "🧹 Cleaning package-lock.json..." -ForegroundColor Yellow
    Remove-Item -Force package-lock.json
    Write-Host "✅ Lock file removed" -ForegroundColor Green
}

# Install Node.js dependencies with clean slate
Write-Host "`n📦 Installing Node.js dependencies (fresh install)..." -ForegroundColor Yellow
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install Node.js dependencies" -ForegroundColor Red
    Write-Host "ℹ️  Trying alternative install method..." -ForegroundColor Yellow
    npm install --force
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Node.js dependency installation failed" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Node.js dependencies installed" -ForegroundColor Green

# Verify critical dependencies
Write-Host "`n🔍 Verifying critical dependencies..." -ForegroundColor Yellow
$missingDeps = @()
if (-not (Test-Path "node_modules\fraction.js")) {
    $missingDeps += "fraction.js"
}
if (-not (Test-Path "node_modules\tailwindcss")) {
    $missingDeps += "tailwindcss"
}
if (-not (Test-Path "node_modules\postcss")) {
    $missingDeps += "postcss"
}

if ($missingDeps.Count -gt 0) {
    Write-Host "⚠️  Missing dependencies detected: $($missingDeps -join ', ')" -ForegroundColor Yellow
    Write-Host "Installing missing dependencies..." -ForegroundColor Yellow
    npm install fraction.js tailwindcss postcss autoprefixer --save-dev
    Write-Host "✅ Missing dependencies installed" -ForegroundColor Green
}

# Summary
Write-Host "`n✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "`n📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Run .\start-all.ps1 to start all services" -ForegroundColor White
Write-Host "   2. Open http://localhost:5173 in your browser" -ForegroundColor White
Write-Host "   3. Start creating music!`n" -ForegroundColor White
