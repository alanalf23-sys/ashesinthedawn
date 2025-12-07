#!/usr/bin/env pwsh
# CoreLogic Studio - Safe Cleanup Script
# Removes temporary files and build artifacts safely

$ErrorActionPreference = "Continue"

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  CORELOGIC STUDIO - SAFE CLEANUP" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to project root
Set-Location "D:\HorizonCore\GitHub"
Write-Host "?? Project directory: $(Get-Location)" -ForegroundColor Green
Write-Host ""

$removed = 0
$savedSpace = 0

# Function to remove with reporting
function Remove-ItemSafe {
    param($Path, $Description)
    if (Test-Path $Path) {
        try {
            $size = (Get-ChildItem $Path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
            Remove-Item $Path -Recurse -Force -ErrorAction Stop
            $script:removed++
            $script:savedSpace += $size
            Write-Host "   ? Removed $Description" -ForegroundColor Green
            return $true
        } catch {
            Write-Host "   ??  Could not remove $Description : $($_.Exception.Message)" -ForegroundColor Yellow
            return $false
        }
    }
    return $false
}

Write-Host "?? Cleaning temporary files..." -ForegroundColor Yellow
Write-Host ""

# 1. Remove duplicate text file
Write-Host "?? Removing duplicate files..." -ForegroundColor Cyan
Remove-ItemSafe "QUICK_START.txt" "QUICK_START.txt (use .md version)"
Remove-ItemSafe "BUILD_SUMMARY.md" "BUILD_SUMMARY.md (use BUILD_GUIDE.md)"
Remove-ItemSafe "COMMIT_NOW.md" "COMMIT_NOW.md (moved to docs/)"
Write-Host ""

# 2. Remove build artifacts
Write-Host "?? Removing build artifacts..." -ForegroundColor Cyan
Remove-ItemSafe "dist" "dist/ (build output)"
Remove-ItemSafe ".vite-temp" ".vite-temp/ (Vite cache)"
Remove-ItemSafe "TestResults" "TestResults/ (test output)"
Write-Host ""

# 3. Remove Python cache
Write-Host "?? Removing Python cache..." -ForegroundColor Cyan
$pycache = Get-ChildItem -Recurse -Directory -Filter "__pycache__" -ErrorAction SilentlyContinue
$pycacheCount = ($pycache | Measure-Object).Count
if ($pycacheCount -gt 0) {
    $pycache | ForEach-Object {
        Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
    }
    $removed += $pycacheCount
    Write-Host "   ? Removed $pycacheCount __pycache__ folders" -ForegroundColor Green
}

$pyc = Get-ChildItem -Recurse -Include "*.pyc","*.pyo","*.pyd" -ErrorAction SilentlyContinue
$pycCount = ($pyc | Measure-Object).Count
if ($pycCount -gt 0) {
    $pyc | Remove-Item -Force -ErrorAction SilentlyContinue
    $removed += $pycCount
    Write-Host "   ? Removed $pycCount .pyc files" -ForegroundColor Green
}
Write-Host ""

# 4. Remove log files
Write-Host "?? Removing log files..." -ForegroundColor Cyan
$logs = Get-ChildItem -Recurse -Include "*.log" -ErrorAction SilentlyContinue
$logCount = ($logs | Measure-Object).Count
if ($logCount -gt 0) {
    $logs | Remove-Item -Force -ErrorAction SilentlyContinue
    $removed += $logCount
    Write-Host "   ? Removed $logCount log files" -ForegroundColor Green
}
Write-Host ""

# 5. Remove VS cache
Write-Host "?? Removing Visual Studio cache..." -ForegroundColor Cyan
Remove-ItemSafe ".vs" ".vs/ (Visual Studio cache)"
$vsidx = Get-ChildItem -Recurse -Include "*.vsidx" -ErrorAction SilentlyContinue
if (($vsidx | Measure-Object).Count -gt 0) {
    $vsidx | Remove-Item -Force -ErrorAction SilentlyContinue
    Write-Host "   ? Removed .vsidx files" -ForegroundColor Green
}
Write-Host ""

# 6. Remove temporary database files
Write-Host "?? Removing temporary database files..." -ForegroundColor Cyan
$dbFiles = Get-ChildItem -Recurse -Include "*.sqlite-shm","*.sqlite-wal" -ErrorAction SilentlyContinue
$dbCount = ($dbFiles | Measure-Object).Count
if ($dbCount -gt 0) {
    $dbFiles | Remove-Item -Force -ErrorAction SilentlyContinue
    $removed += $dbCount
    Write-Host "   ? Removed $dbCount temp database files" -ForegroundColor Green
}
Write-Host ""

# Summary
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "?? Summary:" -ForegroundColor Yellow
Write-Host "   Items removed: $removed" -ForegroundColor Cyan
Write-Host "   Space saved: $([math]::Round($savedSpace/1MB, 2)) MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "? Safe cleanup complete!" -ForegroundColor Green
Write-Host "   Your source code and documentation are intact." -ForegroundColor Gray
Write-Host ""
Write-Host "?? Next steps:" -ForegroundColor Yellow
Write-Host "   1. Check docs/MASTER_INDEX.md for organized documentation" -ForegroundColor Cyan
Write-Host "   2. Run 'npm install' if node_modules was affected" -ForegroundColor Cyan
Write-Host "   3. Review CLEANUP_PLAN.md for aggressive cleanup options" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to exit"
