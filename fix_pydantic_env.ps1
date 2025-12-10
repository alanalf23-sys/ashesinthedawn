# Fix Pydantic version mismatch for Python 3.13
# Run this script to resolve the build error

Write-Host "?? Fixing Pydantic environment..." -ForegroundColor Cyan
Write-Host ""

# Activate virtual environment
Write-Host "? Activating virtual environment..." -ForegroundColor Green
.\venv\Scripts\Activate.ps1

# Clean pip cache
Write-Host "? Clearing pip cache..." -ForegroundColor Green
pip cache purge

# Remove problematic versions
Write-Host "? Removing old Pydantic versions..." -ForegroundColor Green
pip uninstall -y pydantic pydantic-core 2>&1 | Out-Null

# Clear any remaining cache
pip cache purge

# Install from cleaned requirements.txt (without conflicting versions)
Write-Host "? Installing dependencies from requirements.txt..." -ForegroundColor Green
pip install -r requirements.txt

# Verify installation
Write-Host "? Verifying installation..." -ForegroundColor Green
python -c "from pydantic import BaseModel; print('? Pydantic installed successfully')"
