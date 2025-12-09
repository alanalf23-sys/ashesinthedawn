#!/usr/bin/env pwsh

<#
.SYNOPSIS
Verify Codette AI integration with DAW Core API

.DESCRIPTION
Tests that both backend servers are running and can communicate with the React frontend

.EXAMPLE
./verify_codette_integration.ps1 -Verbose

.PARAMETER CheckServers
Also check if servers are currently running (default: $true)

.PARAMETER ShowDetails
Show detailed endpoint information (default: $true)
#>

param(
    [bool]$CheckServers = $true,
    [bool]$ShowDetails = $true,
    [bool]$TestEndpoints = $true
)

$ErrorActionPreference = "Continue"

# Color definitions
$SuccessColor = "Green"
$ErrorColor = "Red"
$InfoColor = "Cyan"
$WarningColor = "Yellow"

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor $SuccessColor
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor $ErrorColor
}

function Write-Info {
    param([string]$Message)
    Write-Host "→ $Message" -ForegroundColor $InfoColor
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor $WarningColor
}

# Main verification
Write-Host "`n" + ("="*70) -ForegroundColor $InfoColor
Write-Host "Codette AI Integration Verification" -ForegroundColor $InfoColor
Write-Host ("="*70) -ForegroundColor $InfoColor + "`n"

# 1. Check configuration files
Write-Info "Checking configuration files..."

$configFiles = @(
    "i:\ashesinthedawn\codette_server.py",
    "i:\ashesinthedawn\src\lib\codetteBridge.ts",
    "i:\ashesinthedawn\daw_core\api.py"
)

$allConfigFound = $true
foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Write-Success "Found: $(Split-Path $file -Leaf)"
    } else {
        Write-Error-Custom "Missing: $(Split-Path $file -Leaf)"
        $allConfigFound = $false
    }
}

if (-not $allConfigFound) {
    Write-Error-Custom "Some configuration files are missing!"
    exit 1
}

Write-Host ""

# 2. Check port configuration in codette_server.py
Write-Info "Verifying Codette server configuration..."

$codetteConfig = Get-Content "i:\ashesinthedawn\codette_server.py" -Raw
if ($codetteConfig -match 'port\s*=\s*int\(os\.getenv\("CODETTE_PORT",\s*"8001"\)\)') {
    Write-Success "Codette server configured for port 8001"
} elseif ($codetteConfig -match 'port\s*=\s*int\(os\.getenv\("CODETTE_PORT",\s*"8000"\)\)') {
    Write-Error-Custom "Codette server still configured for port 8000 (should be 8001)"
} else {
    Write-Warning-Custom "Could not verify Codette port configuration"
}

Write-Host ""

# 3. Check port configuration in codetteBridge.ts
Write-Info "Verifying frontend bridge configuration..."

$bridgeConfig = Get-Content "i:\ashesinthedawn\src\lib\codetteBridge.ts" -Raw
if ($bridgeConfig -match 'localhost:8001') {
    Write-Success "Frontend bridge configured for localhost:8001"
} elseif ($bridgeConfig -match 'localhost:8000') {
    Write-Error-Custom "Frontend bridge still configured for localhost:8000 (should be 8001)"
} else {
    Write-Warning-Custom "Could not verify frontend bridge configuration"
}

Write-Host ""

# 4. Check if servers are running (optional)
if ($CheckServers) {
    Write-Info "Checking if backend servers are running..."
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Success "DAW Core API is running on port 8000"
        }
    } catch {
        Write-Warning-Custom "DAW Core API not responding on port 8000 (is it running?)"
    }
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8001/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Success "Codette AI Server is running on port 8001"
        }
    } catch {
        Write-Warning-Custom "Codette AI Server not responding on port 8001 (is it running?)"
    }
    
    Write-Host ""
}

# 5. Show configuration details
if ($ShowDetails) {
    Write-Info "Configuration Details:"
    Write-Host ""
    
    Write-Host "  Port Configuration:" -ForegroundColor $InfoColor
    Write-Host "    DAW Core API     : 8000" -ForegroundColor $InfoColor
    Write-Host "    Codette AI       : 8001" -ForegroundColor $InfoColor
    Write-Host ""
    
    Write-Host "  Frontend Connection:" -ForegroundColor $InfoColor
    Write-Host "    CODETTE_API_BASE : http://localhost:8001" -ForegroundColor $InfoColor
    Write-Host "    DAW_API_BASE     : http://localhost:8000" -ForegroundColor $InfoColor
    Write-Host ""
    
    Write-Host "  Codette AI Features:" -ForegroundColor $InfoColor
    Write-Host "    • 4 AI Perspectives: neuralnets, newtonian, davinci, quantum" -ForegroundColor $InfoColor
    Write-Host "    • Audio Analysis & Suggestions" -ForegroundColor $InfoColor
    Write-Host "    • Effect Chain Optimization" -ForegroundColor $InfoColor
    Write-Host "    • Parameter Tuning Recommendations" -ForegroundColor $InfoColor
    Write-Host ""
}

# 6. Test endpoints (optional)
if ($TestEndpoints) {
    Write-Info "Testing key endpoints..."
    Write-Host ""
    
    $endpoints = @(
        @{
            Name = "DAW API Health"
            Url = "http://localhost:8000/health"
            Port = 8000
        },
        @{
            Name = "Codette Health"
            Url = "http://localhost:8001/health"
            Port = 8001
        },
        @{
            Name = "DAW API Docs"
            Url = "http://localhost:8000/docs"
            Port = 8000
        },
        @{
            Name = "Codette Endpoints"
            Url = "http://localhost:8001/docs"
            Port = 8001
        }
    )
    
    foreach ($endpoint in $endpoints) {
        try {
            $response = Invoke-WebRequest -Uri $endpoint.Url -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Success "$($endpoint.Name) : $($endpoint.Url)"
            } else {
                Write-Warning-Custom "$($endpoint.Name) : Returned status $($response.StatusCode)"
            }
        } catch {
            Write-Warning-Custom "$($endpoint.Name) : Not responding (server may not be running)"
        }
    }
    
    Write-Host ""
}

# 7. Summary
Write-Host ("="*70) -ForegroundColor $InfoColor
Write-Success "Codette integration verification complete!"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor $InfoColor
Write-Host "  1. Start both servers: .\start_daw_backend.ps1" -ForegroundColor $InfoColor
Write-Host "  2. Start React frontend: npm run dev" -ForegroundColor $InfoColor
Write-Host "  3. Open browser to: http://localhost:5173" -ForegroundColor $InfoColor
Write-Host "  4. Access Codette AI features in the UI" -ForegroundColor $InfoColor
Write-Host ""
Write-Host ("="*70) -ForegroundColor $InfoColor
Write-Host ""
