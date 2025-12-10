# ============================================================================
# Codette Advanced Endpoints Integration Script
# Automatically adds missing API endpoints to codette_server_unified.py
# ============================================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Codette Endpoint Integration Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if files exist
if (-not (Test-Path "codette_server_unified.py")) {
    Write-Host "? ERROR: codette_server_unified.py not found!" -ForegroundColor Red
    Write-Host "   Please run this script from the repository root." -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path "codette_advanced_endpoints.py")) {
    Write-Host "? ERROR: codette_advanced_endpoints.py not found!" -ForegroundColor Red
    Write-Host "   This file contains the endpoint definitions." -ForegroundColor Yellow
    exit 1
}

Write-Host "? Found required files" -ForegroundColor Green
Write-Host ""

# Create backup
$backupFile = "codette_server_unified.py.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Write-Host "?? Creating backup: $backupFile" -ForegroundColor Yellow
Copy-Item "codette_server_unified.py" $backupFile
Write-Host "? Backup created successfully" -ForegroundColor Green
Write-Host ""

# Read the main server file
Write-Host "?? Reading codette_server_unified.py..." -ForegroundColor Yellow
$serverContent = Get-Content "codette_server_unified.py" -Raw

# Read the endpoints file
Write-Host "?? Reading codette_advanced_endpoints.py..." -ForegroundColor Yellow
$endpointsContent = Get-Content "codette_advanced_endpoints.py" -Raw

# Extract only the endpoint definitions (skip docstring and instructions)
$endpointPattern = '@app\.(get|post)\('
$lines = $endpointsContent -split "`r?`n"
$startIndex = -1
$endIndex = $lines.Count - 1

# Find where the actual endpoints start
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match $endpointPattern) {
        $startIndex = $i
        break
    }
}

# Find where the instructions section starts
for ($i = $lines.Count - 1; $i -ge 0; $i--) {
    if ($lines[$i] -match "^# ===.*INSTRUCTIONS") {
        $endIndex = $i - 1
        break
    }
}

if ($startIndex -eq -1) {
    Write-Host "? ERROR: No endpoints found in codette_advanced_endpoints.py" -ForegroundColor Red
    exit 1
}

# Extract clean endpoint code
$endpointsToAdd = $lines[$startIndex..$endIndex] -join "`n"

Write-Host "? Extracted $(($endpointsToAdd -split '@app\.(get|post)').Count - 1) endpoint definitions" -ForegroundColor Green
Write-Host ""

# Find the WebSocket route in the server file
Write-Host "?? Locating WebSocket route..." -ForegroundColor Yellow
$wsPattern = '@app\.websocket\("/ws"\)'
$wsMatch = [regex]::Match($serverContent, $wsPattern)

if (-not $wsMatch.Success) {
    Write-Host "? ERROR: Could not find WebSocket route (@app.websocket('/ws'))" -ForegroundColor Red
    Write-Host "   The file structure may have changed." -ForegroundColor Yellow
    exit 1
}

$insertPosition = $wsMatch.Index
Write-Host "? Found WebSocket route at position $insertPosition" -ForegroundColor Green
Write-Host ""

# Check if endpoints are already added
if ($serverContent -match '@app\.get\("/api/analysis/delay-sync"\)') {
    Write-Host "??  WARNING: Endpoints appear to already be added!" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Do you want to continue anyway? (y/N)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-Host "? Aborted by user" -ForegroundColor Red
        exit 0
    }
    Write-Host ""
}

# Insert the endpoints before the WebSocket route
Write-Host "?? Inserting endpoint definitions..." -ForegroundColor Yellow

$beforeWs = $serverContent.Substring(0, $insertPosition)
$afterWs = $serverContent.Substring($insertPosition)

# Add section header and endpoints
$sectionHeader = @"

# ============================================================================
# ADVANCED ANALYSIS ENDPOINTS (Required by CodetteAdvancedTools frontend)
# ============================================================================

"@

$updatedContent = $beforeWs + $sectionHeader + $endpointsToAdd + "`n`n" + $afterWs

# Write the updated content back
Set-Content "codette_server_unified.py" -Value $updatedContent -NoNewline

Write-Host "? Endpoints inserted successfully" -ForegroundColor Green
Write-Host ""

# Verify the changes
Write-Host "?? Verifying integration..." -ForegroundColor Yellow
$verifyContent = Get-Content "codette_server_unified.py" -Raw

$endpointsToCheck = @(
    "/api/analysis/delay-sync",
    "/api/analysis/ear-training",
    "/api/analysis/production-checklist",
    "/api/analysis/instrument-info",
    "/api/analysis/instruments-list",
    "/api/analysis/detect-genre"
)

$allFound = $true
foreach ($endpoint in $endpointsToCheck) {
    if ($verifyContent -match [regex]::Escape($endpoint)) {
        Write-Host "  ? $endpoint" -ForegroundColor Green
    } else {
        Write-Host "  ? $endpoint NOT FOUND" -ForegroundColor Red
        $allFound = $false
    }
}

Write-Host ""

if ($allFound) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "? SUCCESS!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "All 6 endpoints have been integrated successfully!" -ForegroundColor White
    Write-Host ""
    Write-Host "?? Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Test Python syntax:" -ForegroundColor White
    Write-Host "     python -m py_compile codette_server_unified.py" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. Restart the server:" -ForegroundColor White
    Write-Host "     python codette_server_unified.py" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Test the endpoints:" -ForegroundColor White
    Write-Host "     curl http://localhost:8000/api/analysis/delay-sync?bpm=120" -ForegroundColor Gray
    Write-Host "     curl http://localhost:8000/api/analysis/instruments-list" -ForegroundColor Gray
    Write-Host ""
    Write-Host "?? Backup saved to: $backupFile" -ForegroundColor Yellow
    Write-Host ""
    
    # Ask if user wants to test syntax
    $response = Read-Host "Would you like to test the Python syntax now? (Y/n)"
    if ($response -ne 'n' -and $response -ne 'N') {
        Write-Host ""
        Write-Host "?? Testing Python syntax..." -ForegroundColor Yellow
        
        try {
            $result = python -m py_compile codette_server_unified.py 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "? Python syntax check PASSED!" -ForegroundColor Green
                Write-Host ""
                Write-Host "?? Ready to restart the server!" -ForegroundColor Cyan
            } else {
                Write-Host "? Python syntax check FAILED!" -ForegroundColor Red
                Write-Host ""
                Write-Host "Error output:" -ForegroundColor Yellow
                Write-Host $result -ForegroundColor Red
                Write-Host ""
                Write-Host "?? To restore backup:" -ForegroundColor Yellow
                Write-Host "   Copy-Item $backupFile codette_server_unified.py -Force" -ForegroundColor Gray
            }
        } catch {
            Write-Host "? Could not run Python syntax check" -ForegroundColor Red
            Write-Host "   Make sure Python is installed and in PATH" -ForegroundColor Yellow
        }
    }
    
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "? VERIFICATION FAILED" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Some endpoints were not found after integration." -ForegroundColor Yellow
    Write-Host "This may indicate a problem with the script or file structure." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "?? To restore backup:" -ForegroundColor Yellow
    Write-Host "   Copy-Item $backupFile codette_server_unified.py -Force" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host ""
