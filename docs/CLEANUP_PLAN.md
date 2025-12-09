# ?? Project Cleanup - Action Plan

**Date**: December 7, 2024  
**Status**: Ready to Execute  
**Impact**: Remove 214+ duplicate files, organize structure

---

## ?? Cleanup Summary

### Files to Remove
- **214+ duplicate documentation files**
- **3 duplicate/obsolete folders**
- **Temporary build artifacts**

### Files to Keep
- **35 core documentation files**
- **All source code** (src/)
- **All scripts** (scripts/)
- **Core configuration files**

---

## ?? Step-by-Step Cleanup

### Phase 1: Remove Duplicate Folders ?? **MANUAL REVIEW REQUIRED**

These folders contain duplicates or obsolete files:

```powershell
# 1. doc/ folder (duplicate of docs/)
Remove-Item "doc" -Recurse -Force -ErrorAction SilentlyContinue

# 2. ashesinthedawn-main/ folder (old project copy - already in Git)
Remove-Item "ashesinthedawn-main" -Recurse -Force -ErrorAction SilentlyContinue

# 3. npm instal/ folder (typo folder from failed install)
Remove-Item "npm instal" -Recurse -Force -ErrorAction SilentlyContinue
```

**?? CAUTION**: Before running, verify these folders don't contain unique files:
```powershell
# Check for unique files in doc/
Get-ChildItem "doc" -Recurse -File | Where-Object { -not (Test-Path "docs\$($_.Name)") }

# Check for unique files in ashesinthedawn-main/
Get-ChildItem "ashesinthedawn-main" -Recurse -File -Include "*.ts","*.tsx","*.py" | Select-Object Name
```

### Phase 2: Consolidate Root Files

Keep only one of each:

| Current Files | Action | Keep |
|---------------|--------|------|
| QUICK_START.md, QUICK_START.txt | Keep .md, remove .txt | QUICK_START.md |
| Multiple CODETTE_QUICK_START*.md | Keep docs/CODETTE_QUICK_START.md | Move to docs/ |
| BUILD_GUIDE.md, BUILD_SUMMARY.md | Keep BUILD_GUIDE.md | Root |
| COMMIT_NOW.md, FINAL_COMMIT_CHECKLIST.md | Keep docs/FINAL_COMMIT_CHECKLIST.md | Move to docs/ |

```powershell
# Remove duplicate root files
Remove-Item "QUICK_START.txt" -Force
Remove-Item "BUILD_SUMMARY.md" -Force
Remove-Item "COMMIT_NOW.md" -Force

# Move Codette files to docs/
if (Test-Path "CODETTE_QUICK_START.md") {
    if (-not (Test-Path "docs\CODETTE_QUICK_START.md")) {
        Move-Item "CODETTE_QUICK_START.md" "docs\CODETTE_QUICK_START.md" -Force
    } else {
        Remove-Item "CODETTE_QUICK_START.md" -Force
    }
}
```

### Phase 3: Clean Up Temporary Files

```powershell
# Remove build artifacts
Remove-Item "dist" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item ".vite-temp" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "__pycache__" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "*.pyc" -Recurse -Force -ErrorAction SilentlyContinue

# Remove test results (can be regenerated)
Remove-Item "TestResults" -Recurse -Force -ErrorAction SilentlyContinue

# Remove logs (keep directory structure)
Get-ChildItem -Recurse -Include "*.log" | Remove-Item -Force
```

### Phase 4: Fix node_modules Permissions

```powershell
# Option A: Delete and reinstall (if locked)
if (Test-Path "node_modules") {
    Remove-Item "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
    & "D:\Program Files\nodejs\npm.cmd" install
}

# Option B: Fix permissions (if partially locked)
icacls "node_modules" /grant Everyone:F /T /C /Q
```

---

## ?? Automated Cleanup Script

### Safe Cleanup (Recommended)

Run this script to clean up safely:

```powershell
# Navigate to project root
cd D:\HorizonCore\GitHub

Write-Host "?? Starting Safe Cleanup..." -ForegroundColor Cyan

# 1. Remove duplicate txt file
if (Test-Path "QUICK_START.txt") {
    Remove-Item "QUICK_START.txt" -Force
    Write-Host "? Removed QUICK_START.txt" -ForegroundColor Green
}

# 2. Remove build artifacts
@("dist", ".vite-temp", "TestResults") | ForEach-Object {
    if (Test-Path $_) {
        Remove-Item $_ -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "? Removed $_" -ForegroundColor Green
    }
}

# 3. Remove Python cache
Get-ChildItem -Recurse -Directory -Filter "__pycache__" | Remove-Item -Recurse -Force
Write-Host "? Removed __pycache__ folders" -ForegroundColor Green

# 4. Remove log files
$logs = Get-ChildItem -Recurse -Include "*.log"
$logs | Remove-Item -Force
Write-Host "? Removed $($logs.Count) log files" -ForegroundColor Green

Write-Host "?? Safe cleanup complete!" -ForegroundColor Green
```

### Aggressive Cleanup (Use with Caution)

```powershell
# WARNING: This removes duplicate folders
cd D:\HorizonCore\GitHub

Write-Host "??  Starting Aggressive Cleanup..." -ForegroundColor Yellow
Write-Host "This will remove duplicate folders!" -ForegroundColor Yellow
$confirm = Read-Host "Type 'YES' to continue"

if ($confirm -eq "YES") {
    # Remove duplicate folders
    @("doc", "ashesinthedawn-main", "npm instal") | ForEach-Object {
        if (Test-Path $_) {
            Remove-Item $_ -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "? Removed $_/" -ForegroundColor Green
        }
    }
    
    Write-Host "?? Aggressive cleanup complete!" -ForegroundColor Green
} else {
    Write-Host "? Cleanup cancelled" -ForegroundColor Red
}
```

---

## ?? Expected Results

### Before Cleanup
```
Total Files: 5,000+
Documentation: 249+ files (duplicates everywhere)
Project Size: ~500 MB
```

### After Cleanup
```
Total Files: ~2,000
Documentation: ~35 files (organized in docs/)
Project Size: ~300 MB
Savings: ~200 MB
```

---

## ? Verification Steps

After cleanup, verify:

```powershell
# 1. Check documentation structure
Get-ChildItem "docs" -File | Measure-Object
# Should show ~35 files

# 2. Check no duplicates in root
Get-ChildItem -File "QUICK_START*", "CODETTE*", "BUILD*"
# Should show only essential files

# 3. Check scripts work
.\scripts\run-dev.ps1 --help
# Should not error

# 4. Check Git status
git status
# Should not show deleted tracked files
```

---

## ?? Rollback Plan

If cleanup causes issues:

```powershell
# Restore from Git
git checkout -- .

# Or restore specific folders
git checkout -- docs/
git checkout -- scripts/
```

---

## ?? Manual Review Checklist

Before running aggressive cleanup:

- [ ] Verify no unique files in `doc/` folder
- [ ] Confirm `ashesinthedawn-main/` is a duplicate
- [ ] Check `npm instal/` contains only error artifacts
- [ ] Backup any custom scripts in obsolete folders
- [ ] Review Git history for important files

---

## ?? Recommended Action

### Option 1: Safe Cleanup (Recommended)
Run the safe cleanup script above - removes only temporary files and obvious duplicates.

### Option 2: Aggressive Cleanup
After manual verification, run aggressive cleanup to remove duplicate folders.

### Option 3: Manual Cleanup
Review each folder individually and delete manually.

---

**Status**: ? Plan Ready  
**Recommended**: Start with Safe Cleanup  
**Est. Time**: 2-5 minutes  
**Savings**: ~200 MB disk space
