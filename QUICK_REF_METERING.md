# Quick Reference: Metering Endpoints

## ?? Quick Start

### Start Server
```bash
python codette_server_unified.py
```

---

## ?? Endpoints

### 1. Level Meter
```bash
POST /daw/metering/level
```
**Body**: `{"audio_data": [float...], "sample_rate": 44100}`  
**Returns**: peak, rms, peak_db, rms_db, loudness_lufs, headroom

### 2. Spectrum Analyzer
```bash
POST /daw/metering/spectrum
```
**Body**: `{"audio_data": [float...], "sample_rate": 44100, "fft_size": 2048}`  
**Returns**: frequencies[], magnitudes[], num_bins

### 3. VU Meter
```bash
POST /daw/metering/vu
```
**Body**: `{"audio_data": [float...], "sample_rate": 44100}`  
**Returns**: vu_db, scaled

### 4. Correlation Meter
```bash
POST /daw/metering/correlation
```
**Body**: `{"audio_data": [[L,R]...], "sample_rate": 44100}`  
**Returns**: correlation, mono, stereo

---

## ?? Frontend Usage

```typescript
import { analyzeLevels, analyzeSpectrum, analyzeVU, analyzeCorrelation } from '../lib/dspBridge';

// Level analysis
const levels = await analyzeLevels(audioBuffer, 44100);
console.log('Peak:', levels.peak_db, 'dB');

// Spectrum analysis
const spectrum = await analyzeSpectrum(audioBuffer, 44100);
console.log('Frequencies:', spectrum.frequencies);

// VU reading
const vu = await analyzeVU(audioBuffer, 44100);
console.log('VU:', vu.vu_db, 'dB');

// Correlation
const corr = await analyzeCorrelation(audioBuffer, 44100);
console.log('Correlation:', corr.correlation);
```

---

## ?? Test Commands

```bash
# Level
curl -X POST http://localhost:8000/daw/metering/level \
  -H "Content-Type: application/json" \
  -d '{"audio_data":[0.1,0.5,-0.3,0.8],"sample_rate":44100}'

# Spectrum
curl -X POST http://localhost:8000/daw/metering/spectrum \
  -H "Content-Type: application/json" \
  -d '{"audio_data":[0.1,0.2,-0.1],"sample_rate":44100,"fft_size":2048}'

# VU
curl -X POST http://localhost:8000/daw/metering/vu \
  -H "Content-Type: application/json" \
  -d '{"audio_data":[0.3,0.3,0.3],"sample_rate":44100}'

# Correlation
curl -X POST http://localhost:8000/daw/metering/correlation \
  -H "Content-Type: application/json" \
  -d '{"audio_data":[[0.5,0.5],[0.3,0.4]],"sample_rate":44100}'
```

---

## ?? Status

? **COMPLETE** - All endpoints functional

---

## ?? Full Docs

See: `docs/PRIORITY_4_METERING_ENDPOINTS_COMPLETE.md`
