# Waveform System - Validation & Testing Guide

## Pre-Deployment Validation Checklist

### ✅ Code Quality

- [ ] TypeScript compilation: `npm run typecheck` (0 errors)
- [ ] ESLint validation: `npm run lint` (no warnings in new files)
- [ ] File imports resolve correctly
- [ ] No console errors in browser DevTools
- [ ] No TypeScript type errors in component usage

### ✅ Component Integration

- [ ] WaveformAdjuster.tsx renders without errors
- [ ] EnhancedTimeline.tsx imports correctly
- [ ] DAWContext exports all required methods
- [ ] useDAW() hook provides required data
- [ ] Component props match interface definitions

### ✅ Visual Rendering

- [ ] Waveform canvas displays correctly
- [ ] Colors render accurately
- [ ] Grid overlay shows when enabled
- [ ] Peak meter bar updates
- [ ] Playhead animates during playback
- [ ] All text labels display correctly

### ✅ Interactive Functionality

- [ ] Zoom buttons (±) adjust magnification
- [ ] Scale buttons (↑↓) adjust amplitude
- [ ] Color picker changes waveform color
- [ ] Grid toggle shows/hides grid
- [ ] Resolution dropdown changes accuracy
- [ ] Smoothing slider works smoothly
- [ ] Time input accepts valid times
- [ ] Click-to-seek functionality works

### ✅ Real-Time Performance

- [ ] Smooth animation at 60 FPS (no stuttering)
- [ ] Playhead updates match currentTime
- [ ] No lag when dragging/scrubbing
- [ ] Peak meter updates in real-time
- [ ] Canvas doesn't flicker
- [ ] Memory usage stable during long playback

### ✅ Audio Sync

- [ ] Playhead position matches actual playback
- [ ] Time display accurate to milliseconds
- [ ] Seeking to position works correctly
- [ ] Audio resumes from correct position
- [ ] Duration displays correctly

## Testing Procedures

### Test 1: Basic Rendering

**Prerequisites**: 
- App running with DAWProvider
- Audio track loaded with waveform data

**Steps**:
```
1. Open browser DevTools (F12)
2. Navigate to Timeline section
3. Verify:
   - Canvas element visible (no errors)
   - Waveform displayed (blue gradient)
   - Controls rendered below waveform
   - No console errors
```

**Expected Results**:
- ✅ Waveform visible in canvas
- ✅ All UI elements rendered
- ✅ Console shows no errors

---

### Test 2: Zoom Functionality

**Steps**:
```
1. Select audio track with waveform
2. Click zoom − button multiple times
3. Verify waveform expands horizontally
4. Click zoom + button multiple times
5. Verify waveform compresses back
```

**Expected Results**:
- ✅ Minimum zoom: 0.5x (very compressed)
- ✅ Maximum zoom: 4.0x (very expanded)
- ✅ Display value updates (0.5x format)
- ✅ Smooth transition without lag

---

### Test 3: Scale Functionality

**Steps**:
```
1. Click scale ↓ button multiple times
2. Verify waveform shrinks vertically
3. Click scale ↑ button multiple times
4. Verify waveform expands vertically
```

**Expected Results**:
- ✅ Minimum scale: 0.5x (quiet audio)
- ✅ Maximum scale: 3.0x (loud audio)
- ✅ Display value updates (0.5x format)
- ✅ Peaks remain visible at all scales

---

### Test 4: Color Picker

**Steps**:
```
1. Click color input square
2. Select different color from palette
3. Verify waveform changes color immediately
4. Select another color
5. Try custom colors (#FF0000, #00FF00, etc)
```

**Expected Results**:
- ✅ Color picker opens (browser native)
- ✅ Waveform updates in real-time
- ✅ Gradient fills update with new color
- ✅ No lag or flashing

---

### Test 5: Peak Meter

**Steps**:
```
1. Load audio with different volumes
2. Monitor peak bar during playback
3. Verify bar height matches amplitude
4. Check percentage display (0-100%)
5. Verify no clipping errors
```

**Expected Results**:
- ✅ Bar shows peak level (0-100%)
- ✅ Color gradient (green → yellow → red)
- ✅ Updates in real-time
- ✅ Matches visual waveform peaks

---

### Test 6: Grid Toggle

**Steps**:
```
1. Click Advanced button to expand
2. Check "Show Grid" checkbox
3. Verify grid overlay appears (8 columns)
4. Uncheck "Show Grid"
5. Verify grid disappears
```

**Expected Results**:
- ✅ Grid appears as vertical lines
- ✅ Grid spacing even (width / 8)
- ✅ Grid toggles instantly
- ✅ Waveform remains visible under grid

---

### Test 7: Resolution Control

**Steps**:
```
1. Click Advanced button to expand
2. Select "2K (2048)" option
3. Observe waveform smoothness
4. Select "8K (8192)" option
5. Verify higher detail/accuracy
```

**Expected Results**:
- ✅ Lower resolution: faster, less detail
- ✅ Higher resolution: slower, more detail
- ✅ Dropdown updates current value
- ✅ Waveform re-renders with new resolution

---

### Test 8: Smoothing Slider

**Steps**:
```
1. Set smoothing to 0% (sharp)
2. Verify waveform shows all peaks
3. Set smoothing to 50% (default)
4. Verify waveform looks smooth
5. Set smoothing to 100% (very smooth)
6. Verify waveform interpolated heavily
```

**Expected Results**:
- ✅ 0%: Sharp, jagged waveform
- ✅ 50%: Balanced appearance
- ✅ 100%: Smooth, interpolated curve
- ✅ Slider affects rendering in real-time

---

### Test 9: Playback Sync

**Prerequisites**: Audio track with duration > 2 seconds

**Steps**:
```
1. Click Play button
2. Observe playhead (green line) move
3. Watch time display update (M:SS.mmm format)
4. Listen for audio playing
5. Click Pause
6. Verify playhead stops
```

**Expected Results**:
- ✅ Playhead moves smoothly (60 FPS)
- ✅ Time updates to millisecond precision
- ✅ Audio plays in sync with playhead
- ✅ No stuttering or jitter

---

### Test 10: Click-to-Seek

**Steps**:
```
1. Click at 25% position on waveform
2. Verify playhead jumps to 25%
3. Time display updates to 25% position
4. Audio resumes from that point
5. Click at different positions
6. Verify accurate seeking
```

**Expected Results**:
- ✅ Playhead jumps to click position
- ✅ Time display updates immediately
- ✅ Audio position matches
- ✅ No clipping or artifacts

---

### Test 11: Drag-to-Scrub

**Steps**:
```
1. Click and hold on waveform
2. Drag left and right
3. Watch playhead follow mouse
4. Release mouse
5. Audio should continue from release point
```

**Expected Results**:
- ✅ Playhead follows mouse during drag
- ✅ Cursor changes to "grabbing"
- ✅ Smooth scrubbing (low latency)
- ✅ Status shows "Scrubbing..."

---

### Test 12: Time Input

**Steps**:
```
1. Click "Go to..." button
2. Enter time "0:15.500" (15.5 seconds)
3. Press Enter
4. Verify playhead jumps to 15.5s
5. Try different formats:
   - "0:30.000" (30 seconds)
   - "1:45.250" (1 min 45 sec)
   - "2:00.999" (near 2 minutes)
```

**Expected Results**:
- ✅ Input field appears
- ✅ Playhead jumps on Enter
- ✅ Time clamped to valid range
- ✅ Invalid formats handled gracefully

---

### Test 13: Multiple Tracks

**Prerequisites**: Multiple audio tracks loaded

**Steps**:
```
1. Select Track 1
2. Observe waveform for Track 1
3. Select Track 2
4. Verify waveform changes to Track 2
5. Verify time/duration updates
6. Switch between tracks rapidly
```

**Expected Results**:
- ✅ Waveform updates when track selected
- ✅ Time display matches track position
- ✅ Duration updates for each track
- ✅ No memory leaks on switching

---

### Test 14: Performance Under Load

**Prerequisites**: 5+ minute audio file

**Steps**:
```
1. Load long audio (5-30 minutes)
2. Play from beginning
3. Monitor browser performance:
   - Open DevTools → Performance tab
   - Record 10 seconds of playback
   - Check FPS (should be ~60)
4. Scrub through timeline
5. Toggle advanced options
```

**Expected Results**:
- ✅ FPS remains ~60 throughout
- ✅ Memory usage stable
- ✅ CPU usage moderate (<30%)
- ✅ No UI lag or stuttering

---

### Test 15: Edge Cases

**Test A: Zero-Duration Track**
```
1. Create track with no audio
2. Select track
3. Verify message "Select a track to view timeline"
4. No errors in console
```

**Test B: Very Quiet Audio**
```
1. Load very quiet audio (-80dB)
2. Set scale to 3.0x
3. Verify waveform still visible
4. Peak meter shows low level
```

**Test C: Very Loud Audio**
```
1. Load loud audio (approaching 0dB)
2. Verify no clipping artifacts
3. Peak meter shows high level (100% or near)
4. Waveform remains visible
```

**Test D: Extreme Zoom**
```
1. Set zoom to 4.0x (maximum)
2. Drag waveform horizontally
3. Seek to different positions
4. Verify playhead updates correctly
```

## Browser DevTools Debugging

### Console Checks

```javascript
// Check DAWContext is working
const daw = useDAW();
console.log('Selected Track:', daw.selectedTrack);
console.log('Current Time:', daw.currentTime);
console.log('Duration:', daw.getAudioDuration(daw.selectedTrack?.id));
console.log('Waveform Data:', daw.getWaveformData(daw.selectedTrack?.id));
```

### Performance Profiling

```
1. Open DevTools → Performance tab
2. Click Record button
3. Play audio for 30 seconds
4. Stop recording
5. Analyze frame timing:
   - Green: Good (60 FPS = 16.67ms per frame)
   - Yellow: OK (30-60 FPS)
   - Red: Bad (< 30 FPS)
```

### Memory Monitoring

```
1. Open DevTools → Memory tab
2. Take heap snapshot before playback
3. Play audio for 1 minute
4. Take heap snapshot after
5. Compare sizes (should be similar)
6. No large spikes = good
```

## Automated Testing Commands

```bash
# TypeScript validation
npm run typecheck

# ESLint check
npm run lint

# Both (CI check)
npm run ci

# Build check
npm run build

# Dev server with diagnostics
npm run dev -- --debug
```

## Acceptance Criteria

The waveform system is ready for production when:

✅ **All 15 tests pass** (manual or automated)
✅ **0 TypeScript errors** (`npm run typecheck`)
✅ **0 ESLint warnings** (`npm run lint`)
✅ **60 FPS performance** (smooth animation)
✅ **Responsive design** (works on mobile/tablet)
✅ **No console errors** (browser DevTools clean)
✅ **Accurate sync** (playhead ±1ms of actual time)
✅ **Fast seeking** (<100ms jump time)
✅ **Memory stable** (no leaks after 10min playback)
✅ **Documentation complete** (this file + WAVEFORM_SYSTEM_DOCUMENTATION.md)

## Post-Deployment Monitoring

### Metrics to Track

- Frame rate: Target 60 FPS
- Seek latency: Target <100ms
- Memory growth: Should be stable
- CPU usage: Should be <30% during playback
- User interactions: All buttons/sliders should be responsive

### Error Reporting

If users report issues:
1. Check browser console for errors
2. Verify DAWContext is initialized
3. Confirm audio file loaded successfully
4. Check system performance (CPU/RAM)
5. Review network conditions (if remote)

## Rollback Plan

If critical issues discovered:

```bash
# Revert to previous Timeline component
git checkout src/components/Timeline.tsx

# Remove new components
rm src/components/WaveformAdjuster.tsx
rm src/components/EnhancedTimeline.tsx

# Update App.tsx to use old Timeline
# Rebuild and redeploy
npm run build
```

---

**Validation Status**: Ready for testing ✅
**Last Updated**: November 24, 2025
**Test Coverage**: 15 scenarios + edge cases
**Documentation**: Complete
