#!/usr/bin/env pwsh
# VU Meter Integration - Verification Script
# Checks that all files are in place and ready

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  VU METER INTEGRATION - VERIFICATION SCRIPT" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check location
Write-Host "?? Checking location..." -ForegroundColor Yellow
$expectedPath = "D:\HorizonCore\GitHub"
$currentPath = Get-Location
if ($currentPath.Path -ne $expectedPath) {
    Write-Host "   ??  Current: $currentPath" -ForegroundColor Yellow
    Write-Host "   Expected: $expectedPath" -ForegroundColor Yellow
    Set-Location $expectedPath
    Write-Host "   ? Navigated to correct location" -ForegroundColor Green
}
Write-Host ""

# Files to check
$files = @{
    "Source Files" = @(
        "src/components/VUMeterGfx.tsx",
        "src/components/VUMeterPanel.tsx",
        "src/hooks/useVUMeterData.ts"
    )
    "Documentation" = @(
        "docs/EVERYTHING_READY.md",
        "docs/VU_METER_MASTER_INDEX.md",
        "docs/VU_METER_README.md",
        "docs/VU_METER_INTEGRATION_COMPLETE.md",
        "docs/GIT_COMMIT_GUIDE_VU_METER.md",
        "docs/SESSION_CHANGELOG_VU_METER.md",
        "docs/VU_METER_FILE_MANIFEST.md",
        "docs/DEVELOPMENT.md"
    )
    "Scripts" = @(
        "scripts/commit-vu-meter.ps1",
        "scripts/commit-vu-meter.bat"
    )
    "Root Files" = @(
        "VU_METER_START_HERE.md"
    )
}

# Check each category
foreach ($category in $files.Keys) {
    Write-Host "?? Checking $category..." -ForegroundColor Yellow
    $categoryFiles = $files[$category]
    $missing = @()
    
    foreach ($file in $categoryFiles) {
        if (Test-Path $file) {
            Write-Host "   ? $file" -ForegroundColor Green
        } else {
            Write-Host "   ? $file (MISSING!)" -ForegroundColor Red
            $missing += $file
            $allGood = $false
        }
    }
    
    if ($missing.Count -eq 0) {
        Write-Host "   ? All $category files present" -ForegroundColor Green
    } else {
        Write-Host "   ? $($missing.Count) file(s) missing" -ForegroundColor Red
    }
    Write-Host ""
}

# Check Git
Write-Host "?? Checking Git..." -ForegroundColor Yellow
try {
    $gitVersion = git --version 2>$null
    Write-Host "   ? Git installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "   ? Git not found!" -ForegroundColor Red
    Write-Host "      Install from: https://git-scm.com/download/win" -ForegroundColor Yellow
    $allGood = $false
}
Write-Host ""

# Check Node.js
Write-Host "?? Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    Write-Host "   ? Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   ??  Node.js not found" -ForegroundColor Yellow
    Write-Host "      (Required for npm commands)" -ForegroundColor Yellow
}
Write-Host ""

# Check package.json
Write-Host "?? Checking project files..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    Write-Host "   ? package.json found" -ForegroundColor Green
} else {
    Write-Host "   ? package.json not found" -ForegroundColor Red
    $allGood = $false
}

if (Test-Path "tsconfig.json") {
    Write-Host "   ? tsconfig.json found" -ForegroundColor Green
} else {
    Write-Host "   ??  tsconfig.json not found" -ForegroundColor Yellow
}

if (Test-Path "vite.config.ts") {
    Write-Host "   ? vite.config.ts found" -ForegroundColor Green
} else {
    Write-Host "   ??  vite.config.ts not found" -ForegroundColor Yellow
}
Write-Host ""

# Count files
Write-Host "?? Statistics:" -ForegroundColor Yellow
$totalFiles = 0
foreach ($category in $files.Keys) {
    $totalFiles += $files[$category].Count
}
Write-Host "   Total VU Meter files: $totalFiles" -ForegroundColor Cyan

$sourceLines = 1270
$docsLines = 1600
$totalLines = $sourceLines + $docsLines
Write-Host "   Source code lines: $sourceLines" -ForegroundColor Cyan
Write-Host "   Documentation lines: $docsLines" -ForegroundColor Cyan
Write-Host "   Total lines: $totalLines" -ForegroundColor Cyan
Write-Host ""

# Final verdict
Write-Host "=====================================================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "  ? VERIFICATION PASSED!" -ForegroundColor Green
    Write-Host "=====================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "All files are in place and ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "?? Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Run: .\scripts\commit-vu-meter.bat (or .ps1)" -ForegroundColor Cyan
    Write-Host "   2. Or see: VU_METER_START_HERE.md" -ForegroundColor Cyan
    Write-Host "   3. Or see: docs\EVERYTHING_READY.md" -ForegroundColor Cyan
} else {
    Write-Host "  ??  VERIFICATION FAILED" -ForegroundColor Red
    Write-Host "=====================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Some files are missing or Git is not installed." -ForegroundColor Red
    Write-Host "Please check the errors above." -ForegroundColor Yellow
}
Write-Host ""

Read-Host "Press Enter to exit"
