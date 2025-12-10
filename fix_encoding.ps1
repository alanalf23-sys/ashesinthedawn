# ============================================================================
# Fix Unicode Encoding Issues in codette_server_unified.py
# Removes corrupted Unicode characters and ensures clean UTF-8 encoding
# ============================================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Codette Encoding Fix Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if file exists
$filePath = "codette_server_unified.py"
if (-not (Test-Path $filePath)) {
    Write-Host "ERROR: codette_server_unified.py not found!" -ForegroundColor Red
    Write-Host "Please run this script from the repository root." -ForegroundColor Yellow
    exit 1
}

Write-Host "Found: $filePath" -ForegroundColor Green
Write-Host ""

# Create backup
$backupFile = "codette_server_unified.py.backup_encoding_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Write-Host "Creating backup: $backupFile" -ForegroundColor Yellow
Copy-Item $filePath $backupFile
Write-Host "Backup created successfully" -ForegroundColor Green
Write-Host ""

# Read file as bytes to handle any encoding
Write-Host "Reading file as binary..." -ForegroundColor Yellow
$bytes = [System.IO.File]::ReadAllBytes($filePath)

# Convert to UTF-8 string
$content = [System.Text.Encoding]::UTF8.GetString($bytes)

Write-Host "File read successfully" -ForegroundColor Green
Write-Host ""

Write-Host "Cleaning problematic characters..." -ForegroundColor Yellow

# Use regex to remove all non-ASCII characters except newlines
# Keep only printable ASCII (32-126) plus newlines (10, 13)
$cleanedContent = ""
foreach ($char in $content.ToCharArray()) {
    $charCode = [int][char]$char
    # Keep: newlines (10, 13), tabs (9), and printable ASCII (32-126)
    if ($charCode -eq 9 -or $charCode -eq 10 -or $charCode -eq 13 -or ($charCode -ge 32 -and $charCode -le 126)) {
        $cleanedContent += $char
    } else {
        # Replace problematic chars with safe ASCII equivalents
        switch ($charCode) {
            # Common emoji/symbols replacements
            0x2705 { $cleanedContent += "[OK]" }      # Check mark
            0x274C { $cleanedContent += "[X]" }       # Cross mark
            0x26A0 { $cleanedContent += "[!]" }       # Warning sign
            0x2139 { $cleanedContent += "[i]" }       # Information
            0x2192 { $cleanedContent += "->" }        # Right arrow
            0x2190 { $cleanedContent += "<-" }        # Left arrow
            0x2022 { $cleanedContent += "*" }         # Bullet
            0x00D7 { $cleanedContent += "x" }         # Multiplication
            default { 
                # Skip unknown Unicode characters
                # (they'll just be removed)
            }
        }
    }
}

Write-Host "Character cleaning complete" -ForegroundColor Green
Write-Host ""

# Write cleaned content back to file with UTF-8 encoding (no BOM)
Write-Host "Writing cleaned file with UTF-8 encoding..." -ForegroundColor Yellow
try {
    # Use .NET to write UTF-8 without BOM
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($filePath, $cleanedContent, $utf8NoBom)
    Write-Host "File written successfully" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to write file: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "To restore backup:" -ForegroundColor Yellow
    Write-Host "  Copy-Item $backupFile $filePath -Force" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "SUCCESS!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "File encoding has been fixed!" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Test Python syntax:" -ForegroundColor White
Write-Host "     python -m py_compile codette_server_unified.py" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. If successful, run the endpoint integration script:" -ForegroundColor White
Write-Host "     .\integrate_endpoints.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "Backup saved to: $backupFile" -ForegroundColor Yellow
Write-Host ""

# Ask if user wants to test syntax
$response = Read-Host "Would you like to test the Python syntax now? (Y/n)"
if ($response -ne 'n' -and $response -ne 'N') {
    Write-Host ""
    Write-Host "Testing Python syntax..." -ForegroundColor Yellow
    
    try {
        $result = python -m py_compile codette_server_unified.py 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Python syntax check PASSED!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Ready to integrate endpoints!" -ForegroundColor Cyan
            Write-Host "Run: .\integrate_endpoints.ps1" -ForegroundColor White
        } else {
            Write-Host "Python syntax check FAILED!" -ForegroundColor Red
            Write-Host ""
            Write-Host "Error output:" -ForegroundColor Yellow
            Write-Host $result -ForegroundColor Red
            Write-Host ""
            Write-Host "To restore backup:" -ForegroundColor Yellow
            Write-Host "  Copy-Item $backupFile $filePath -Force" -ForegroundColor Gray
        }
    } catch {
        Write-Host "Could not run Python syntax check" -ForegroundColor Red
        Write-Host "Make sure Python is installed and in PATH" -ForegroundColor Yellow
    }
}

Write-Host ""
