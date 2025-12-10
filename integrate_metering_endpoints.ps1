# ============================================================================
# Metering Endpoints Integration Script
# Automatically adds metering endpoints to codette_server_unified.py
# ============================================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Metering Endpoints Integration Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if files exist
if (-not (Test-Path "codette_server_unified.py")) {
    Write-Host "❌ ERROR: codette_server_unified.py not found!" -ForegroundColor Red
    Write-Host "   Please run this script from the repository root (I:\ashesinthedawn\)." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found codette_server_unified.py" -ForegroundColor Green
Write-Host ""

# Create backup
$backupFile = "codette_server_unified.py.backup_metering_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Write-Host "💾 Creating backup: $backupFile" -ForegroundColor Yellow
Copy-Item "codette_server_unified.py" $backupFile
Write-Host "✅ Backup created successfully" -ForegroundColor Green
Write-Host ""

# Read the main server file
Write-Host "📖 Reading codette_server_unified.py..." -ForegroundColor Yellow
$serverContent = Get-Content "codette_server_unified.py" -Raw

# Check file size
$lineCount = ($serverContent -split "`r?`n").Count
Write-Host "   File has $lineCount lines" -ForegroundColor Gray
Write-Host ""

# Check if metering endpoints are already added
if ($serverContent -match '@app\.post\("/daw/metering/level"\)') {
    Write-Host "⚠️  WARNING: Metering endpoints appear to already be added!" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Do you want to continue anyway? (y/N)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-Host "❌ Aborted by user" -ForegroundColor Red
        exit 0
    }
    Write-Host ""
}

# Define the metering endpoints code
$meteringCode = @'

# ============================================================================
# METERING PROXY ENDPOINTS (Priority 4: Critical Integration)
# ============================================================================

# Import metering classes from DAW Core
try:
    from daw_core.metering import LevelMeter, SpectrumAnalyzer, VUMeter, Correlometer
    METERING_AVAILABLE = True
    logger.info("[OK] DAW Core metering classes imported successfully")
except ImportError as e:
    METERING_AVAILABLE = False
    logger.warning(f"[!] DAW Core metering import failed: {e}")
    logger.warning("   Metering endpoints will not be available")


@app.post("/daw/metering/level")
async def daw_metering_level(
    audio_data: List[float],
    sample_rate: int = 44100
):
    """
    Level metering endpoint - Peak, RMS, LUFS, headroom
    
    Args:
        audio_data: Audio samples (mono or stereo)
        sample_rate: Sample rate in Hz (default 44100)
        
    Returns:
        Peak, RMS, LUFS, and headroom measurements
    """
    if not NUMPY_AVAILABLE:
        raise HTTPException(status_code=503, detail="NumPy not available")
    
    if not METERING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Metering module not available")
    
    try:
        import numpy as np
        
        # Convert to numpy array
        audio = np.array(audio_data, dtype=np.float32)
        
        # Create level meter
        meter = LevelMeter(sample_rate=sample_rate)
        
        # Process audio
        meter.process(audio)
        
        # Get measurements
        peak = meter.get_peak_db()
        rms = meter.get_rms_db()
        held_peak = meter.get_held_peak_db()
        
        # Calculate headroom
        headroom = 0.0 - peak  # dB to 0dBFS
        
        # Approximate LUFS (simplified calculation)
        loudness_lufs = rms  # Approximation
        
        logger.info(f"[Metering] Level: Peak={peak:.1f}dB, RMS={rms:.1f}dB")
        
        return {
            "status": "success",
            "meter_type": "level",
            "peak": float(peak),
            "rms": float(rms),
            "peak_db": float(peak),
            "rms_db": float(rms),
            "held_peak_db": float(held_peak),
            "loudness_lufs": float(loudness_lufs),
            "headroom": float(headroom),
            "timestamp": get_timestamp()
        }
        
    except Exception as e:
        logger.error(f"[Metering] Level meter error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/daw/metering/spectrum")
async def daw_metering_spectrum(
    audio_data: List[float],
    sample_rate: int = 44100,
    fft_size: int = 2048
):
    """
    Spectrum analysis endpoint - FFT-based frequency analysis
    
    Args:
        audio_data: Audio samples (mono)
        sample_rate: Sample rate in Hz (default 44100)
        fft_size: FFT size in samples (default 2048)
        
    Returns:
        Frequency bins and magnitude spectrum in dB
    """
    if not NUMPY_AVAILABLE:
        raise HTTPException(status_code=503, detail="NumPy not available")
    
    if not METERING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Metering module not available")
    
    try:
        import numpy as np
        
        # Convert to numpy array
        audio = np.array(audio_data, dtype=np.float32)
        
        # Create spectrum analyzer
        analyzer = SpectrumAnalyzer(fft_size=fft_size, sample_rate=sample_rate)
        
        # Process audio
        analyzer.process(audio)
        
        # Get frequency bands for visualization (32 bands)
        band_freqs, band_mags = analyzer.get_frequency_bands(num_bands=32)
        
        logger.info(f"[Metering] Spectrum: {len(band_freqs)} frequency bands")
        
        return {
            "status": "success",
            "meter_type": "spectrum",
            "frequencies": band_freqs.tolist(),
            "magnitudes": band_mags.tolist(),
            "num_bins": len(band_freqs),
            "fft_size": fft_size,
            "sample_rate": sample_rate,
            "timestamp": get_timestamp()
        }
        
    except Exception as e:
        logger.error(f"[Metering] Spectrum analyzer error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/daw/metering/vu")
async def daw_metering_vu(
    audio_data: List[float],
    sample_rate: int = 44100
):
    """
    VU metering endpoint - Classic VU meter simulation
    
    Args:
        audio_data: Audio samples (mono or stereo)
        sample_rate: Sample rate in Hz (default 44100)
        
    Returns:
        VU reading in dB and normalized 0-1 scale
    """
    if not NUMPY_AVAILABLE:
        raise HTTPException(status_code=503, detail="NumPy not available")
    
    if not METERING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Metering module not available")
    
    try:
        import numpy as np
        
        # Convert to numpy array
        audio = np.array(audio_data, dtype=np.float32)
        
        # Create VU meter
        vu_meter = VUMeter(sample_rate=sample_rate)
        
        # Process audio
        vu_meter.process(audio)
        
        # Get VU reading
        vu_normalized = vu_meter.get_vu()  # 0-1 scale
        vu_db = vu_meter.get_vu_db()       # dB scale (-40 to +6)
        
        logger.info(f"[Metering] VU: {vu_db:.1f}dB ({vu_normalized:.2f})")
        
        return {
            "status": "success",
            "meter_type": "vu",
            "vu": float(vu_normalized),
            "vu_db": float(vu_db),
            "scaled": float(vu_normalized),
            "timestamp": get_timestamp()
        }
        
    except Exception as e:
        logger.error(f"[Metering] VU meter error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/daw/metering/correlation")
async def daw_metering_correlation(
    audio_data: List[float],
    sample_rate: int = 44100
):
    """
    Stereo correlation endpoint - Phase correlation analysis
    
    Args:
        audio_data: Stereo audio samples [[L,R], [L,R], ...]
        sample_rate: Sample rate in Hz (default 44100)
        
    Returns:
        Correlation coefficient (-1 to +1), mono/stereo indicators
    """
    if not NUMPY_AVAILABLE:
        raise HTTPException(status_code=503, detail="NumPy not available")
    
    if not METERING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Metering module not available")
    
    try:
        import numpy as np
        
        # Convert to numpy array
        audio = np.array(audio_data, dtype=np.float32)
        
        # Ensure stereo format (N, 2)
        if audio.ndim == 1:
            # Mono signal - duplicate to stereo
            audio = np.stack([audio, audio], axis=1)
        
        # Create correlometer
        correlometer = Correlometer(sample_rate=sample_rate)
        
        # Process audio
        correlometer.process(audio)
        
        # Get correlation
        correlation = correlometer.get_correlation()
        is_mono = correlometer.is_mono()
        is_stereo = correlometer.is_stereo()
        
        logger.info(f"[Metering] Correlation: {correlation:.2f} (mono={is_mono}, stereo={is_stereo})")
        
        return {
            "status": "success",
            "meter_type": "correlation",
            "correlation": float(correlation),
            "mono": bool(is_mono),
            "stereo": bool(is_stereo),
            "timestamp": get_timestamp()
        }
        
    except Exception as e:
        logger.error(f"[Metering] Correlometer error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

'@

Write-Host "📝 Prepared metering endpoint code (4 endpoints)" -ForegroundColor Green
Write-Host ""

# Find insertion point - look for if __name__ == "__main__" or end of file
Write-Host "🔍 Locating insertion point..." -ForegroundColor Yellow

$mainPattern = 'if __name__ == "__main__":'
$mainMatch = [regex]::Match($serverContent, $mainPattern)

if ($mainMatch.Success) {
    $insertPosition = $mainMatch.Index
    Write-Host "✅ Found main block at position $insertPosition" -ForegroundColor Green
    Write-Host "   Will insert endpoints BEFORE the main block" -ForegroundColor Gray
} else {
    # If no main block, insert at end of file
    $insertPosition = $serverContent.Length
    Write-Host "⚠️  No main block found, inserting at end of file" -ForegroundColor Yellow
}
Write-Host ""

# Insert the metering endpoints
Write-Host "🔧 Inserting metering endpoint definitions..." -ForegroundColor Yellow

$beforeInsert = $serverContent.Substring(0, $insertPosition)
$afterInsert = $serverContent.Substring($insertPosition)

$updatedContent = $beforeInsert + $meteringCode + "`n" + $afterInsert

# Write the updated content back
Set-Content "codette_server_unified.py" -Value $updatedContent -NoNewline

Write-Host "✅ Endpoints inserted successfully" -ForegroundColor Green
Write-Host ""

# Verify the changes
Write-Host "🔍 Verifying integration..." -ForegroundColor Yellow
$verifyContent = Get-Content "codette_server_unified.py" -Raw

$endpointsToCheck = @(
    "/daw/metering/level",
    "/daw/metering/spectrum",
    "/daw/metering/vu",
    "/daw/metering/correlation"
)

$allFound = $true
foreach ($endpoint in $endpointsToCheck) {
    if ($verifyContent -match [regex]::Escape($endpoint)) {
        Write-Host "  ✅ $endpoint" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $endpoint NOT FOUND" -ForegroundColor Red
        $allFound = $false
    }
}

Write-Host ""

# Check for required imports
Write-Host "🔍 Checking for required imports..." -ForegroundColor Yellow
$importsToCheck = @(
    "LevelMeter",
    "SpectrumAnalyzer",
    "VUMeter",
    "Correlometer"
)

foreach ($import in $importsToCheck) {
    if ($verifyContent -match [regex]::Escape($import)) {
        Write-Host "  ✅ $import" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  $import NOT FOUND" -ForegroundColor Yellow
    }
}

Write-Host ""

if ($allFound) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "All 4 metering endpoints have been integrated successfully!" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 Endpoints added:" -ForegroundColor Cyan
    Write-Host "  1. POST /daw/metering/level      - Peak, RMS, LUFS, headroom" -ForegroundColor White
    Write-Host "  2. POST /daw/metering/spectrum   - FFT frequency analysis" -ForegroundColor White
    Write-Host "  3. POST /daw/metering/vu         - Classic VU meter" -ForegroundColor White
    Write-Host "  4. POST /daw/metering/correlation - Stereo phase correlation" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Test Python syntax:" -ForegroundColor White
    Write-Host "     python -m py_compile codette_server_unified.py" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. Restart the server:" -ForegroundColor White
    Write-Host "     python codette_server_unified.py" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Test the endpoints:" -ForegroundColor White
    Write-Host '     curl -X POST http://localhost:8000/daw/metering/level \' -ForegroundColor Gray
    Write-Host '       -H "Content-Type: application/json" \' -ForegroundColor Gray
    Write-Host '       -d ''{"audio_data":[0.1,0.5,-0.3,0.8],"sample_rate":44100}''' -ForegroundColor Gray
    Write-Host ""
    Write-Host "💾 Backup saved to: $backupFile" -ForegroundColor Yellow
    Write-Host ""
    
    # Ask if user wants to test syntax
    $response = Read-Host "Would you like to test the Python syntax now? (Y/n)"
    if ($response -ne 'n' -and $response -ne 'N') {
        Write-Host ""
        Write-Host "🔍 Testing Python syntax..." -ForegroundColor Yellow
        
        try {
            $result = python -m py_compile codette_server_unified.py 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Python syntax check PASSED!" -ForegroundColor Green
                Write-Host ""
                Write-Host "🚀 Ready to restart the server!" -ForegroundColor Cyan
                Write-Host ""
                Write-Host "📚 Documentation:" -ForegroundColor Cyan
                Write-Host "   See: docs/PRIORITY_4_METERING_ENDPOINTS_COMPLETE.md" -ForegroundColor Gray
                Write-Host "   See: docs/SESSION_SUMMARY_METERING_ENDPOINTS.md" -ForegroundColor Gray
            } else {
                Write-Host "❌ Python syntax check FAILED!" -ForegroundColor Red
                Write-Host ""
                Write-Host "Error output:" -ForegroundColor Yellow
                Write-Host $result -ForegroundColor Red
                Write-Host ""
                Write-Host "💾 To restore backup:" -ForegroundColor Yellow
                Write-Host "   Copy-Item $backupFile codette_server_unified.py -Force" -ForegroundColor Gray
            }
        } catch {
            Write-Host "❌ Could not run Python syntax check" -ForegroundColor Red
            Write-Host "   Make sure Python is installed and in PATH" -ForegroundColor Yellow
        }
    }
    
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "❌ VERIFICATION FAILED" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Some endpoints were not found after integration." -ForegroundColor Yellow
    Write-Host "This may indicate a problem with the script or file structure." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💾 To restore backup:" -ForegroundColor Yellow
    Write-Host "   Copy-Item $backupFile codette_server_unified.py -Force" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Integration Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
