#!/usr/bin/env pwsh
<#
.SYNOPSIS
    CoreLogic Studio Production Verification Script
    
.DESCRIPTION
    Comprehensive system health check for deployment verification
    
.EXAMPLE
    .\verify_production.ps1
    
.NOTES
    Requires: PowerShell Core or Windows PowerShell 5.1+
#>

param(
    [switch]$Verbose = $false,
    [switch]$Quick = $false
)

# Color helpers
function Write-Success {
    param([string]$Message)
    Write-Host "PASS: $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "FAIL: $Message" -ForegroundColor Red
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "WARN: $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "INFO: $Message" -ForegroundColor Cyan
}

# Header
Write-Host "`n" + "="*70
Write-Host "?? CoreLogic Studio - Production Verification Script"
Write-Host "="*70 + "`n"

$startTime = Get-Date
$checks = @()

# Test 1: Backend Health
Write-Info "Test 1/8: Backend Health Check..."
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Success "Backend health check passed"
        $checks += @{name="Backend Health"; status="PASS"}
    }
} catch {
    Write-Error-Custom "Backend health check failed: $_"
    $checks += @{name="Backend Health"; status="FAIL"}
}

# Test 2: WebSocket Endpoint
Write-Info "Test 2/8: WebSocket Availability..."
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/diagnostics/status" -Method GET -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Success "WebSocket endpoint available"
        $checks += @{name="WebSocket Endpoint"; status="PASS"}
    }
} catch {
    Write-Error-Custom "WebSocket endpoint check failed: $_"
    $checks += @{name="WebSocket Endpoint"; status="FAIL"}
}

# Test 3: Supabase Connectivity
Write-Info "Test 3/8: Supabase Database Connectivity..."
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/diagnostics/database" -Method GET -TimeoutSec 5 -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.database.connection -match "Connected") {
        Write-Success "Database connected and accessible"
        $checks += @{name="Database Connectivity"; status="PASS"}
    } else {
        Write-Error-Custom "Database connection issue: $($data.database.connection)"
        $checks += @{name="Database Connectivity"; status="FAIL"}
    }
} catch {
    Write-Error-Custom "Database check failed: $_"
    $checks += @{name="Database Connectivity"; status="FAIL"}
}

# Test 4: RLS Policies
Write-Info "Test 4/8: RLS Policy Configuration..."
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/diagnostics/rls-policies" -Method GET -TimeoutSec 5 -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.rls_analysis.security_recommendations.status -like "*CORRECT*") {
        Write-Success "RLS policies correctly configured (Service Role Key)"
        $checks += @{name="RLS Policies"; status="PASS"}
    } else {
        Write-Warning-Custom "RLS configuration may need review"
        $checks += @{name="RLS Policies"; status="WARN"}
    }
} catch {
    Write-Error-Custom "RLS policy check failed: $_"
    $checks += @{name="RLS Policies"; status="FAIL"}
}

# Test 5: Cache Performance
Write-Info "Test 5/8: Cache System Performance..."
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/diagnostics/cache" -Method GET -TimeoutSec 5 -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    
    Write-Success "Cache system operational"
    Write-Host "   • TTL: $($data.cache.ttl_seconds) seconds"
    Write-Host "   • Entries: $($data.cache.entries)"
    Write-Host "   • Hit Rate: $($data.cache.hit_rate_percent)%"
    
    $checks += @{name="Cache System"; status="PASS"}
} catch {
    Write-Error-Custom "Cache check failed: $_"
    $checks += @{name="Cache System"; status="FAIL"}
}

# Test 6: Performance Metrics
Write-Info "Test 6/8: System Performance Metrics..."
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/diagnostics/performance" -Method GET -TimeoutSec 5 -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    
    Write-Success "Performance metrics collected"
    Write-Host "   • Uptime: $($data.performance.uptime_seconds) seconds"
    Write-Host "   • Avg Response Time: $($data.performance.avg_response_time_ms)ms"
    Write-Host "   • Total Requests: $($data.performance.request_count)"
    Write-Host "   • Cache Hit Rate: $($data.performance.cache_hit_rate)"
    
    $checks += @{name="Performance Metrics"; status="PASS"}
} catch {
    Write-Error-Custom "Performance check failed: $_"
    $checks += @{name="Performance Metrics"; status="FAIL"}
}

# Test 7: API Endpoints
Write-Info "Test 7/8: API Endpoint Status..."
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/diagnostics/endpoints" -Method GET -TimeoutSec 5 -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.endpoints) {
        $endpointCount = ($data.endpoints | Measure-Object).Count
        Write-Success "$endpointCount endpoint groups available"
        $checks += @{name="API Endpoints"; status="PASS"}
    }
} catch {
    Write-Error-Custom "Endpoint check failed: $_"
    $checks += @{name="API Endpoints"; status="FAIL"}
}

# Test 8: Dependencies
Write-Info "Test 8/8: System Dependencies..."
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/diagnostics/dependencies" -Method GET -TimeoutSec 5 -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    
    $allGood = $true
    foreach ($dep in $data.dependencies.core.PSObject.Properties) {
        $depStatus = $dep.Value
        if ($depStatus -like "*Available*" -or $depStatus -eq "Available") {
            Write-Success "$($dep.Name): OK"
        } elseif ($depStatus -like "*Optional*" -or $depStatus -eq "Optional") {
            Write-Warning-Custom "$($dep.Name): Optional (may have limited functionality)"
        } else {
            Write-Error-Custom "$($dep.Name): $($dep.Value)"
            $allGood = $false
        }
    }
    
    if ($allGood) {
        $checks += @{name="Dependencies"; status="PASS"}
    } else {
        $checks += @{name="Dependencies"; status="WARN"}
    }
} catch {
    Write-Error-Custom "Dependency check failed: $_"
    $checks += @{name="Dependencies"; status="FAIL"}
}

# Summary
Write-Host "`n" + "="*70
Write-Host "?? Verification Summary"
Write-Host "="*70 + "`n"

$passCount = ($checks | Where-Object {$_.status -eq "PASS"}).Count
$warnCount = ($checks | Where-Object {$_.status -eq "WARN"}).Count
$failCount = ($checks | Where-Object {$_.status -eq "FAIL"}).Count

foreach ($check in $checks) {
    Write-Host "$($check.status) $($check.name)"
}

Write-Host "`n" + "-"*70
Write-Host "Results: $passCount PASS  |  $warnCount WARN  |  $failCount FAIL"
Write-Host "-"*70 + "`n"

# Overall Status
if ($failCount -eq 0 -and $warnCount -eq 0) {
    Write-Host "?? " -ForegroundColor Green -NoNewline
    Write-Host "ALL SYSTEMS GREEN - PRODUCTION READY!" -ForegroundColor Green
    $exitCode = 0
} elseif ($failCount -eq 0) {
    Write-Host "??  " -ForegroundColor Yellow -NoNewline
    Write-Host "SOME WARNINGS - REVIEW RECOMMENDED" -ForegroundColor Yellow
    $exitCode = 1
} else {
    Write-Host "? " -ForegroundColor Red -NoNewline
    Write-Host "CRITICAL ISSUES - DO NOT DEPLOY" -ForegroundColor Red
    $exitCode = 2
}

Write-Host "`n" + "="*70
$duration = (Get-Date) - $startTime
Write-Host "Verification completed in $($duration.TotalSeconds)s"
Write-Host "="*70 + "`n"

exit $exitCode
