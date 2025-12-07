#!/usr/bin/env pwsh
# VU Meter GFX Integration - Complete Git Commit Script
# Run this script to commit all VU Meter files to Git

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  VU METER GFX INTEGRATION - GIT COMMIT SCRIPT" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to repository
Write-Host "?? Navigating to repository..." -ForegroundColor Yellow
Set-Location "D:\HorizonCore\GitHub"
Write-Host "   Current directory: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# Check if Git is installed
Write-Host "?? Checking Git installation..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "   ? Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "   ? Git not found!" -ForegroundColor Red
    Write-Host "   Please install Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "   Then restart this script." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

# Check Git status
Write-Host "?? Checking Git status..." -ForegroundColor Yellow
git status --short
Write-Host ""

# List files to be added
Write-Host "?? Files to be committed:" -ForegroundColor Yellow
$files = @(
    "src/components/VUMeterGfx.tsx",
    "src/components/VUMeterPanel.tsx",
    "src/hooks/useVUMeterData.ts",
    "docs/VU_METER_README.md",
    "docs/VU_METER_INTEGRATION_COMPLETE.md",
    "docs/GIT_COMMIT_GUIDE_VU_METER.md",
    "docs/SESSION_CHANGELOG_VU_METER.md",
    "docs/VU_METER_FILE_MANIFEST.md",
    "docs/VU_METER_MASTER_INDEX.md",
    "docs/EVERYTHING_READY.md",
    "docs/DEVELOPMENT.md",
    "scripts/commit-vu-meter.ps1",
    "scripts/commit-vu-meter.bat"
)

$existingFiles = @()
$missingFiles = @()

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   ? $file" -ForegroundColor Green
        $existingFiles += $file
    } else {
        Write-Host "   ? $file (MISSING!)" -ForegroundColor Red
        $missingFiles += $file
    }
}
Write-Host ""

# Check if all files exist
if ($missingFiles.Count -gt 0) {
    Write-Host "??  WARNING: Some files are missing!" -ForegroundColor Red
    Write-Host "   Missing files:" -ForegroundColor Red
    foreach ($file in $missingFiles) {
        Write-Host "   - $file" -ForegroundColor Red
    }
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne 'y') {
        Write-Host "Aborted." -ForegroundColor Yellow
        exit 1
    }
}

# Add files to Git
Write-Host "? Adding files to Git..." -ForegroundColor Yellow
foreach ($file in $existingFiles) {
    git add $file
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ? Added: $file" -ForegroundColor Green
    } else {
        Write-Host "   ? Failed to add: $file" -ForegroundColor Red
    }
}
Write-Host ""

# Show staged files
Write-Host "?? Staged files:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Confirm commit
Write-Host "?? Ready to commit!" -ForegroundColor Yellow
Write-Host "   Files: $($existingFiles.Count)" -ForegroundColor Cyan
Write-Host "   Lines: 2,870+ (code + docs)" -ForegroundColor Cyan
Write-Host ""

$confirm = Read-Host "Proceed with commit? (y/n)"
if ($confirm -ne 'y') {
    Write-Host "Aborted. Files remain staged." -ForegroundColor Yellow
    exit 0
}

# Commit message
$commitMessage = @"
feat: Add VU Meter GFX integration (JSFX?React/TypeScript)

- Implement VUMeterGfx component (1,050 lines)
  * Exact JSFX formula preservation
  * Canvas-based rendering with 60 FPS animation
  * Dual stereo meters (LEFT/RIGHT channels)
  * RMS and peak displays with clip indicators
  
- Add VUMeterPanel wrapper component (150 lines)
  * Audio engine integration
  * Response time and release controls
  * Settings panel with sliders
  
- Create useVUMeterData hook (70 lines)
  * Real-time audio level extraction
  * RMS and peak calculations per channel
  
- Add comprehensive documentation (6 docs)
  * Integration guide, Git guide, session log
  * File manifest, master index, developer guide update
  
Original JSFX: VU Meter by Liteon (GPL)
Total: 2,870+ lines (code + docs)
"@

# Commit
Write-Host ""
Write-Host "?? Committing..." -ForegroundColor Yellow
git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ? Commit successful!" -ForegroundColor Green
} else {
    Write-Host "   ? Commit failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

# Push to remote
Write-Host "?? Push to remote?" -ForegroundColor Yellow
Write-Host "   Remote: origin (https://github.com/alanalf23-sys/ashesinthedawn)" -ForegroundColor Cyan
Write-Host ""

$push = Read-Host "Push to GitHub? (y/n)"
if ($push -eq 'y') {
    Write-Host ""
    Write-Host "?? Pushing to origin main..." -ForegroundColor Yellow
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ? Push successful!" -ForegroundColor Green
    } else {
        Write-Host "   ? Push failed!" -ForegroundColor Red
        Write-Host "   You may need to pull first or check credentials." -ForegroundColor Yellow
    }
} else {
    Write-Host "   Skipped. Run 'git push origin main' manually." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  ? VU METER INTEGRATION COMMITTED!" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "?? Summary:" -ForegroundColor Yellow
Write-Host "   Files committed: $($existingFiles.Count)" -ForegroundColor Cyan
Write-Host "   Lines of code: 1,270" -ForegroundColor Cyan
Write-Host "   Lines of docs: 1,600+" -ForegroundColor Cyan
Write-Host "   Total lines: 2,900+" -ForegroundColor Cyan
Write-Host ""
Write-Host "?? Documentation:" -ForegroundColor Yellow
Write-Host "   - EVERYTHING_READY.md (?? START HERE!)" -ForegroundColor Green
Write-Host "   - VU_METER_MASTER_INDEX.md (navigation hub)" -ForegroundColor Cyan
Write-Host "   - VU_METER_README.md (quick start)" -ForegroundColor Cyan
Write-Host "   - VU_METER_INTEGRATION_COMPLETE.md (API reference)" -ForegroundColor Cyan
Write-Host ""
Write-Host "?? Next steps:" -ForegroundColor Yellow
Write-Host "   1. Run: npm run typecheck" -ForegroundColor Cyan
Write-Host "   2. Run: npm run dev" -ForegroundColor Cyan
Write-Host "   3. Test VU meters in browser" -ForegroundColor Cyan
Write-Host "   4. Integrate into Mixer.tsx" -ForegroundColor Cyan
Write-Host ""
Write-Host "Happy coding! ??" -ForegroundColor Green
Write-Host ""

Read-Host "Press Enter to exit"
