# Frontend-Backend Integration Quick Start Guide

## Prerequisites

1. **Node.js/npm**: For React development
2. **Python 3.10+**: For DSP backend
3. **Virtual Environment**: For Python isolation

---

## Step 1: Start the Backend (Python)

### Terminal 1 - Backend Setup & Run

```powershell
# Navigate to project root
cd i:\Packages\Codette\ashesinthedawn

# Create virtual environment (if needed)
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# Install Python dependencies
pip install fastapi uvicorn numpy scipy

# Start the backend server
python -m uvicorn daw_core.api:app --reload --port 8000
```

**Expected Output**:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

**Verify Backend**:
- Open browser: `http://localhost:8000/health`
- Should see: `{"status": "healthy", "version": "0.2.0"}`

---

## Step 2: Start the Frontend (React)

### Terminal 2 - Frontend Development

```powershell
# In a NEW terminal (keep backend running in Terminal 1)
cd i:\Packages\Codette\ashesinthedawn

# Install Node dependencies (if needed)
npm install

# Start development server
npm run dev
```

**Expected Output**:
```
VITE v5.4.0  ready in 123 ms

➜  Local:   http://localhost:5173/
➜  press h + enter to show help
```

**Open Application**:
- Browser: `http://localhost:5173/`
- Should see CoreLogic Studio DAW interface

---

## Step 3: Test Integration

### Verify Connection

The integration automatically connects to the backend on app startup.

**Test 1: Check Console**
1. Open DevTools: `F12` or `Ctrl+Shift+I`
2. Go to Console tab
3. You should see messages like:
   ```
   [BackendClient] Attempting connection...
   [BackendClient] ✓ Connected to backend
   [BackendClient] Backend version: 0.2.0
   ```

### Test 2: Use an Integrated Component

Once backend is running, you can test the integration by:

**Option A: Use Developer Console**
```typescript
// In browser console, test backend client directly
const client = window.backendClient; // If exported
const isAvailable = await client.isAvailable();
console.log('Backend available:', isAvailable);
```

**Option B: Create a Test Component**

Create file: `src/components/BackendTestPanel.tsx`

```tsx
import { useBackend } from '../hooks/useBackend';
import { useState } from 'react';

export default function BackendTestPanel() {
  const { isConnected, isLoading, error, analyzeLevel } = useBackend();
  const [result, setResult] = useState<any>(null);

  const handleTestAnalysis = async () => {
    // Create test audio data (1 second at 44.1kHz)
    const audioData = new Float32Array(44100);
    for (let i = 0; i < audioData.length; i++) {
      audioData[i] = Math.sin(2 * Math.PI * i / 44100) * 0.5; // -6dB sine wave
    }

    const levels = await analyzeLevel(Array.from(audioData));
    setResult(levels);
  };

  return (
    <div className="p-4 bg-gray-900 border border-gray-700 rounded">
      <h3 className="text-white mb-2">Backend Connection Test</h3>
      <p className={`mb-4 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
        Status: {isConnected ? '✓ Connected' : '✗ Disconnected'}
      </p>
      {error && <p className="text-red-500 mb-2">Error: {error}</p>}
      <button
        onClick={handleTestAnalysis}
        disabled={!isConnected || isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600"
      >
        {isLoading ? 'Testing...' : 'Test Level Analysis'}
      </button>
      {result && (
        <pre className="mt-4 text-green-400 text-sm overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
```

Then add to `src/components/TopBar.tsx` or main app component.

---

## Step 4: Test AI Recommendations

### Using Codette AI

```tsx
import { useBackend } from '../hooks/useBackend';
import { useDAW } from '../contexts/DAWContext';

export function AIRecommendationsPanel() {
  const { getAudioSuggestions } = useBackend();
  const { selectedTrack } = useDAW();
  const [suggestions, setSuggestions] = useState([]);

  const analyzeTrack = async () => {
    if (!selectedTrack) {
      alert('Please select a track first');
      return;
    }

    // Get audio data from selected track
    const audioData = [...]; // Retrieve from track

    const suggestions = await getAudioSuggestions(selectedTrack.id, audioData);
    setSuggestions(suggestions);
  };

  return (
    <div className="p-4">
      <button onClick={analyzeTrack}>Analyze with Codette AI</button>
      {suggestions.map((s, i) => (
        <div key={i} className="mt-2 p-2 bg-gray-800 rounded">
          <h4>{s.title}</h4>
          <p>{s.description}</p>
          <p>Impact: {s.impact} | Confidence: {(s.confidence * 100).toFixed(0)}%</p>
        </div>
      ))}
    </div>
  );
}
```

---

## Step 5: Test Individual Effects

### Test Compressor Processing

```typescript
const { processCompressor } = useBackend();

// Create test audio data
const audioData = new Float32Array(44100);
for (let i = 0; i < audioData.length; i++) {
  audioData[i] = Math.sin(2 * Math.PI * 440 * i / 44100) * 0.8; // 440Hz, -2dB
}

// Apply compression
const result = await processCompressor(Array.from(audioData), {
  threshold: -20,
  ratio: 4,
  attack: 0.005,
  release: 0.1,
  makeup_gain: 0,
});

console.log('Compressed audio:', result.output);
console.log('Gain reduction:', result.gain_reduction);
```

### Test Reverb Processing

```typescript
const { processReverb } = useBackend();

const result = await processReverb(audioData, {
  room_size: 0.5,
  damping: 0.5,
  wet_level: 0.3,
  dry_level: 0.7,
  width: 1.0,
});

console.log('Reverb output:', result.output);
```

---

## Troubleshooting

### Backend Not Connecting

**Issue**: "Backend unavailable" or connection refused

**Solutions**:
1. Verify backend is running: `http://localhost:8000/health` in browser
2. Check Python version: `python --version` (should be 3.10+)
3. Check dependencies installed: `pip list` (should show fastapi, uvicorn, numpy, scipy)
4. Check port 8000 not in use: `netstat -ano | findstr :8000` (Windows)

### Frontend Can't Find Backend

**Issue**: Console shows "Connection timeout"

**Solutions**:
1. Make sure both terminals are running
2. Check firewall isn't blocking localhost:8000
3. Try connecting directly in browser: `http://localhost:8000/`
4. Check CORS settings in `backendClient.ts` line ~30

### Type Errors in Components

**Issue**: "useBackend is not defined" or type errors

**Solutions**:
1. Ensure `src/hooks/useBackend.ts` file exists
2. Import correctly: `import { useBackend } from '../hooks/useBackend';`
3. Run `npm run typecheck` to see all errors
4. Check component is wrapped in `<DAWProvider>`

### Audio Data Processing Fails

**Issue**: Effect processing returns error

**Solutions**:
1. Verify audio data is Float32Array or array of numbers
2. Check effect parameters are in valid ranges
3. Look at backend console for Python errors
4. Ensure audio data length > 0 (not empty array)

---

## Performance Tips

1. **Batch Processing**: Process multiple effects together rather than one-by-one
2. **Background Tasks**: Use Web Workers for heavy analysis to avoid UI blocking
3. **Caching**: Codette AI caches audio profiles to avoid re-analysis
4. **Connection**: Backend client reuses HTTP connection (keep alive)

---

## Architecture Verification

### Check All Files Exist

```powershell
# Run this in project root:
Test-Path src/lib/backendClient.ts         # Should be True
Test-Path src/lib/codnetteAI.ts            # Should be True
Test-Path src/hooks/useBackend.ts          # Should be True
Test-Path daw_core/api.py                  # Should be True
```

### Verify TypeScript Compilation

```powershell
npm run typecheck
# Should show 0 errors (or pre-existing errors only)

# Or check just integration files:
npx tsc --noEmit src/lib/backendClient.ts src/lib/codnetteAI.ts src/hooks/useBackend.ts
# Should show ✓ Success
```

### Check Build Output

```powershell
npm run build
# Should show success and bundle size information
```

---

## Next Steps

1. ✅ Both servers running (backend + frontend)
2. ✅ Can see integration connection logs
3. ✅ Can test effect processing
4. ✅ Can receive AI recommendations
5. **Next**: Integrate into actual UI components (Mixer, TrackList, etc.)

---

## Support

- Backend logs: Check Terminal 1 (Python output)
- Frontend logs: Check DevTools Console (F12)
- Type issues: Run `npm run typecheck` for details
- Build issues: Run `npm run build` for error details

**Happy Music Production! 🎵**
