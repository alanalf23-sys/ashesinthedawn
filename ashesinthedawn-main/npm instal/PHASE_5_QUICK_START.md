# Phase 5 Quick Reference - Session, Undo/Redo & Metering

## Session Manager Quick Reference

### Basic Usage

```typescript
import { getSessionManager } from '../lib/sessionManager';

const sessionManager = getSessionManager();

// Create new session
const session = sessionManager.createSession(
  "My Mix",
  48000,  // Sample rate
  120     // BPM
);

// Save current session
const sessionId = await sessionManager.saveSession();

// Load session
await sessionManager.loadSession(sessionId);

// Get all sessions
const allSessions = await sessionManager.getAllSessions();
allSessions.forEach(s => {
  console.log(`${s.name} - Modified: ${new Date(s.metadata.modified)}`);
});

// Auto-save every minute
sessionManager.startAutoSave(60000);

// Create backup before major changes
const backupId = await sessionManager.createBackup(sessionId);

// Delete session
await sessionManager.deleteSession(sessionId);
```

### Session Data Structure

```typescript
interface DAWSession {
  id: string;                          // Unique session ID
  name: string;                         // "My Mix"
  description: string;                 // Optional description
  sampleRate: number;                  // 48000, 44100, etc
  bpm: number;                         // 120
  timeSignature: {                     // 4/4
    numerator: number;
    denominator: number;
  };
  tracks: SessionTrack[];              // All tracks with data
  busses: SessionBus[];                // Bus configuration
  masterSettings: MasterSettings;      // Master fader, metronome
  automationData: AutomationData[];    // All automation curves
  pluginChains: PluginChainData[];    // Effect chains
  midiMappings: MidiMappingData[];    // MIDI controller maps
  metadata: {
    created: number;                   // Timestamp
    modified: number;                  // Last edited
    author: string;                    // "User"
    version: number;                   // 1
    tags: string[];                    // ["mix", "master"]
    backupCount: number;               // 3
    lastBackup: number;                // Timestamp
  };
}
```

---

## Undo/Redo Manager Quick Reference

### Basic Usage

```typescript
import { getUndoRedoManager, ActionType } from '../lib/sessionManager';

const undoRedo = getUndoRedoManager();

// Execute action (automatically adds to history)
undoRedo.executeAction(
  ActionType.CREATE_TRACK,
  "Create Audio Track",
  { 
    trackType: 'audio',
    trackName: 'Guitar',
    color: '#FF6B6B'
  },
  {
    trackId: 'track_xyz'  // For undo
  }
);

// Undo last action
if (undoRedo.canUndo()) {
  const undoneAction = undoRedo.undo();
  console.log(`Undid: ${undoneAction.description}`);
}

// Redo last undone action
if (undoRedo.canRedo()) {
  const redoneAction = undoRedo.redo();
  console.log(`Redid: ${redoneAction.description}`);
}

// Get full history
const history = undoRedo.getHistory();
history.forEach((action, index) => {
  console.log(`${index}: ${action.type} - ${action.description}`);
});

// Subscribe to actions
const unsubscribe = undoRedo.onActionExecuted((action) => {
  console.log(`User did: ${action.description}`);
  // Update UI buttons: enable/disable undo/redo
});

// Clear history
undoRedo.clearHistory();
```

### Action Types

```typescript
enum ActionType {
  CREATE_TRACK = 'CREATE_TRACK',           // Add new track
  DELETE_TRACK = 'DELETE_TRACK',           // Remove track
  UPDATE_TRACK = 'UPDATE_TRACK',           // Change track settings
  CREATE_CLIP = 'CREATE_CLIP',             // Add audio/MIDI clip
  DELETE_CLIP = 'DELETE_CLIP',             // Remove clip
  MOVE_CLIP = 'MOVE_CLIP',                 // Drag clip position
  LOAD_PLUGIN = 'LOAD_PLUGIN',             // Insert effect
  SET_PARAMETER = 'SET_PARAMETER',         // Change effect param
  CREATE_AUTOMATION = 'CREATE_AUTOMATION', // Start automation curve
  DELETE_AUTOMATION = 'DELETE_AUTOMATION', // Remove automation
  CREATE_BUS = 'CREATE_BUS',               // Add submix bus
  DELETE_BUS = 'DELETE_BUS',               // Remove bus
  ROUTE_TRACK = 'ROUTE_TRACK',             // Change track output
  CREATE_MIDI_MAPPING = 'CREATE_MIDI_MAPPING',
  DELETE_MIDI_MAPPING = 'DELETE_MIDI_MAPPING'
}
```

### Using with UI

```typescript
import { useState, useEffect } from 'react';
import { getUndoRedoManager } from '../lib/sessionManager';

export default function UndoRedoButtons() {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const undoRedo = getUndoRedoManager();

  useEffect(() => {
    const unsubscribe = undoRedo.onActionExecuted(() => {
      setCanUndo(undoRedo.canUndo());
      setCanRedo(undoRedo.canRedo());
    });
    return unsubscribe;
  }, []);

  return (
    <div>
      <button 
        onClick={() => undoRedo.undo()} 
        disabled={!canUndo}
      >
        ↶ Undo
      </button>
      <button 
        onClick={() => undoRedo.redo()} 
        disabled={!canRedo}
      >
        ↷ Redo
      </button>
    </div>
  );
}
```

---

## Metering Engine Quick Reference

### Basic Usage

```typescript
import { getMeteringEngine, MeteringMode } from '../lib/meteringEngine';

const metering = getMeteringEngine();

// Start metering on audio source
metering.startMeteringOnAudioSource(audioNode);

// Subscribe to real-time metering data
const unsubscribe = metering.onMeteringUpdate((data) => {
  console.log('Metrics:', {
    shortTermLUFS: data.metrics.shortTermLUFS,  // -10 LUFS
    integratedLUFS: data.metrics.integratedLUFS, // -11 LUFS
    truePeak: data.metrics.truePeak,            // -0.3 dBFS
    headroom: data.metrics.headroom,            // 0.3 dB
    phaseCorrelation: data.metrics.phaseCorrelation, // 0.95
  });

  // Track-level metrics
  data.trackMetrics.forEach((metrics, trackId) => {
    console.log(`Track ${trackId}:`, {
      peakLevel: metrics.peakLevel,
      lufs: metrics.lufs,
      truePeak: metrics.truePeak,
    });
  });

  // Update spectrum display
  const spectrum = data.spectrum; // Uint8Array of frequencies
});

// Set metering mode
metering.setMeteringMode(MeteringMode.LUFS);

// Get peak hold values
const peakHold = metering.getPeakHold();      // Highest peak seen
const truePeakHold = metering.getTruePeakHold();

// Reset peak holds
metering.resetMeters();

// Stop metering
metering.stopMetering();
```

### Metering Modes

```typescript
enum MeteringMode {
  PEAK = 'peak',                        // Simple level meter
  RMS = 'rms',                          // Root Mean Square level
  LUFS = 'lufs',                        // ITU-R BS.1770-4 loudness
  TRUE_PEAK = 'true_peak',              // Oversampled peak detection
  PHASE_CORRELATION = 'phase_correlation',  // Stereo image
  SPECTRUM = 'spectrum'                 // Real-time FFT
}
```

### Loudness Standards

| Standard | Target | Use Case |
|----------|--------|----------|
| EBU R128 | -23 LUFS | European streaming |
| ATSC A/85 | -24 LKFS | US broadcast |
| Apple Music | -16 LUFS | Music streaming |
| YouTube | -14 LUFS | Video content |
| Podcast | -16 LUFS | Audio content |
| Mastering | -5 to -1 LUFS | Pre-distribution |

### Using in UI Component

```typescript
import { useEffect, useState } from 'react';
import { getMeteringEngine, MeteringMode } from '../lib/meteringEngine';

export default function MeteringPanel() {
  const [metrics, setMetrics] = useState(null);
  const metering = getMeteringEngine();

  useEffect(() => {
    const unsubscribe = metering.onMeteringUpdate((data) => {
      setMetrics(data.metrics);
    });

    return unsubscribe;
  }, []);

  if (!metrics) return <div>No metering data</div>;

  return (
    <div className="metering-panel">
      <div>
        <strong>Short Term:</strong> {metrics.shortTermLUFS.toFixed(1)} LUFS
      </div>
      <div>
        <strong>Integrated:</strong> {metrics.integratedLUFS.toFixed(1)} LUFS
      </div>
      <div>
        <strong>True Peak:</strong> {metrics.truePeak.toFixed(1)} dBFS
      </div>
      <div>
        <strong>Headroom:</strong> {metrics.headroom.toFixed(2)} dB
      </div>
      <div>
        <strong>Phase:</strong> {(metrics.phaseCorrelation * 100).toFixed(0)}%
      </div>
    </div>
  );
}
```

### Loudness Meter Implementation

```typescript
export default function LoudnessMeter() {
  const [lufs, setLufs] = useState(-Infinity);
  const metering = getMeteringEngine();

  useEffect(() => {
    const unsubscribe = metering.onMeteringUpdate((data) => {
      setLufs(data.metrics.shortTermLUFS);
    });

    return unsubscribe;
  }, []);

  // Color coding for loudness
  let color = '#4ECDC4'; // Normal (blue)
  if (lufs > -5) color = '#FF6B6B';      // Too loud (red)
  else if (lufs > -10) color = '#FFA07A'; // Getting loud (orange)
  else if (lufs < -30) color = '#FFD700'; // Too quiet (yellow)

  return (
    <div style={{ backgroundColor: color, padding: '10px' }}>
      {lufs === -Infinity ? 'No Signal' : `${lufs.toFixed(1)} LUFS`}
    </div>
  );
}
```

---

## Keyboard Shortcuts (to implement)

```typescript
// In your keyboard event handler:

window.addEventListener('keydown', (e) => {
  // Undo: Ctrl+Z (Windows/Linux) or Cmd+Z (Mac)
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault();
    undoRedo.undo();
  }

  // Redo: Ctrl+Shift+Z or Ctrl+Y
  if ((e.ctrlKey || e.metaKey) && (
    (e.key === 'z' && e.shiftKey) ||
    e.key === 'y'
  )) {
    e.preventDefault();
    undoRedo.redo();
  }

  // Save: Ctrl+S
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    sessionManager.saveSession();
  }
});
```

---

## Common Patterns

### Pattern 1: Execute Action on Track Creation

```typescript
// In DAWContext createTrack method:
const trackId = `track_${Date.now()}`;
const newTrack = { id: trackId, name, type, ... };

this.setState({ tracks: [...this.state.tracks, newTrack] });

undoRedo.executeAction(
  ActionType.CREATE_TRACK,
  `Create ${type} track "${name}"`,
  { trackType: type, trackName: name, color },
  { trackId }
);
```

### Pattern 2: Batch Operations

```typescript
// Save multiple changes as one undo point
undoRedo.executeAction(
  ActionType.UPDATE_TRACK,
  'Update track settings',
  { 
    trackId,
    volume: -6,
    pan: 0.25,
    muted: false
  },
  {
    trackId,
    previousVolume: -3,
    previousPan: 0,
    previousMuted: true
  }
);
```

### Pattern 3: Conditional Undo

```typescript
// Only undo if there's something to undo
if (undoRedo.canUndo()) {
  const action = undoRedo.undo();
  
  // Apply the reverse action data
  applyReverseAction(action.type, action.reverse);
}
```

---

## Troubleshooting

### Session not saving?
- Check localStorage quota: `console.log(navigator.storage.estimate())`
- Verify session ID exists
- Check browser console for storage errors

### Undo/Redo not working?
- Verify ActionType is correct
- Ensure both `data` and `reverse` provided
- Check history limit (100 actions max)
- Look for errors in onActionExecuted listeners

### Metering showing -Infinity?
- Verify audio is playing
- Check audio node is connected
- Ensure startMeteringOnAudioSource called
- Verify audio buffer has samples

---

## Performance Tips

1. **Session Size**: Each session ~50-500 KB depending on complexity
2. **Undo History**: Limited to 100 actions to manage memory
3. **Metering**: Uses requestAnimationFrame, ~60 FPS max
4. **Storage**: localStorage typically 5-10 MB per domain
5. **Cleanup**: Always unsubscribe from listeners to prevent memory leaks

---

## Integration Checklist

- [ ] Import managers in DAWContext
- [ ] Initialize on DAW startup
- [ ] Connect keyboard shortcuts
- [ ] Add UI buttons for undo/redo
- [ ] Display metering in mixer/master
- [ ] Show session save indicator
- [ ] Add session browser modal
- [ ] Implement auto-save interval
- [ ] Test with complex project
- [ ] Verify performance with many actions

