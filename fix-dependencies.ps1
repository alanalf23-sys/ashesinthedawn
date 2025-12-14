# CoreLogic Studio - Dependency Fix Script
# Run this if you encounter "Cannot find module" errors

Write-Host "`n?? CoreLogic Studio - Dependency Repair`n" -ForegroundColor Cyan

# Clean node_modules
if (Test-Path "node_modules") {
    Write-Host "?? Removing corrupted node_modules..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force node_modules
    Write-Host "? Cleaned" -ForegroundColor Green
} else {
    Write-Host "??  No node_modules found" -ForegroundColor Gray
}

# Clean package-lock
if (Test-Path "package-lock.json") {
    Write-Host "?? Removing package-lock.json..." -ForegroundColor Yellow
    Remove-Item -Force package-lock.json
    Write-Host "? Cleaned" -ForegroundColor Green
}

# Clean Vite cache
if (Test-Path "node_modules\.vite") {
    Write-Host "?? Removing Vite cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules\.vite"
    Write-Host "? Cleaned" -ForegroundColor Green
}

# Reinstall dependencies
Write-Host "`n?? Reinstalling all dependencies..." -ForegroundColor Yellow
npm install --legacy-peer-deps

if ($LASTEXITCODE -ne 0) {
    Write-Host "??  Legacy install failed, trying with --force..." -ForegroundColor Yellow
    npm install --force
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n? Installation failed!" -ForegroundColor Red
    Write-Host "Try running: npm cache clean --force" -ForegroundColor Yellow
    exit 1
}

# Verify critical dependencies
Write-Host "`n?? Verifying installation..." -ForegroundColor Yellow

$criticalDeps = @(
    "fraction.js",
    "tailwindcss", 
    "postcss",
    "autoprefixer",
    "react",
    "vite"
)

$missing = @()
foreach ($dep in $criticalDeps) {
    if (-not (Test-Path "node_modules\$dep")) {
        $missing += $dep
        Write-Host "  ? Missing: $dep" -ForegroundColor Red
    } else {
        Write-Host "  ? Found: $dep" -ForegroundColor Green
    }
}

if ($missing.Count -gt 0) {
    Write-Host "`n??  Some dependencies are missing. Installing them now..." -ForegroundColor Yellow
    npm install $missing --save-dev --legacy-peer-deps
}

Write-Host "`n? DEPENDENCIES FIXED!" -ForegroundColor Green
Write-Host "`nYou can now run: .\start-all.ps1`n" -ForegroundColor Cyan
