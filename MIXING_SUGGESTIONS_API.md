# Intelligent Mixing Suggestions API - Complete Guide

## ? What Was Added

Your OpenAI Assistant (`asst_qOBjSkFUAGVJgglhcnauiUZJ`) can now call the **Intelligent Mixing Suggestions** function to provide real-time, AI-powered audio mixing recommendations.

## ?? Features

### 1. Real-Time Audio Analysis
- **Frequency Analysis**: FFT-based spectrum analysis with 7 frequency bands
- **Dynamics Analysis**: RMS, peak, crest factor, dynamic range calculation
- **Problem Detection**: Identifies muddy, harsh, weak, or missing frequencies

### 2. Context-Aware Recommendations
- **Track-Type Specific**: Vocals, drums, bass, guitar, synth, etc.
- **Genre-Aware**: Adjusts suggestions based on musical style
- **BPM-Synced**: Tempo-synced effect recommendations
- **Project-Wide Context**: Considers mix balance and headroom

### 3. Actionable Suggestions
- **EQ Settings**: Specific frequencies, gains, Q values
- **Compression Parameters**: Ratio, attack, release, threshold
- **Gain Staging**: Peak level recommendations
- **Effects Chain**: Reverb, delay, spatial processing

## ?? How It Works

### OpenAI Assistant Function Call

When you ask the Assistant for mixing advice, it can call:

```json
{
  "name": "generate_intelligent_mixing_suggestions",
  "parameters": {
    "track_type": "vocals",
    "audio_data": [0.1, -0.2, 0.3, ...],  // Optional: actual audio samples
    "sample_rate": 44100,
    "track_info": {
      "peak_level": -8.5,
      "muted": false,
      "soloed": false,
      "volume": -6.0
    },
    "context": {
      "bpm": 120,
      "genre": "pop"
    }
  }
}
```

**Returns**:
```json
{
  "suggestions": [
    {
      "type": "eq",
      "title": "Vocal High-Pass Filter",
      "description": "Apply high-pass filter at 80-100Hz to remove rumble and mud",
      "parameters": {
        "frequency": 90,
        "slope": 12,
        "type": "high_pass"
      },
      "priority": 1,
      "confidence": 0.9,
      "reasoning": "Remove unnecessary low frequencies that muddy the mix"
    },
    {
      "type": "eq",
      "title": "Presence Boost",
      "description": "Boost 3-5kHz range by 2-3dB for vocal clarity and presence",
      "parameters": {
        "frequency": 4000,
        "gain": 2.5,
        "q": 1.5,
        "type": "peak"
      },
      "priority": 2,
      "confidence": 0.85,
      "reasoning": "Enhance vocal intelligibility and presence in the mix"
    }
  ],
  "total_suggestions": 5,
  "track_type": "vocals",
  "has_audio_analysis": true
}
```

## ?? REST API Endpoint

### Direct API Call (Without Assistant)

```bash
POST http://localhost:8000/codette/mixing-suggestions
POST http://localhost:8000/api/codette/mixing-suggestions
```

**Request Body**:
```json
{
  "track_type": "vocals",
  "audio_data": null,  // Optional: array of audio samples
  "sample_rate": 44100,
  "track_info": {
    "peak_level": -8.5,
    "muted": false,
    "soloed": false,
    "volume": -6.0
  },
  "context": {
    "bpm": 120,
    "genre": "pop"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "suggestions": [...],
    "total_suggestions": 5,
    "track_type": "vocals",
    "has_audio_analysis": false
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## ?? Track Types Supported

### Vocals
- High-pass filter at 80-100Hz
- Presence boost at 3-5kHz
- Compression 3:1 to 6:1
- De-essing at 6-8kHz
- Air shelf above 10kHz

### Drums
- Individual drum high-pass filtering
- Parallel compression for punch
- Transient enhancement
- Room reverb for depth

### Bass
- Sub-bass control (30-100Hz)
- Heavy compression (4:1 to 8:1)
- Mono below 120Hz
- Harmonic enhancement

### Guitar
- High-pass at 80-120Hz
- Notch harsh frequencies
- Stereo width control
- Amp simulation recommendations

### Synth
- Genre-specific EQ curves
- Stereo field positioning
- Filter modulation suggestions
- Layer balance

## ?? Intelligent Analysis

### Frequency Band Analysis

The system analyzes 7 frequency bands:

| Band | Range | Characteristics |
|------|-------|-----------------|
| Sub Bass | 20-60Hz | Felt vibration, rumble |
| Bass | 60-250Hz | Warmth, punch, body |
| Low Mids | 250-500Hz | Body, potential mud zone |
| Mids | 500-2kHz | Clarity, presence, vocal core |
| Upper Mids | 2k-4kHz | Attack, definition, harshness risk |
| Highs | 4k-8kHz | Edge, sparkle, sibilance zone |
| Air | 8k-20kHz | Shimmer, openness, breathiness |

### Problem Detection

Automatically detects:
- **Muddy Low-Mids** (>25% energy in 250-500Hz)
- **Harsh Upper-Mids** (>30% energy in 2-4kHz)
- **Weak Bass** (<10% energy in 60-250Hz)
- **Missing Air** (<5% energy in 8-20kHz)
- **Clipping Risk** (peaks above -3dBFS)
- **Low Signal** (peaks below -12dBFS)

### Dynamics Analysis

Calculates:
- **RMS Level**: Average power
- **Peak Level**: Maximum amplitude
- **Crest Factor**: Peak-to-RMS ratio
- **Dynamic Range**: In dB (20 * log10(crest factor))

**Recommendations**:
- Wide range (>20dB): Heavy compression (4:1 to 8:1)
- Moderate range (12-20dB): Gentle compression (2:1 to 3:1)
- Already compressed (<8dB): Reduce compression or use parallel

## ?? Example Use Cases

### 1. Chat with Assistant

```bash
User: "I have a vocal track that sounds muddy. How do I fix it?"