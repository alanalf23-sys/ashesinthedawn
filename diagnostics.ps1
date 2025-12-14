# CoreLogic Studio - System Diagnostics
# Checks your environment and dependencies

Write-Host "`n?? CoreLogic Studio - System Diagnostics`n" -ForegroundColor Cyan

$issues = @()
$warnings = @()

# Check Python
Write-Host "?? Checking Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ? Python: $pythonVersion" -ForegroundColor Green
    } else {
        Write-Host "  ? Python not found" -ForegroundColor Red
        $issues += "Python not installed"
    }
} catch {
    Write-Host "  ? Python not found" -ForegroundColor Red
    $issues += "Python not installed"
}

# Check Node
Write-Host "`n?? Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ? Node.js: $nodeVersion" -ForegroundColor Green
        
        # Check if version is >= 18
        $versionNum = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
        if ($versionNum -lt 18) {
            Write-Host "  ??  Node.js version should be 18 or higher" -ForegroundColor Yellow
            $warnings += "Node.js version < 18 (current: $nodeVersion)"
        }
    } else {
        Write-Host "  ? Node.js not found" -ForegroundColor Red
        $issues += "Node.js not installed"
    }
} catch {
    Write-Host "  ? Node.js not found" -ForegroundColor Red
    $issues += "Node.js not installed"
}

# Check npm
Write-Host "`n?? Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ? npm: v$npmVersion" -ForegroundColor Green
    } else {
        Write-Host "  ? npm not found" -ForegroundColor Red
        $issues += "npm not installed"
    }
} catch {
    Write-Host "  ? npm not found" -ForegroundColor Red
    $issues += "npm not installed"
}

# Check virtual environment
Write-Host "`n?? Checking Python virtual environment..." -ForegroundColor Yellow
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "  ? Virtual environment exists" -ForegroundColor Green
    
    # Check if venv has packages
    if (Test-Path "venv\Lib\site-packages\fastapi") {
        Write-Host "  ? FastAPI installed in venv" -ForegroundColor Green
    } else {
        Write-Host "  ??  FastAPI not found in venv" -ForegroundColor Yellow
        $warnings += "Python dependencies may not be installed"
    }
} else {
    Write-Host "  ? Virtual environment not found" -ForegroundColor Red
    $issues += "Virtual environment missing - run setup-first-time.ps1"
}

# Check node_modules
Write-Host "`n?? Checking Node dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "  ? node_modules exists" -ForegroundColor Green
    
    # Check critical dependencies
    $criticalDeps = @{
        "react" = "React"
        "vite" = "Vite"
        "tailwindcss" = "Tailwind CSS"
        "fraction.js" = "fraction.js (PostCSS)"
        "postcss" = "PostCSS"
        "autoprefixer" = "Autoprefixer"
    }
    
    $missingDeps = @()
    foreach ($dep in $criticalDeps.Keys) {
        if (Test-Path "node_modules\$dep") {
            Write-Host "  ? $($criticalDeps[$dep])" -ForegroundColor Green
        } else {
            Write-Host "  ? Missing: $($criticalDeps[$dep])" -ForegroundColor Red
            $missingDeps += $dep
        }
    }
    
    if ($missingDeps.Count -gt 0) {
        $issues += "Missing Node dependencies: $($missingDeps -join ', ')"
    }
} else {
    Write-Host "  ? node_modules not found" -ForegroundColor Red
    $issues += "Node dependencies not installed - run setup-first-time.ps1"
}

# Check ports
Write-Host "`n?? Checking ports..." -ForegroundColor Yellow

# Port 8000 (Python)
$port8000 = netstat -ano | findstr ":8000"
if ($port8000) {
    Write-Host "  ??  Port 8000 is in use" -ForegroundColor Yellow
    $warnings += "Port 8000 already in use - Python server may already be running"
} else {
    Write-Host "  ? Port 8000 available" -ForegroundColor Green
}

# Port 5173 (React)
$port5173 = netstat -ano | findstr ":5173"
if ($port5173) {
    Write-Host "  ??  Port 5173 is in use" -ForegroundColor Yellow
    $warnings += "Port 5173 already in use - React server may already be running"
} else {
    Write-Host "  ? Port 5173 available" -ForegroundColor Green
}

# Check key files
Write-Host "`n?? Checking project files..." -ForegroundColor Yellow
$keyFiles = @(
    "package.json",
    "requirements.txt",
    "codette_server_unified.py",
    "vite.config.ts",
    "src\main.tsx"
)

foreach ($file in $keyFiles) {
    if (Test-Path $file) {
        Write-Host "  ? $file" -ForegroundColor Green
    } else {
        Write-Host "  ? Missing: $file" -ForegroundColor Red
        $issues += "Missing file: $file"
    }
}

# Check Git repository
Write-Host "`n?? Checking Git repository..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Write-Host "  ? Git repository initialized" -ForegroundColor Green
    
    try {
        $gitBranch = git branch --show-current 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ? Current branch: $gitBranch" -ForegroundColor Green
        }
    } catch {
        Write-Host "  ??  Could not determine Git branch" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ??  Not a Git repository" -ForegroundColor Yellow
}

# Summary
Write-Host "`n" -NoNewline
Write-Host "???????????????????????????????????????????????????????????" -ForegroundColor Cyan
Write-Host " DIAGNOSTIC SUMMARY" -ForegroundColor Cyan
Write-Host "???????????????????????????????????????????????????????????" -ForegroundColor Cyan

if ($issues.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "`n? ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host "`nYour system is ready. Run: .\start-all.ps1`n" -ForegroundColor Cyan
} else {
    if ($issues.Count -gt 0) {
        Write-Host "`n? CRITICAL ISSUES FOUND:" -ForegroundColor Red
        foreach ($issue in $issues) {
            Write-Host "  • $issue" -ForegroundColor Red
        }
        Write-Host "`n?? Recommended action: Run .\setup-first-time.ps1" -ForegroundColor Yellow
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host "`n??  WARNINGS:" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "  • $warning" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n???????????????????????????????????????????????????????????`n" -ForegroundColor Cyan

# Suggest next steps
if ($issues.Count -gt 0) {
    Write-Host "?? Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Run: .\setup-first-time.ps1" -ForegroundColor White
    Write-Host "  2. Wait for installation to complete" -ForegroundColor White
    Write-Host "  3. Run diagnostics again: .\diagnostics.ps1`n" -ForegroundColor White
} elseif ($warnings.Count -gt 0) {
    Write-Host "?? Suggestions:" -ForegroundColor Cyan
    if ($warnings -match "Port.*in use") {
        Write-Host "  • Servers may already be running - check terminal windows" -ForegroundColor White
        Write-Host "  • Or run: .\stop-all.ps1 to stop them`n" -ForegroundColor White
    }
    if ($warnings -match "dependencies") {
        Write-Host "  • Run: .\fix-dependencies.ps1`n" -ForegroundColor White
    }
}

# Exit code
if ($issues.Count -gt 0) {
    exit 1
} else {
    exit 0
}
