# Test RPC calls via the Codette backend endpoints
# This tests that the frontend can successfully call the backend, which then calls RPC functions

Write-Host "`n" -NoNewline
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host "BACKEND ENDPOINT RPC TESTS" -ForegroundColor Cyan
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host "`n"

$baseUrl = "http://localhost:8000"
$contentType = "application/json"

function Test-Endpoint {
    param(
        [string]$Endpoint,
        [hashtable]$Body,
        [string]$Description
    )
    
    Write-Host ("─" * 80) -ForegroundColor Gray
    Write-Host "TEST: $Description" -ForegroundColor Yellow
    Write-Host "Endpoint: POST $Endpoint" -ForegroundColor Gray
    Write-Host "Payload: $($Body | ConvertTo-Json)" -ForegroundColor Gray
    Write-Host ""
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl$Endpoint" `
            -Method Post `
            -Headers @{'Content-Type' = $contentType} `
            -Body ($Body | ConvertTo-Json) `
            -ErrorAction Stop
        
        Write-Host "SUCCESS - HTTP $($response.StatusCode)" -ForegroundColor Green
        
        $content = $response.Content | ConvertFrom-Json
        
        # Check for source field in suggestions
        if ($content.suggestions) {
            Write-Host "Suggestions found:" -ForegroundColor Green
            foreach ($suggestion in ($content.suggestions | Select-Object -First 2)) {
                Write-Host "  - Source: $($suggestion.source)" -ForegroundColor Green
                Write-Host "    Title: $($suggestion.title)" -ForegroundColor Green
            }
        }
        
        Write-Host ""
        return $true
        
    } catch {
        Write-Host "FAILED - $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        return $false
    }
}

# Test 1: Suggestions endpoint
$test1 = Test-Endpoint -Endpoint "/codette/suggest" `
    -Body @{
        context = @{
            type = "mixing"
            track_type = "audio"
            track_name = "Vocals"
        }
        limit = 5
    } `
    -Description "Suggestions Endpoint"

# Test 2: Chat endpoint
$test2 = Test-Endpoint -Endpoint "/codette/chat" `
    -Body @{
        message = "How should I set up reverb?"
    } `
    -Description "Chat Endpoint"

# Test 3: Another suggestions context
$test3 = Test-Endpoint -Endpoint "/codette/suggest" `
    -Body @{
        context = @{
            type = "mastering"
            track_type = "audio"
            track_name = "Master"
        }
        limit = 5
    } `
    -Description "Suggestions - Mastering"

# Test 4: Chat with different message
$test4 = Test-Endpoint -Endpoint "/codette/chat" `
    -Body @{
        message = "Best way to do EQ?"
    } `
    -Description "Chat - EQ Question"

# Summary
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host ""

$passed = @($test1, $test2, $test3, $test4) | Where-Object { $_ } | Measure-Object | Select-Object -ExpandProperty Count
$failed = 4 - $passed

Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Green
Write-Host ""
