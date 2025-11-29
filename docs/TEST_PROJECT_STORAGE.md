# Project Storage Implementation - Testing Guide

**Date**: November 27, 2025  
**Status**: Implementation complete, ready for manual testing  
**File**: src/lib/projectStorage.ts, src/contexts/DAWContext.tsx

## What Was Implemented

### 1. localStorage Persistence Module (`src/lib/projectStorage.ts`)

**New Exports**:
- `saveProjectToStorage(project: Project | null): boolean` - Save project to localStorage
- `loadProjectFromStorage(): Project | null` - Load project from localStorage
- `clearProjectStorage(): void` - Remove saved project
- `hasSavedProject(): boolean` - Check if project exists
- `getStorageInfo()` - Get size/timestamp metadata
- `createAutoSaveInterval()` - Create auto-save hook

**Features**:
- 5MB storage limit protection
- Automatic metadata tracking (version, lastSaved, size)
- Error handling for QuotaExceededError
- Project structure validation on load
- Comprehensive logging

### 2. DAWContext Integration

**New Features**:
- Auto-save every 5 seconds (APP_AUTO_SAVE_INTERVAL)
- Project restoration on app mount
- Automatic localStorage sync on project changes
- Graceful error handling

**Modified Functions**:
- `togglePlay()` - Now works with restored projects
- `addTrack()` - Adds tracks persist to storage
- `setCurrentProject` → `handleSetCurrentProject` - Saves to localStorage
- `saveProject()` - Now also saves to localStorage immediately

## Manual Testing Checklist

### Test 1: Initial Project Creation & Auto-Save

**Steps**:
1. Go to http://localhost:5174
2. Create a new project (click "New Project")
3. Add 3-4 audio tracks
4. Wait 5 seconds
5. Open browser DevTools (F12) → Application → localStorage
6. Look for `corelogic_current_project` key

**Expected Result**:
- localStorage key exists
- Contains your project data
- Metadata shows current timestamp

**Acceptance Criteria**:
- ✅ Key exists after 5 seconds
- ✅ Project data is valid JSON
- ✅ Metadata.lastSaved is recent

---

### Test 2: Page Reload & Project Restoration

**Steps**:
1. Continue from Test 1
2. Create/modify tracks
3. Reload page (Ctrl+R or F5)
4. Wait for app to load

**Expected Result**:
- Project loads automatically (see DevTools for [DAWContext] Project restored message)
- All tracks from before reload are present
- Track names, volumes, etc. are unchanged

**Acceptance Criteria**:
- ✅ Tracks appear without manual loading
- ✅ Track count matches before reload
- ✅ Console shows "Project restored from localStorage"

---

### Test 3: Multiple Projects & Switch

**Steps**:
1. Continue from Test 2
2. Create a NEW project (File → New Project)
3. Add different tracks (e.g., 2 tracks)
4. Wait 5 seconds
5. Reload page
6. Check if it loads the NEW project (not the old one)

**Expected Result**:
- NEW project is loaded (2 tracks, not previous tracks)
- Only the most recent project is persisted

**Acceptance Criteria**:
- ✅ Correct project loaded after reload
- ✅ Previous project not restored

---

### Test 4: Storage Size Limit

**Steps**:
1. Create project with many large audio files
2. Add 50+ tracks
3. Wait 5 seconds
4. Open DevTools → Application → Storage
5. Check storage size

**Expected Result**:
- If project < 5MB: Saved normally
- If project > 5MB: Warning in console, fallback behavior

**Acceptance Criteria**:
- ✅ Project saves if under 5MB
- ✅ Console shows warning if over 5MB
- ✅ App doesn't crash

---

### Test 5: Clear Storage & Fresh Start

**Steps**:
1. Open DevTools → Application → localStorage
2. Find `corelogic_current_project`
3. Delete it (right-click → Delete)
4. Reload page

**Expected Result**:
- Fresh app (no project)
- Welcome modal appears
- Create new project

**Acceptance Criteria**:
- ✅ App doesn't crash on empty localStorage
- ✅ Can create new project
- ✅ Console shows "No saved project found"

---

### Test 6: Auto-Save Indicator (Future Feature)

**Current Status**: Not yet implemented

**Expected Behavior** (when implemented):
- TopBar shows "Saving..." for 1 second
- Then shows "Saved" or checkmark
- Error state shows red/orange

---

## Console Logs Expected

When testing, you should see these console messages (F12 → Console):

```javascript
// On app load
"[DAWContext] Project restored from localStorage"
OR
"[ProjectStorage] No saved project found"

// During auto-save (every 5 seconds)
"[ProjectStorage] Project saved to localStorage"

// On error
"[ProjectStorage] Failed to save project: [error details]"
"[ProjectStorage] Storage quota exceeded"

// On track changes
"[DAWContext] Track added"
"[DAWContext] Track updated"
```

---

## Troubleshooting

### Issue: "No saved project found" on every reload
**Cause**: localStorage not enabled or being cleared
**Fix**: 
- Check browser settings
- Make sure not in private/incognito mode
- Clear cache and try again
- Check console for errors

### Issue: Project data is incomplete after reload
**Cause**: Project structure validation failed
**Fix**:
- Check console for validation error
- Project may be corrupted
- Clear storage and start fresh

### Issue: Storage quota exceeded error
**Cause**: Projects too large for localStorage (>5MB)
**Fix**:
- Reduce number of tracks
- Don't load large audio files
- Use Supabase export instead

### Issue: Projects not auto-saving
**Cause**: Auto-save interval not triggering
**Fix**:
- Check DAWContext effect is running
- Verify setInterval wasn't cleared
- Check console for errors
- Try manual save (Ctrl+S)

---

## Storage Key Structure

```typescript
localStorage['corelogic_current_project'] = {
  project: {
    id: string,
    name: string,
    tracks: Track[],
    bpm: number,
    // ... other project properties
  },
  metadata: {
    version: 1,
    lastSaved: "2025-11-27T14:30:00.000Z",
    size: 45678,  // bytes
  }
}
```

---

## API Reference

### Save Project
```typescript
import { saveProjectToStorage } from '../lib/projectStorage';

const success = saveProjectToStorage(currentProject);
if (!success) console.error('Failed to save project');
```

### Load Project
```typescript
import { loadProjectFromStorage } from '../lib/projectStorage';

const project = loadProjectFromStorage();
if (project) {
  setCurrentProject(project);
}
```

### Check Storage Info
```typescript
import { getStorageInfo } from '../lib/projectStorage';

const info = getStorageInfo();
console.log(`Saved: ${info.hasSaved}, Size: ${info.size} bytes`);
```

---

## Next Steps

After verifying this implementation works:

1. **Task 2**: Add UI indicator in TopBar showing "Saving..."/"Saved"
2. **Task 3**: Implement project import/export (JSON files)
3. **Task 4**: Add audio device detection
4. **Task 5**: Enhance error handling across app

---

## Success Criteria (Production Ready)

- [x] localStorage persists project data
- [x] Auto-save every 5 seconds
- [x] Project restores on page load
- [x] Storage quota protection
- [x] Error handling & logging
- [ ] UI indicator for save state
- [ ] Project import/export UI
- [ ] User documentation

---

**Testing Date**: [Your Date Here]  
**Tester Name**: [Your Name Here]  
**Result**: [ ] PASS [ ] FAIL

**Notes**:
```
[Add any additional notes or issues found during testing]
```
