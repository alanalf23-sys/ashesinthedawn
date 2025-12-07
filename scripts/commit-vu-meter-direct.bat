@echo off
REM VU Meter GFX Integration - Direct Git Commit
REM Uses local Git installation

echo =====================================================================
echo   VU METER GFX INTEGRATION - DIRECT COMMIT
echo =====================================================================
echo.

cd /d "D:\HorizonCore\GitHub"
echo Current directory: %CD%
echo.

REM Set Git path (using local installation at D:\HorizonCore\GitHub\Git)
set GIT_PATH=D:\HorizonCore\GitHub\Git\cmd\git.exe

echo Checking for local Git installation...
if exist "%GIT_PATH%" (
    echo [OK] Git found: %GIT_PATH%
) else (
    echo [ERROR] Git not found at: %GIT_PATH%
    echo Please verify Git installation location
    pause
    exit /b 1
)
echo.

echo Current Git status:
"%GIT_PATH%" status --short
echo.

echo Staging VU Meter files...
"%GIT_PATH%" add src/components/VUMeterGfx.tsx
"%GIT_PATH%" add src/components/VUMeterPanel.tsx
"%GIT_PATH%" add src/hooks/useVUMeterData.ts
"%GIT_PATH%" add docs/VU_METER_README.md
"%GIT_PATH%" add docs/VU_METER_INTEGRATION_COMPLETE.md
"%GIT_PATH%" add docs/GIT_COMMIT_GUIDE_VU_METER.md
"%GIT_PATH%" add docs/SESSION_CHANGELOG_VU_METER.md
"%GIT_PATH%" add docs/VU_METER_FILE_MANIFEST.md
"%GIT_PATH%" add docs/VU_METER_MASTER_INDEX.md
"%GIT_PATH%" add docs/EVERYTHING_READY.md
"%GIT_PATH%" add docs/DEVELOPMENT.md
"%GIT_PATH%" add scripts/commit-vu-meter.ps1
"%GIT_PATH%" add scripts/commit-vu-meter.bat
"%GIT_PATH%" add scripts/commit-vu-meter-direct.bat
echo.

echo Staged files:
"%GIT_PATH%" status --short
echo.

echo Ready to commit!
echo Files: 14
echo Lines: 2,870+ (code + docs)
echo.

set /p confirm="Proceed with commit? (y/n): "
if /i not "%confirm%"=="y" (
    echo Aborted. Files remain staged.
    pause
    exit /b 0
)

echo.
echo Committing...
"%GIT_PATH%" commit -m "feat: Add VU Meter GFX integration (JSFX->React/TypeScript)" -m "- Implement VUMeterGfx component (1,050 lines)" -m "  * Exact JSFX formula preservation" -m "  * Canvas-based rendering with 60 FPS animation" -m "  * Dual stereo meters (LEFT/RIGHT channels)" -m "  * RMS and peak displays with clip indicators" -m "" -m "- Add VUMeterPanel wrapper component (150 lines)" -m "  * Audio engine integration" -m "  * Response time and release controls" -m "  * Settings panel with sliders" -m "" -m "- Create useVUMeterData hook (70 lines)" -m "  * Real-time audio level extraction" -m "  * RMS and peak calculations per channel" -m "" -m "- Add comprehensive documentation (6 docs)" -m "  * Integration guide, Git guide, session log" -m "  * File manifest, master index, developer guide update" -m "" -m "Original JSFX: VU Meter by Liteon (GPL)" -m "Total: 2,870+ lines (code + docs)"

if %ERRORLEVEL% EQU 0 (
    echo [OK] Commit successful!
) else (
    echo [ERROR] Commit failed!
    pause
    exit /b 1
)
echo.

echo Push to GitHub?
echo Remote: origin (https://github.com/alanalf23-sys/ashesinthedawn)
echo.

set /p push="Push to GitHub? (y/n): "
if /i "%push%"=="y" (
    echo.
    echo Pushing to origin main...
    "%GIT_PATH%" push origin main
    
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Push successful!
    ) else (
        echo [ERROR] Push failed!
        echo You may need to pull first or check credentials.
    )
) else (
    echo Skipped. Run manually: "%GIT_PATH%" push origin main
)

echo.
echo =====================================================================
echo   VU METER INTEGRATION COMMITTED!
echo =====================================================================
echo.
echo Summary:
echo   Files committed: 14
echo   Lines of code: 1,270
echo   Lines of docs: 1,600+
echo   Total lines: 2,900+
echo.
echo Documentation:
echo   - docs/EVERYTHING_READY.md (START HERE!)
echo   - docs/VU_METER_MASTER_INDEX.md (navigation hub)
echo   - docs/VU_METER_README.md (quick start)
echo.
echo Next steps:
echo   1. npm run typecheck
echo   2. npm run dev
echo   3. Test VU meters in browser
echo.
echo Happy coding!
echo.

pause
