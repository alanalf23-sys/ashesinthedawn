# Open Project - Testing Guide

## Quick Test Steps

1. **Start the app** - Already running at http://localhost:5173

2. **Test Open Project Button**
   - Look for the Welcome Modal on startup
   - Click the "Open Project" button (middle button with folder icon)
   - This should open your system's file picker
   - Select the `test-project.json` file from this folder
   - You should see "Project loaded successfully!" message
   - The modal should close and load the project

3. **Test from Sidebar**
   - If project is already open, go to Sidebar → Projects tab
   - Click "Open Another Project" button
   - Select a different project file
   - Project should load in background

## Test Project File

A sample project file is included: `test-project.json`

It contains:
- 3 test tracks (Vocals, Drums, Bass)
- 48kHz sample rate, 24-bit depth
- 120 BPM, 4/4 time signature
- Ready to import into DAW

## Debugging

Check browser console (F12) for debug logs:
- "Browse clicked, file input ref: ..." - Button click
- "File selected: test-project.json" - File picked
- "File content read, parsing JSON..." - Reading
- "Project loaded: Test Project" - Success
- Any errors will also be logged

## Troubleshooting

**Issue**: File picker doesn't open
- Make sure you're clicking the button (not somewhere else on the dialog)
- Check browser console for "Browse clicked" message
- File input ref should not be null

**Issue**: File loads but nothing happens
- Check if error messages appear (red box)
- Verify project JSON is valid:
  - Must have: id, name, tracks (array)
  - Check browser console for parse errors

**Issue**: Project loads but tracks don't show
- Check if WelcomeModal closes properly
- App should display main UI with tracks
- Check Sidebar > Projects tab to see loaded project

## Project JSON Format

Minimum required:
```json
{
  "id": "unique-id",
  "name": "Project Name",
  "tracks": []
}
```

Optional fields:
```json
{
  "sampleRate": 48000,
  "bitDepth": 24,
  "bpm": 120,
  "timeSignature": "4/4",
  "buses": [],
  "createdAt": "ISO-8601-date",
  "updatedAt": "ISO-8601-date"
}
```

Each track needs: id, name, type, volume, pan, muted, soloed, armed, etc.

---

**Status**: Ready to test ✅
