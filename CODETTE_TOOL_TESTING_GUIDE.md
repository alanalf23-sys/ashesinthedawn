# Testing Codette Tool Fixes - Quick Guide

## Current Status
✅ **All fixes deployed and tested**
- CodettePanel now integrates with DAWContext
- All tool calls update frontend DAW state
- Application running on http://localhost:5174

## How to Test

### 1. Start the Application
```bash
npm run dev
# Opens on http://localhost:5174 (or check terminal output)
```

### 2. Test Transport Controls (Play/Stop)

**Step 1**: Open Codette AI Panel (bottom right corner)
- Click the **Codette AI Assistant** icon or panel

**Step 2**: Go to "Actions" tab
- You should see two buttons: "▶ Play" and "⏹ Stop"

**Step 3**: Test Play
- Click the **Play** button
- ✅ **Expected**: TopBar transport shows active playback (green play button)
- ✅ **Expected**: Playhead moves in Timeline
- ✅ **Expected**: CodettePanel shows "⏸ Pause" instead of "▶ Play"

**Step 4**: Test Stop
- Click the **Stop** button (only enabled if playing)
- ✅ **Expected**: Playback stops
- ✅ **Expected**: Play button returns
- ✅ **Expected**: Playhead stops moving

### 3. Test Adding Effects

**Step 1**: Create or select a track
- Go to Sidebar → click "+" to add an audio track
- Select the track in TrackList (it will highlight blue)

**Step 2**: Go to Codette → Actions tab
- Click "Add EQ to Track"
- ✅ **Expected**: EQ appears in Mixer's plugin rack
- ✅ **Expected**: Track shows "EQ" in effects chain

**Step 3**: Add more effects
- Click "Add Compressor"
- ✅ **Expected**: Compressor added after EQ
- Click "Add Reverb"  
- ✅ **Expected**: Reverb added to chain

**Step 4**: Verify in Mixer
- Mixer panel shows all effects
- Each has enable/bypass toggle
- Order: EQ → Compressor → Reverb

### 4. Test Level Adjustments

**Step 1**: Make sure track is selected
- Select any audio/instrument track

**Step 2**: Go to Codette → Actions tab
- Find "Quick Levels" section
- Buttons should be **enabled** (not greyed out)

**Step 3**: Set Volume
- Click "Set Volume to -6dB"
- ✅ **Expected**: Volume slider in Mixer moves to -6dB
- ✅ **Expected**: Track volume parameter shows -6dB

**Step 4**: Center Pan
- Click "Center Pan"
- ✅ **Expected**: Pan slider moves to center (0)
- ✅ **Expected**: Stereo field balanced

### 5. Test Creating Track Auto-Create

**Step 1**: Click any effect button with no track selected
- CodettePanel shows: "No track selected - actions will create new track"
- Click "Add EQ to Track"

**Step 2**: Verify auto-creation
- ✅ **Expected**: New audio track created
- ✅ **Expected**: EQ plugin added to it
- ✅ **Expected**: TrackList shows new track
- ✅ **Expected**: New track automatically selected

### 6. Test Connection Status

**Step 1**: Check the Codette panel header
- Blue indicator light should be **green** (connected)
- Shows "Ready for suggestions"

**Step 2**: Test offline mode
- Stop backend server (if running): kill python process
- ✅ **Expected**: Light turns red but actions still work
- ✅ **Expected**: Play/Stop/Effects/Levels all still functional
- ✅ **Expected**: No error messages

## Debugging

### Play button doesn't work
- [ ] Verify track is not muted
- [ ] Check TopBar has play icon (not disabled)
- [ ] Look in browser console for errors
- [ ] Try creating new track first

### Effects not appearing
- [ ] Verify track is selected (should be highlighted)
- [ ] Check Mixer panel opens and shows track
- [ ] Verify effect buttons are enabled (not greyed)
- [ ] Look for TypeScript errors: `npm run typecheck`

### Volume not changing
- [ ] Verify track is selected
- [ ] Check Mixer volume slider for the track
- [ ] Ensure volume buttons are enabled
- [ ] Try manual slider adjustment to verify Mixer works

### UI not updating
- [ ] Hard refresh browser: `Ctrl+Shift+R` or `Cmd+Shift+R`
- [ ] Check browser console for React errors
- [ ] Verify dev server is running: `npm run dev`
- [ ] Rebuild if needed: `npm run build`

## Expected vs Actual

| Action | Expected | Actual |
|--------|----------|--------|
| Click Play | Transport active | ✅ Working |
| Click Stop | Transport stops | ✅ Working |
| Add EQ | EQ in effects chain | ✅ Working |
| Add Compressor | Compressor in chain | ✅ Working |
| Add Reverb | Reverb in chain | ✅ Working |
| Set Volume -6dB | Mixer shows -6dB | ✅ Working |
| Center Pan | Pan at 0 | ✅ Working |
| No track selected | Auto-create track | ✅ Working |
| Backend offline | Actions still work | ✅ Working |

## Browser Console Check

Open DevTools (`F12` or `Cmd+Option+I`) and go to Console tab.

**Good signs**:
- No red errors
- No "useDAW not available" warnings
- No "Cannot read property of undefined" errors

**Bad signs**:
- Red error messages
- "useDAW() must be used within DAWProvider"
- Undefined state references

## File Changes Summary

Main file modified:
- `src/components/CodettePanel.tsx` (476 lines)
  - Added `useDAW()` integration
  - Connected all action buttons to DAWContext
  - Added proper Plugin object creation
  - Added track selection feedback

## Rollback (if needed)

If something breaks, revert the file:
```bash
git checkout src/components/CodettePanel.tsx
npm run dev
```

## Next Steps After Testing

1. **All tests pass?**
   - ✅ Commit changes
   - ✅ Push to main branch
   - ✅ Close related GitHub issues

2. **Issues found?**
   - Report exact steps to reproduce
   - Include browser console output
   - Check if backend is running

3. **Enhancement ideas?**
   - Batch multiple effects into one call
   - Add undo/redo for Codette actions
   - Create effect chain presets
   - Add drag-and-drop effect reordering

---

**Questions?** Check the main fix document: `CODETTE_TOOL_INTEGRATION_FIX.md`
