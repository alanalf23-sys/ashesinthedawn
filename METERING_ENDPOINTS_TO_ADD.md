# Metering Endpoints - Integration Instructions

**Status**: The metering endpoints from Priority 4 need to be added to your `codette_server_unified.py` file.

## Issue

Your `codette_server_unified.py` file only has 152 lines and is incomplete (it cuts off mid-function). The metering endpoints I added in the previous session are not in your actual file.

## Solution

Add the following code to the **END** of your `codette_server_unified.py` file (after line 152, after completing the truncated function).

---

## Code to Add

```python
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
```

---

## Where to Add This Code

1. Open `codette_server_unified.py`
2. Scroll to the bottom (line 152)
3. Complete any truncated function (the `function_args = {}` line needs closing)
4. Add the metering endpoints code above
5. Save the file

## Testing After Adding

```bash
# Start server
python codette_server_unified.py

# Test level endpoint
curl -X POST http://localhost:8000/daw/metering/level \
  -H "Content-Type: application/json" \
  -d '{"audio_data":[0.1,0.5,-0.3,0.8],"sample_rate":44100}'

# Test spectrum endpoint
curl -X POST http://localhost:8000/daw/metering/spectrum \
  -H "Content-Type: application/json" \
  -d '{"audio_data":[0.1,0.2,-0.1],"sample_rate":44100,"fft_size":2048}'

# Test VU endpoint
curl -X POST http://localhost:8000/daw/metering/vu \
  -H "Content-Type: application/json" \
  -d '{"audio_data":[0.3,0.3,0.3],"sample_rate":44100}'

# Test correlation endpoint
curl -X POST http://localhost:8000/daw/metering/correlation \
  -H "Content-Type: application/json" \
  -d '{"audio_data":[[0.5,0.5],[0.3,0.4]],"sample_rate":44100}'
```

## Expected Output

All 4 endpoints should return JSON with `"status": "success"` and metering data.

---

**Status**: Ready to integrate
**Priority**: HIGH
**Estimated Time**: 5 minutes to add code

