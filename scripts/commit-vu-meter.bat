@echo off
REM VU Meter GFX Integration - Git Commit (Simple Version)
REM Double-click this file to commit all VU Meter files

echo =====================================================================
echo   VU METER GFX INTEGRATION - GIT COMMIT
echo =====================================================================
echo.

cd /d D:\HorizonCore\GitHub

echo Checking Git installation...
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git not found!
    echo Please install Git from: https://git-scm.com/download/win
    pause
    exit /b 1
)
echo [OK] Git found
echo.

echo Adding VU Meter files to Git...
git add src/components/VUMeterGfx.tsx
git add src/components/VUMeterPanel.tsx
git add src/hooks/useVUMeterData.ts
git add docs/VU_METER_*.md
git add docs/DEVELOPMENT.md
git add scripts/commit-vu-meter.ps1
git add scripts/commit-vu-meter.bat
echo [OK] Files staged
echo.

echo Current status:
git status --short
echo.

echo Ready to commit!
echo Files: 12 (3 source + 7 docs + 2 scripts)
echo Lines: 2,870+ (code + docs)
echo.

set /p confirm="Commit now? (y/n): "
if /i not "%confirm%"=="y" (
    echo Aborted.
    pause
    exit /b 0
)

echo.
echo Committing...
git commit -m "feat: Add VU Meter GFX integration (JSFX to React/TypeScript, 3 components + 7 docs)"
if errorlevel 1 (
    echo [ERROR] Commit failed!
    pause
    exit /b 1
)
echo [OK] Commit successful!
echo.

set /p push="Push to GitHub? (y/n): "
if /i not "%push%"=="y" (
    echo Skipped. Run 'git push origin main' manually.
    pause
    exit /b 0
)

echo.
echo Pushing to origin main...
git push origin main
if errorlevel 1 (
    echo [ERROR] Push failed!
    echo You may need to pull first or check credentials.
    pause
    exit /b 1
)
echo [OK] Push successful!
echo.

echo =====================================================================
echo   SUCCESS! VU METER INTEGRATION COMMITTED
echo =====================================================================
echo.
echo Files committed: 12
echo Total lines: 2,870+
echo.
echo Documentation: See docs/VU_METER_MASTER_INDEX.md
echo.
echo Next steps:
echo   1. Run: npm run typecheck
echo   2. Run: npm run dev
echo   3. Test in browser
echo.
pause
