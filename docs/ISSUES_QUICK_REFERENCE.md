# CoreLogic Studio - Issues Quick Reference

## 🔴 Critical Issues (Blocking Production)

### 1. togglePlay() Race Condition
- **File**: `src/contexts/DAWContext.tsx` (lines 304-322)
- **Issue**: Audio starts before isPlaying state updates
- **Impact**: Resume from pause broken, unpredictable behavior
- **Fix Time**: 10 min
```typescript
// Current (BROKEN):
audioEngineRef.current.initialize().then(() => {
  // Plays immediately
  audioEngineRef.current.playAudio(...);
  setIsPlaying(true); // Set AFTER playing
});

// Fixed:
setIsPlaying(true); // Set first
await audioEngineRef.current.initialize();
tracks.forEach(track => {
  if (!track.muted && ['audio', 'instrument'].includes(track.type)) {
    audioEngineRef.current.playAudio(...);
  }
});
```

### 2. Mixer Volume Meters Show 0
- **File**: `src/components/Mixer.tsx` (lines 35-47)
- **Issue**: References `engine.getTrackLevel()` which doesn't exist
- **Impact**: No visual feedback of audio levels
- **Fix Time**: 15 min
```typescript
// Add to AudioEngine:
getTrackLevel(trackId: string): number {
  const gainNode = this.gainNodes.get(trackId);
  return gainNode ? gainNode.gain.value : 0;
}

// Or use analyser:
getTrackLevel(trackId: string): number {
  const trackAnalyser = this.trackAnalysers?.get(trackId);
  if (!trackAnalyser) return 0;
  const data = new Uint8Array(trackAnalyser.frequencyBinCount);
  trackAnalyser.getByteFrequencyData(data);
  const sum = data.reduce((a, b) => a + b, 0);
  return sum / (data.length * 255);
}
```

### 3. Automation Not Applied to Audio
- **File**: `src/contexts/DAWContext.tsx` (automation functions)
- **Issue**: Curves created but never modulate audio during playback
- **Impact**: Automation feature completely non-functional
- **Fix Time**: 45 min
```typescript
// Needs: Playback effect that applies automation points
useEffect(() => {
  if (isPlaying && automationCurves.size > 0) {
    const applyAutomation = setInterval(() => {
      automationCurves.forEach((curves, trackId) => {
        curves.forEach(curve => {
          const interpolatedValue = getAutomationValueAtTime(curve, currentTime);
          if (curve.parameter === 'volume') {
            audioEngineRef.current.setTrackVolume(trackId, interpolatedValue);
          } else if (curve.parameter === 'pan') {
            audioEngineRef.current.setTrackPan(trackId, interpolatedValue);
          }
          // etc.
        });
      });
    }, 50); // Update every 50ms
    return () => clearInterval(applyAutomation);
  }
}, [isPlaying, automationCurves, currentTime]);

// Also need interpolation function:
function getAutomationValueAtTime(curve: AutomationCurve, time: number): number {
  const sortedPoints = [...curve.points].sort((a, b) => a.time - b.time);
  const idx = sortedPoints.findIndex(p => p.time > time);
  
  if (idx === 0) return sortedPoints[0].value;
  if (idx === -1) return sortedPoints[sortedPoints.length - 1].value;
  
  const p1 = sortedPoints[idx - 1];
  const p2 = sortedPoints[idx];
  const t = (time - p1.time) / (p2.time - p1.time);
  
  // Linear interpolation (could add curve types)
  return p1.value + (p2.value - p1.value) * t;
}
```

### 4. MIDI Notes Don't Trigger
- **File**: `src/contexts/DAWContext.tsx` (lines 802-840)
- **Issue**: `handleMIDINote()` is placeholder only
- **Impact**: MIDI input non-functional
- **Fix Time**: 60+ min (needs synthesizer or better integration)
```typescript
// Current (PLACEHOLDER):
handleMIDINote = (note: number, velocity: number, channel: number) => {
  // Just logs, doesn't actually trigger audio
  console.log(`MIDI Note: ${note}`);
};

// Should trigger instrument track synthesis
// This is complex - needs:
// 1. MIDI note ↔ frequency mapping
// 2. Synthesizer on instrument track
// 3. Envelope control (ADSR)
```

---

## ⚠️ Important Issues (Should Fix)

### 5. Time Ruler Shows Random Values
- **File**: `src/components/Timeline.tsx` (line 92)
- **Issue**: Shows placeholder random numbers instead of real bar:beat
- **Impact**: Confusing UX, but doesn't break functionality
- **Fix Time**: 10 min
```typescript
// Current (BROKEN):
{(Math.floor(Math.random() * 4) + 1).toString().padStart(2, '0')}

// Should be bar/beat from currentProject.bpm:
const bpm = currentProject?.bpm || 120;
const beatsPerBar = 4; // Assume 4/4
const timeSeconds = (i / basePixelsPerBar * 4); // Convert pixels back to time
const totalBeats = (timeSeconds * bpm) / 60;
const bar = Math.floor(totalBeats / beatsPerBar) + 1;
const beat = Math.floor(totalBeats % beatsPerBar) + 1;
```

### 6. Recording Stop Not Async
- **File**: `src/contexts/DAWContext.tsx` (lines 354-371)
- **Issue**: Race condition between stop and save
- **Impact**: Recording might not save if context unloads
- **Fix Time**: 5 min
```typescript
// Make stop() async:
const stop = async () => {
  if (isRecording) {
    const blob = await audioEngineRef.current.stopRecording();
    if (blob) {
      const file = new File([blob], `Recording-${Date.now()}.webm`, { type: 'audio/webm' });
      await uploadAudioFile(file);
    }
    setIsRecording(false);
  }
  
  audioEngineRef.current.stopAllAudio();
  setIsPlaying(false);
  setCurrentTime(0);
};
```

### 7. Track Duration Never Set
- **File**: `src/contexts/DAWContext.tsx` + `src/components/TopBar.tsx`
- **Issue**: `track.duration` is undefined, so TopBar shows total duration as 0:00
- **Impact**: Misleading timeline information
- **Fix Time**: 10 min
```typescript
// In uploadAudioFile():
const newTrack: Track = {
  // ... other fields
  duration: audioEngineRef.current.getAudioDuration(newTrack.id),
};

// In TopBar, this will then work:
formatTime(tracks.reduce((max, track) => Math.max(max, track.duration || 0), 0))
```

### 8. CPU Meter Hardcoded
- **File**: `src/contexts/DAWContext.tsx` (line 108)
- **Issue**: Always shows 12%
- **Impact**: No real CPU feedback
- **Fix Time**: 30 min
```typescript
// Current:
const cpuUsage = 12;

// Should calculate actual usage:
// Option 1: Simple heuristic
const cpuUsage = calculateFromActiveTracks(tracks);
// Option 2: Measure audio processing time
// Option 3: Sample CPU via performance.measure()
```

### 9. TrackList Volume Meter Fake
- **File**: `src/components/TrackList.tsx` (line 109)
- **Issue**: Uses `Math.random()` instead of real level
- **Impact**: Misleading visual feedback
- **Fix Time**: 5 min
```typescript
// Current:
width: `${Math.random() * 100}%`

// Should use real level:
width: `${(levels[track.id] || 0) * 100}%`
// (where levels comes from Mixer's level polling)
```

### 10. Stereo Width Does Nothing
- **File**: `src/lib/audioEngine.ts` (lines 334-346)
- **Issue**: Placeholder only, no actual mid-side processing
- **Impact**: Stereo width control doesn't work
- **Fix Time**: 60+ min (complex DSP)
```typescript
// Current:
setStereoWidth(trackId: string, width: number): void {
  // Just normalizes value, doesn't process audio
  void (Math.max(0, Math.min(200, width)) / 100);
}

// Would need:
// 1. Decode stereo to M/S (mid/side)
// 2. Scale side channel by width factor
// 3. Re-encode back to L/R
// This requires audio processing nodes or OfflineAudioContext
```

---

## 📋 Compilation Errors (TypeScript)

### Error 1: AutomationTrack.tsx - Missing Dependency
- **File**: `src/components/AutomationTrack.tsx` (line 222)
- **Error**: React Hook useEffect has missing dependency: 'handleMouseMove'
- **Fix**: Add to dependency array or wrap in useCallback

### Error 2: automationEngine.ts - Lexical Declaration in Case
- **File**: `src/lib/automationEngine.ts` (lines 65, 70)
- **Error**: Unexpected lexical declaration in case block
- **Fix**: Wrap case block in curly braces
```typescript
// Before:
case 'exponential':
  const expT = 1 - Math.pow(1 - clampedT, 2);
  break;

// After:
case 'exponential': {
  const expT = 1 - Math.pow(1 - clampedT, 2);
  break;
}
```

### Error 3: audioClipProcessor.ts - Unexpected Any
- **File**: `src/lib/audioClipProcessor.ts` (lines 26, 69, 101)
- **Error**: Unexpected `any` type
- **Fix**: Create helper function
```typescript
const getAudioContextConstructor = () => 
  window.AudioContext || (window as any).webkitAudioContext;
```

---

## 🎯 Fix Priority

### Phase 1 (1-2 hours) - Critical Fixes
1. ✅ Fix togglePlay() race condition
2. ✅ Add getTrackLevel() to AudioEngine
3. ✅ Fix TypeScript errors

### Phase 2 (2-3 hours) - Important Fixes
4. ✅ Fix time ruler display
5. ✅ Fix track duration tracking
6. ✅ Make stop() async
7. ✅ Fix mixer level display

### Phase 3 (4-6 hours) - Feature Implementation
8. ✅ Implement automation playback loop
9. ✅ Implement MIDI note triggering
10. ✅ Add CPU metering

### Phase 4 (8+ hours) - Nice-to-Have
11. ✅ Stereo width processing
12. ✅ Enhanced effects algorithms
13. ✅ AudioWorklet migration

---

## ✅ Working Features (No Changes Needed)

- ✅ Track add/delete/select/update
- ✅ Audio file upload
- ✅ Playback (plays audio correctly when not paused/resumed)
- ✅ Recording (records audio, though error handling missing)
- ✅ Waveform caching and display
- ✅ Seek/scrub functionality
- ✅ Zoom controls
- ✅ Drag-and-drop audio
- ✅ Mute/Solo/Arm tracks
- ✅ Plugin add/remove/enable
- ✅ Bus routing
- ✅ MIDI device routing (setup only)
- ✅ Audio I/O device selection
- ✅ Test tone generation
- ✅ Undo/Redo
- ✅ Detachable mixer tiles
- ✅ UI modals and navigation

