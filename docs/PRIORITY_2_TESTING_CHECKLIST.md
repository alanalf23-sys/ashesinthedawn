# ? Priority 2 Testing Checklist

**Implementation**: Unified Effect Processor  
**Date**: January 2025  
**Status**: Ready for Testing

---

## ?? Pre-Testing Requirements

### Backend Setup

- [ ] Python environment activated
- [ ] Dependencies installed: `pip install -r requirements.txt`
- [ ] Server running: `python codette_server_unified.py`
- [ ] Server port: 8000 (default) or check logs
- [ ] Health check passes: `curl http://localhost:8000/health`

### Frontend Setup

- [ ] Node modules installed: `npm install`
- [ ] Frontend running: `npm run dev`
- [ ] Frontend port: 5173 (default)
- [ ] Browser console open (F12)
- [ ] No CORS errors in console

---

## ?? Backend Tests

### Test 1: Health Check ?

**Purpose**: Verify server is running

```bash
curl http://localhost:8000/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "codette_available": true,
  "dsp_available": true,
  "timestamp": "2025-01-..."
}
```

**Result**: [ ] PASS [ ] FAIL

---

### Test 2: Effect Catalog ?

**Purpose**: Verify effect list endpoint works

```bash
curl http://localhost:8000/api/effects/list
```

**Expected Response**:
```json
{
  "categories": {
    "eq": {"effects": ["highpass", "lowpass", "3band", "parametric"], ...},
    "dynamics": {"effects": ["compressor", "limiter", "expander", "gate"], ...},
    ...
  },
  "total_effects": 19,
  "daw_core_available": true
}
```

**Result**: [ ] PASS [ ] FAIL

---

### Test 3: Single Effect (Compressor) ?

**Purpose**: Verify unified endpoint processes audio

```bash
curl -X POST http://localhost:8000/api/effects/process \
  -H "Content-Type: application/json" \
  -d '{
    "effect_type": "compressor",
    "parameters": {
      "threshold": -20,
      "ratio": 4,
      "attack": 0.005,
      "release": 0.1
    },
    "audio_data": [0.5, 0.8, -0.3, 0.2, -0.6],
    "sample_rate": 44100
  }'
```

**Expected Response**:
```json
{
  "status": "success",
  "effect": "compressor",
  "parameters": {...},
  "output": [...],  // 5 samples, compressed
  "length": 5,
  "sample_rate": 44100,
  "timestamp": "...",
  "daw_endpoint": "/daw/process/dynamics/compressor"
}
```

**Validation**:
- [ ] Status is "success"
- [ ] Output length matches input length (5)
- [ ] Output values are different from input (compression applied)
- [ ] daw_endpoint is correct

**Result**: [ ] PASS [ ] FAIL

---

### Test 4: Single Effect (Highpass) ?

**Purpose**: Verify EQ effects work

```bash
curl -X POST http://localhost:8000/api/effects/process \
  -H "Content-Type: application/json" \
  -d '{
    "effect_type": "highpass",
    "parameters": {"cutoff": 100},
    "audio_data": [0.1, 0.2, -0.1, 0.05],
    "sample_rate": 44100
  }'
```

**Expected Response**:
```json
{
  "status": "success",
  "effect": "highpass",
  "output": [...],
  "daw_endpoint": "/daw/process/eq/highpass"
}
```

**Result**: [ ] PASS [ ] FAIL

---

### Test 5: Single Effect (Reverb) ?

**Purpose**: Verify reverb effects work

```bash
curl -X POST http://localhost:8000/api/effects/process \
  -H "Content-Type: application/json" \
  -d '{
    "effect_type": "reverb",
    "parameters": {
      "room": 0.7,
      "damp": 0.5,
      "wet": 0.3
    },
    "audio_data": [0.5, -0.5, 0.3, -0.3],
    "sample_rate": 44100
  }'
```

**Expected Response**:
```json
{
  "status": "success",
  "effect": "reverb",
  "output": [...],
  "daw_endpoint": "/daw/process/reverb/freeverb"
}
```

**Result**: [ ] PASS [ ] FAIL

---

### Test 6: Effect Chain ?

**Purpose**: Verify serial effect processing

```bash
curl -X POST http://localhost:8000/api/effects/chain \
  -H "Content-Type: application/json" \
  -d '{
    "audio_data": [0.5, 0.7, -0.4, 0.2],
    "effect_chain": [
      {
        "type": "highpass",
        "parameters": {"cutoff": 80}
      },
      {
        "type": "compressor",
        "parameters": {
          "threshold": -20,
          "ratio": 4
        }
      }
    ],
    "sample_rate": 44100
  }'
```

**Expected Response**:
```json
{
  "status": "success",
  "output": [...],
  "chain_length": 2,
  "chain_results": [
    {"step": 1, "effect": "highpass", "status": "success"},
    {"step": 2, "effect": "compressor", "status": "success"}
  ]
}
```

**Validation**:
- [ ] chain_length is 2
- [ ] Both steps succeeded
- [ ] Output length matches input length

**Result**: [ ] PASS [ ] FAIL

---

### Test 7: Error Handling (Unknown Effect) ?

**Purpose**: Verify error messages are clear

```bash
curl -X POST http://localhost:8000/api/effects/process \
  -H "Content-Type: application/json" \
  -d '{
    "effect_type": "invalid_effect",
    "parameters": {},
    "audio_data": [0.1],
    "sample_rate": 44100
  }'
```

**Expected Response** (HTTP 404):
```json
{
  "detail": "Unknown effect type: invalid_effect. Available: ..."
}
```

**Validation**:
- [ ] HTTP status is 404
- [ ] Error message lists available effects

**Result**: [ ] PASS [ ] FAIL

---

### Test 8: Effect Name Normalization ?

**Purpose**: Verify case-insensitive matching

```bash
curl -X POST http://localhost:8000/api/effects/process \
  -H "Content-Type: application/json" \
  -d '{
    "effect_type": "COMPRESSOR",
    "parameters": {"threshold": -20, "ratio": 4},
    "audio_data": [0.5],
    "sample_rate": 44100
  }'
```

**Expected Response**:
```json
{
  "status": "success",
  "effect": "COMPRESSOR",
  ...
}
```

**Validation**:
- [ ] Uppercase effect name accepted
- [ ] Processing succeeds

**Result**: [ ] PASS [ ] FAIL

---

### Test 9: All 19 Effects ?

**Purpose**: Verify every effect is accessible

Test each effect individually:

- [ ] highpass
- [ ] lowpass
- [ ] 3band
- [ ] compressor
- [ ] limiter
- [ ] expander
- [ ] gate
- [ ] saturation
- [ ] distortion
- [ ] waveshaper
- [ ] hardclip
- [ ] delay
- [ ] pingpong
- [ ] multitap
- [ ] stereo_delay
- [ ] reverb
- [ ] hall
- [ ] plate
- [ ] room

**Template**:
```bash
curl -X POST http://localhost:8000/api/effects/process \
  -H "Content-Type: application/json" \
  -d '{
    "effect_type": "EFFECT_NAME",
    "parameters": {...},
    "audio_data": [0.5, -0.5],
    "sample_rate": 44100
  }'
```

**Result**: [ ] All PASS [ ] Some FAIL (list failures below)

---

## ?? Frontend Tests

### Test 10: DSP Bridge Initialization ?

**Purpose**: Verify frontend can connect to backend

Open browser console (F12) and run:

```javascript
import { initializeDSPBridge, getConnectionStatus } from '@/lib/dspBridge';

// Initialize
const connected = await initializeDSPBridge();
console.log('Connected:', connected);

// Check status
const status = getConnectionStatus();
console.log('Status:', status);
```

**Expected Output**:
```
Connected: true
Status: { connected: true, retries: 0, lastError: null }
```

**Result**: [ ] PASS [ ] FAIL

---

### Test 11: List Effects from Frontend ?

**Purpose**: Verify effect catalog accessible from frontend

```javascript
import { listAvailableEffects } from '@/lib/dspBridge';

const effects = await listAvailableEffects();
console.log('Total effects:', effects.total_effects);
console.log('Categories:', Object.keys(effects.categories));
```

**Expected Output**:
```
Total effects: 19
Categories: ["eq", "dynamics", "saturation", "delays", "reverb"]
```

**Result**: [ ] PASS [ ] FAIL

---

### Test 12: Process Effect from Frontend ?

**Purpose**: Verify audio processing works end-to-end

```javascript
import { processEffect } from '@/lib/dspBridge';

// Generate test audio (1 second sine wave at 440Hz)
const sampleRate = 44100;
const duration = 1;
const testAudio = new Float32Array(sampleRate * duration);
for (let i = 0; i < testAudio.length; i++) {
  testAudio[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.5;
}

// Process through compressor
const compressed = await processEffect(
  'compressor',
  testAudio,
  { threshold: -20, ratio: 4, attack: 0.005, release: 0.1 },
  sampleRate
);

console.log('Input length:', testAudio.length);
console.log('Output length:', compressed.length);
console.log('Input RMS:', Math.sqrt(testAudio.reduce((s, v) => s + v*v, 0) / testAudio.length));
console.log('Output RMS:', Math.sqrt(compressed.reduce((s, v) => s + v*v, 0) / compressed.length));
```

**Validation**:
- [ ] Input and output lengths match
- [ ] Output RMS is lower than input (compression applied)
- [ ] No errors in console
- [ ] Function returns Float32Array

**Result**: [ ] PASS [ ] FAIL

---

### Test 13: Effect Chain from Frontend ?

**Purpose**: Verify effect chaining works

```javascript
import { processEffectChain } from '@/lib/dspBridge';

const testAudio = new Float32Array(44100);
for (let i = 0; i < testAudio.length; i++) {
  testAudio[i] = Math.random() * 0.4 - 0.2; // Noise
}

const processed = await processEffectChain(
  testAudio,
  [
    { type: 'highpass', parameters: { cutoff: 80 } },
    { type: 'compressor', parameters: { threshold: -20, ratio: 4 } },
    { type: 'reverb', parameters: { room: 0.5, wet: 0.2 } }
  ],
  44100
);

console.log('Chain processed:', processed.length === testAudio.length);
```

**Validation**:
- [ ] Chain processes without errors
- [ ] Output length matches input
- [ ] Processing completes in <5 seconds

**Result**: [ ] PASS [ ] FAIL

---

### Test 14: Error Handling in Frontend ?

**Purpose**: Verify frontend handles errors gracefully

```javascript
import { processEffect } from '@/lib/dspBridge';

try {
  const result = await processEffect(
    'invalid_effect',
    new Float32Array([0.5]),
    {},
    44100
  );
  console.log('ERROR: Should have thrown!');
} catch (error) {
  console.log('Caught error correctly:', error.message);
}
```

**Expected Output**:
```
Caught error correctly: DSP request failed: Unknown effect type...
```

**Result**: [ ] PASS [ ] FAIL

---

### Test 15: Real Audio Playback ?

**Purpose**: Verify processed audio can be played

```javascript
import { processEffect } from '@/lib/dspBridge';

// Create AudioContext
const audioCtx = new AudioContext();

// Generate test tone
const sampleRate = audioCtx.sampleRate;
const duration = 2;
const testAudio = new Float32Array(sampleRate * duration);
for (let i = 0; i < testAudio.length; i++) {
  testAudio[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.3;
}

// Process with saturation
const processed = await processEffect(
  'saturation',
  testAudio,
  { drive: 5, tone: 0.5 },
  sampleRate
);

// Play processed audio
const buffer = audioCtx.createBuffer(1, processed.length, sampleRate);
buffer.getChannelData(0).set(processed);

const source = audioCtx.createBufferSource();
source.buffer = buffer;
source.connect(audioCtx.destination);
source.start();

console.log('Playing saturated tone for 2 seconds...');
```

**Validation**:
- [ ] Audio plays without errors
- [ ] Saturation effect is audible
- [ ] No clicks or pops in audio
- [ ] Volume is reasonable

**Result**: [ ] PASS [ ] FAIL

---

## ?? Results Summary

### Backend Tests

| Test | Status | Notes |
|------|--------|-------|
| Health Check | [ ] PASS [ ] FAIL | |
| Effect Catalog | [ ] PASS [ ] FAIL | |
| Compressor | [ ] PASS [ ] FAIL | |
| Highpass | [ ] PASS [ ] FAIL | |
| Reverb | [ ] PASS [ ] FAIL | |
| Effect Chain | [ ] PASS [ ] FAIL | |
| Error Handling | [ ] PASS [ ] FAIL | |
| Normalization | [ ] PASS [ ] FAIL | |
| All 19 Effects | [ ] PASS [ ] FAIL | |

### Frontend Tests

| Test | Status | Notes |
|------|--------|-------|
| DSP Bridge Init | [ ] PASS [ ] FAIL | |
| List Effects | [ ] PASS [ ] FAIL | |
| Process Effect | [ ] PASS [ ] FAIL | |
| Effect Chain | [ ] PASS [ ] FAIL | |
| Error Handling | [ ] PASS [ ] FAIL | |
| Audio Playback | [ ] PASS [ ] FAIL | |

### Overall Result

- **Tests Passed**: ___ / 15
- **Tests Failed**: ___ / 15
- **Pass Rate**: ____%

**Status**: [ ] READY FOR PRODUCTION [ ] NEEDS FIXES

---

## ?? Issues Found

### Issue 1
- **Test**: 
- **Symptom**: 
- **Cause**: 
- **Fix**: 

### Issue 2
- **Test**: 
- **Symptom**: 
- **Cause**: 
- **Fix**: 

---

## ?? Notes

### Performance Observations
- Average processing time: ___ ms
- Memory usage: ___ MB
- CPU usage: ___%

### User Experience
- Audio quality: 
- Latency: 
- Reliability: 

### Recommendations
1. 
2. 
3. 

---

## ? Sign-Off

**Tested By**: ___________________  
**Date**: ___________________  
**Status**: [ ] APPROVED [ ] NEEDS REVISION  

**Comments**:


---

**Testing Complete**: [ ] YES [ ] NO  
**Ready for Priority 3**: [ ] YES [ ] NO  
**Issues to Address**: [ ] NONE [ ] SEE ABOVE
