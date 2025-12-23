# CoreLogic Studio - Validated Startup
# Codette-Aligned: Deterministic checks before execution
# Ensures system state is known before allowing operations

Write-Host "`n??????????????????????????????????????????????????????????????????" -ForegroundColor Cyan
Write-Host "?         CoreLogic Studio - Validated Startup System            ?" -ForegroundColor Cyan
Write-Host "?         Deterministic Pre-Flight Verification                  ?" -ForegroundColor Cyan
Write-Host "??????????????????????????????????????????????????????????????????" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"
$criticalFailures = @()
$warnings = @()
$validationState = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    pythonOk = $false
    nodeOk = $false
    venvOk = $false
    depsOk = $false
    portsOk = $false
    filesOk = $false
}

# ============================================================================
# PHASE 1: RUNTIME ENVIRONMENT VALIDATION
# ============================================================================

Write-Host "Phase 1: Runtime Environment" -ForegroundColor Yellow
Write-Host "????????????????????????????????????????????????????????????????" -ForegroundColor DarkGray

# Python Check
Write-Host "  [1/6] Python Runtime..." -NoNewline
try {
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        $versionMatch = [regex]::Match($pythonVersion, "(\d+)\.(\d+)")
        if ($versionMatch.Success) {
            $major = [int]$versionMatch.Groups[1].Value
            $minor = [int]$versionMatch.Groups[2].Value
            
            if ($major -ge 3 -and $minor -ge 11) {
                Write-Host " ? $pythonVersion" -ForegroundColor Green
                $validationState.pythonOk = $true
            } else {
                Write-Host " ??  $pythonVersion (recommend 3.11+)" -ForegroundColor Yellow
                $warnings += "Python version below 3.11"
                $validationState.pythonOk = $true
            }
        }
    } else {
        throw "Python not found"
    }
} catch {
    Write-Host " ? NOT FOUND" -ForegroundColor Red
    $criticalFailures += "Python 3.11+ required but not installed"
}

# Node.js Check
Write-Host "  [2/6] Node.js Runtime..." -NoNewline
try {
    $nodeVersion = node --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        $versionMatch = [regex]::Match($nodeVersion, "v(\d+)")
        if ($versionMatch.Success) {
            $major = [int]$versionMatch.Groups[1].Value
            
            if ($major -ge 18) {
                Write-Host " ? $nodeVersion" -ForegroundColor Green
                $validationState.nodeOk = $true
            } else {
                Write-Host " ??  $nodeVersion (recommend 18+)" -ForegroundColor Yellow
                $warnings += "Node.js version below 18"
                $validationState.nodeOk = $true
            }
        }
    } else {
        throw "Node not found"
    }
} catch {
    Write-Host " ? NOT FOUND" -ForegroundColor Red
    $criticalFailures += "Node.js 18+ required but not installed"
}

# Virtual Environment Check
Write-Host "  [3/6] Python Virtual Environment..." -NoNewline
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host " ? EXISTS" -ForegroundColor Green
    $validationState.venvOk = $true
} else {
    Write-Host " ? NOT FOUND" -ForegroundColor Red
    $criticalFailures += "Virtual environment missing - run setup-first-time.ps1"
}

# Python Dependencies Check
Write-Host "  [4/6] Python Dependencies..." -NoNewline
if ($validationState.venvOk) {
    $criticalPackages = @("fastapi", "uvicorn", "pydantic", "numpy")
    $missingPackages = @()
    
    foreach ($pkg in $criticalPackages) {
        if (-not (Test-Path "venv\Lib\site-packages\$pkg")) {
            $missingPackages += $pkg
        }
    }
    
    if ($missingPackages.Count -eq 0) {
        Write-Host " ? VERIFIED" -ForegroundColor Green
        $validationState.depsOk = $true
    } else {
        Write-Host " ? INCOMPLETE" -ForegroundColor Red
        $criticalFailures += "Missing Python packages: $($missingPackages -join ', ')"
    }
} else {
    Write-Host " ??  SKIPPED (no venv)" -ForegroundColor DarkGray
}

# Node Dependencies Check
Write-Host "  [5/6] Node Dependencies..." -NoNewline
if (Test-Path "node_modules") {
    $criticalModules = @("react", "vite", "tailwindcss", "fraction.js", "postcss")
    $missingModules = @()
    
    foreach ($mod in $criticalModules) {
        if (-not (Test-Path "node_modules\$mod")) {
            $missingModules += $mod
        }
    }
    
    if ($missingModules.Count -eq 0) {
        Write-Host " ? VERIFIED" -ForegroundColor Green
        $validationState.depsOk = $validationState.depsOk -and $true
    } else {
        Write-Host " ? INCOMPLETE" -ForegroundColor Red
        $criticalFailures += "Missing Node modules: $($missingModules -join ', ')"
    }
} else {
    Write-Host " ? NOT FOUND" -ForegroundColor Red
    $criticalFailures += "node_modules missing - run setup-first-time.ps1"
}

# Critical Files Check
Write-Host "  [6/6] Project Files..." -NoNewline
$requiredFiles = @(
    "codette_server_unified.py",
    "package.json",
    "requirements.txt",
    "vite.config.ts",
    "src\main.tsx"
)
$missingFiles = @()

foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -eq 0) {
    Write-Host " ? COMPLETE" -ForegroundColor Green
    $validationState.filesOk = $true
} else {
    Write-Host " ? INCOMPLETE" -ForegroundColor Red
    $criticalFailures += "Missing files: $($missingFiles -join ', ')"
}

Write-Host ""

# ============================================================================
# PHASE 2: NETWORK PORT AVAILABILITY
# ============================================================================

Write-Host "Phase 2: Network Port Availability" -ForegroundColor Yellow
Write-Host "????????????????????????????????????????????????????????????????" -ForegroundColor DarkGray

$portsOk = $true

# Check Port 8000 (Python Server)
Write-Host "  [1/2] Port 8000 (Python DSP)..." -NoNewline
$port8000 = netstat -ano | findstr ":8000.*LISTENING"
if ($port8000) {
    Write-Host " ??  IN USE" -ForegroundColor Yellow
    $warnings += "Port 8000 in use - server may already be running"
    $portsOk = $false
} else {
    Write-Host " ? AVAILABLE" -ForegroundColor Green
}

# Check Port 5173 (React Dev Server)
Write-Host "  [2/2] Port 5173 (React UI)..." -NoNewline
$port5173 = netstat -ano | findstr ":5173.*LISTENING"
if ($port5173) {
    Write-Host " ??  IN USE" -ForegroundColor Yellow
    $warnings += "Port 5173 in use - server may already be running"
    $portsOk = $false
} else {
    Write-Host " ? AVAILABLE" -ForegroundColor Green
}

$validationState.portsOk = $portsOk

Write-Host ""

# ============================================================================
# PHASE 3: VALIDATION RESULT
# ============================================================================

Write-Host "??????????????????????????????????????????????????????????????????" -ForegroundColor Cyan
Write-Host "?                    VALIDATION RESULTS                          ?" -ForegroundColor Cyan
Write-Host "??????????????????????????????????????????????????????????????????" -ForegroundColor Cyan
Write-Host ""

# System State Summary
Write-Host "System State:" -ForegroundColor White
Write-Host "  • Python Runtime:      $(if ($validationState.pythonOk) { '?' } else { '?' })" -ForegroundColor $(if ($validationState.pythonOk) { 'Green' } else { 'Red' })
Write-Host "  • Node.js Runtime:     $(if ($validationState.nodeOk) { '?' } else { '?' })" -ForegroundColor $(if ($validationState.nodeOk) { 'Green' } else { 'Red' })
Write-Host "  • Virtual Environment: $(if ($validationState.venvOk) { '?' } else { '?' })" -ForegroundColor $(if ($validationState.venvOk) { 'Green' } else { 'Red' })
Write-Host "  • Dependencies:        $(if ($validationState.depsOk) { '?' } else { '?' })" -ForegroundColor $(if ($validationState.depsOk) { 'Green' } else { 'Red' })
Write-Host "  • Network Ports:       $(if ($validationState.portsOk) { '?' } else { '?? ' })" -ForegroundColor $(if ($validationState.portsOk) { 'Green' } else { 'Yellow' })
Write-Host "  • Project Files:       $(if ($validationState.filesOk) { '?' } else { '?' })" -ForegroundColor $(if ($validationState.filesOk) { 'Green' } else { 'Red' })
Write-Host ""

# Critical Failures
if ($criticalFailures.Count -gt 0) {
    Write-Host "? CRITICAL FAILURES ($($criticalFailures.Count)):" -ForegroundColor Red
    foreach ($failure in $criticalFailures) {
        Write-Host "   • $failure" -ForegroundColor Red
    }
    Write-Host ""
}

# Warnings
if ($warnings.Count -gt 0) {
    Write-Host "??  WARNINGS ($($warnings.Count)):" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "   • $warning" -ForegroundColor Yellow
    }
    Write-Host ""
}

# ============================================================================
# PHASE 4: DECISION & ACTION
# ============================================================================

$canStart = ($criticalFailures.Count -eq 0)

if ($canStart) {
    Write-Host "??????????????????????????????????????????????????????????????????" -ForegroundColor Green
    Write-Host "?                  ? VALIDATION PASSED                          ?" -ForegroundColor Green
    Write-Host "??????????????????????????????????????????????????????????????????" -ForegroundColor Green
    Write-Host ""
    
    if ($warnings.Count -eq 0) {
        Write-Host "System state is known and verified." -ForegroundColor Green
        Write-Host "All preconditions met. Starting services..." -ForegroundColor Cyan
        Write-Host ""
        
        # Auto-start services
        Start-Sleep -Seconds 1
        & ".\start-all.ps1"
        
    } else {
        Write-Host "System state is known with warnings." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Do you want to proceed? (Y/N): " -NoNewline -ForegroundColor Cyan
        $response = Read-Host
        
        if ($response -eq 'Y' -or $response -eq 'y') {
            Write-Host ""
            Write-Host "Starting services with warnings acknowledged..." -ForegroundColor Cyan
            Start-Sleep -Seconds 1
            & ".\start-all.ps1"
        } else {
            Write-Host ""
            Write-Host "Startup cancelled by user." -ForegroundColor Yellow
            exit 0
        }
    }
    
} else {
    Write-Host "??????????????????????????????????????????????????????????????????" -ForegroundColor Red
    Write-Host "?                  ? VALIDATION FAILED                          ?" -ForegroundColor Red
    Write-Host "??????????????????????????????????????????????????????????????????" -ForegroundColor Red
    Write-Host ""
    
    Write-Host "System state is unknown or incomplete." -ForegroundColor Red
    Write-Host "Cannot proceed until critical failures are resolved." -ForegroundColor Red
    Write-Host ""
    
    # Suggest fixes
    Write-Host "?? Suggested Actions:" -ForegroundColor Cyan
    Write-Host ""
    
    if (-not $validationState.pythonOk -or -not $validationState.nodeOk) {
        Write-Host "  1. Install missing runtimes:" -ForegroundColor White
        if (-not $validationState.pythonOk) {
            Write-Host "     • Python 3.11+: https://www.python.org/downloads/" -ForegroundColor Gray
        }
        if (-not $validationState.nodeOk) {
            Write-Host "     • Node.js 18+: https://nodejs.org/" -ForegroundColor Gray
        }
        Write-Host ""
    }
    
    if (-not $validationState.venvOk -or -not $validationState.depsOk) {
        Write-Host "  2. Run complete setup:" -ForegroundColor White
        Write-Host "     .\setup-first-time.ps1" -ForegroundColor Yellow
        Write-Host ""
    }
    
    if (-not $validationState.filesOk) {
        Write-Host "  3. Verify Git repository:" -ForegroundColor White
        Write-Host "     git status" -ForegroundColor Yellow
        Write-Host "     (Files may be missing or repo is corrupt)" -ForegroundColor Gray
        Write-Host ""
    }
    
    Write-Host "After resolving issues, run this script again to validate." -ForegroundColor Cyan
    Write-Host ""
    
    exit 1
}

# ============================================================================
# VALIDATION STATE EXPORT (for debugging)
# ============================================================================

# Export validation state to JSON for audit trail
$validationState | ConvertTo-Json | Out-File "validation_state.json" -Encoding UTF8

Write-Host "?? Validation state saved to: validation_state.json" -ForegroundColor DarkGray
Write-Host ""
