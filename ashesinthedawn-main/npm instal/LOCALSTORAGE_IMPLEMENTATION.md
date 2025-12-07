# LocalStorage Implementation - CoreLogic Studio

## Overview

CoreLogic Studio now uses **localStorage as the primary persistence layer** for project data, with optional Supabase integration for cloud backup when available.

**Status**: ✅ Production-ready (November 25, 2025)

## Architecture

### Primary Storage: localStorage

- **Location**: Browser's localStorage API
- **Storage Key**: `corelogic_current_project`
- **Size Limit**: 5MB per domain (enforced in code)
- **Persistence**: Persists across browser sessions until cleared
- **Auto-save**: Every 5 seconds via `createAutoSaveInterval()`

### Secondary Storage: Supabase (Optional)

- **Used when**: User is authenticated with Supabase
- **Purpose**: Cloud backup and multi-device sync
- **Fallback**: If Supabase unavailable, localStorage save still succeeds
- **Not required**: Application works completely offline with localStorage

## How It Works

### Save Flow

```
User Action (e.g., add track)
    ↓
updateTrack() → setTracks() → currentProject updated
    ↓
Auto-save triggers (every 5 seconds) or manual saveProject()
    ↓
saveProjectToStorage(project) [localStorage] ✓ SUCCEEDS
    ↓
Optional: supabase.from("projects").upsert() [cloud backup]
    ↓
Both succeed → Full redundancy
Only localStorage succeeds → User work is still saved
```

### Load Flow

```
App initialization or loadProject(projectId)
    ↓
loadProjectFromStorage() [check localStorage first]
    ↓
Found → Load immediately ✓
Not found → Try Supabase as fallback
    ↓
Supabase found → Load from cloud ✓
Supabase not found → Show project browser
```

## API Reference

### Core Functions (`src/lib/projectStorage.ts`)

#### `saveProjectToStorage(project: Project | null): boolean`
**Purpose**: Persist project to localStorage  
**Parameters**:
- `project`: Project object to save, or `null` to clear storage
**Returns**: `true` if successful, `false` on error
**Example**:
```typescript
import { saveProjectToStorage } from './lib/projectStorage';

const success = saveProjectToStorage(currentProject);
if (success) {
  console.log('Project saved');
}
```

#### `loadProjectFromStorage(): Project | null`
**Purpose**: Restore project from localStorage  
**Returns**: Project object if found, `null` otherwise
**Example**:
```typescript
import { loadProjectFromStorage } from './lib/projectStorage';

const project = loadProjectFromStorage();
if (project) {
  setCurrentProject(project);
}
```

#### `clearProjectStorage(): void`
**Purpose**: Erase saved project from localStorage  
**Use case**: New project creation, manual reset
**Example**:
```typescript
import { clearProjectStorage } from './lib/projectStorage';

clearProjectStorage();
```

#### `hasSavedProject(): boolean`
**Purpose**: Check if a saved project exists in storage  
**Returns**: `true` if project found, `false` otherwise

#### `getStorageInfo(): { hasSaved: boolean; size: number; lastSaved: string | null }`
**Purpose**: Get metadata about saved project  
**Returns**:
```typescript
{
  hasSaved: true,
  size: 45328,  // bytes
  lastSaved: '2025-11-25T14:30:00.000Z'  // ISO timestamp
}
```

#### `createAutoSaveInterval(project, onSave?): () => void`
**Purpose**: Set up automatic project saving every 5 seconds  
**Parameters**:
- `project`: Project to auto-save
- `onSave`: Optional callback `(success: boolean) => void`
**Returns**: Cleanup function to stop auto-save
**Example**:
```typescript
const cleanup = createAutoSaveInterval(currentProject, (success) => {
  if (!success) console.warn('Auto-save failed');
});

// Later: stop auto-saving
cleanup();
```

### Context Integration (`src/contexts/DAWContext.tsx`)

#### `saveProject(): Promise<void>`
**Behavior**:
1. Saves to localStorage (primary)
2. Attempts Supabase save if user authenticated (non-blocking)
3. Logs success/failure to console

**Called by**:
- User clicks "Save" button
- Auto-save timer (every 5 seconds)
- Project name/settings changes

#### `loadProject(projectId: string): Promise<void>`
**Behavior**:
1. Checks if project in localStorage
2. If found → loads immediately
3. If not found → tries Supabase fallback

**Called by**:
- Project browser selection
- Deep link navigation
- Manual project load

## Error Handling

### Storage Quota Exceeded
```typescript
// Handled in projectStorage.ts
if (error.code === 22) {  // DOMException for quota exceeded
  console.warn('Storage quota exceeded');
  // Project save fails gracefully
  // User should delete old projects or clear browser storage
}
```

### Invalid Project Structure
```typescript
// Validation in loadProjectFromStorage()
if (!project || !project.id || !Array.isArray(project.tracks)) {
  console.warn('Invalid project structure');
  return null;
}
```

### Supabase Unavailable
```typescript
// Non-blocking fallback in saveProject()
try {
  await supabase.from("projects").upsert(...);
} catch (error) {
  console.warn('Supabase unavailable (non-critical)');
  // localStorage save still succeeds
}
```

## Browser Storage Details

### Storage Location by Browser
| Browser | Location |
|---------|----------|
| Chrome | `~\AppData\Local\Google\Chrome\User Data\Default\Local Storage` |
| Firefox | `~\AppData\Roaming\Mozilla\Firefox\Profiles\*.default-release\storage` |
| Safari | `~/Library/Safari/LocalStorage` |
| Edge | `~\AppData\Local\Microsoft\Edge\User Data\Default\Local Storage` |

### Clearing Storage

**Via JavaScript**:
```typescript
localStorage.removeItem('corelogic_current_project');
// or
localStorage.clear();  // Clears all apps' localStorage
```

**Via Browser DevTools**:
- Chrome/Edge: DevTools → Application → Local Storage → Select domain → Delete all
- Firefox: DevTools → Storage → Local Storage → Right-click → Delete all
- Safari: Develop → Show Web Inspector → Storage → Local Files → Delete

## Migration from Supabase-Only

If project was previously saved only to Supabase:

1. Load project via `loadProject(projectId)`
2. Function detects localStorage miss
3. Falls back to Supabase fetch
4. Loads project into memory
5. Next auto-save writes to localStorage
6. Future loads check localStorage first (faster)

**No data loss**: Projects remain queryable from Supabase indefinitely.

## Size Limits

### Storage Quotas
| Browser | Limit | Notes |
|---------|-------|-------|
| Chrome | 10MB | Per origin, shared with all apps |
| Firefox | 10MB | Per origin, but can request more |
| Safari | 5MB | Per origin, strict limit |
| Edge | 10MB | Per origin |

### Project Size Estimation
- **Small project** (5 tracks, no audio): ~50KB
- **Medium project** (20 tracks, ~30s audio): ~2MB
- **Large project** (100+ tracks, complex): 5-20MB

**Recommendation**: Keep audio file references external (not embedded in project JSON).

## Testing localStorage

### Check if Available
```typescript
function isStorageAvailable() {
  try {
    const test = '__test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}
```

### Verify Project Saved
```typescript
const stored = JSON.parse(localStorage.getItem('corelogic_current_project'));
console.log('Saved project:', stored.project.name);
console.log('Last saved:', stored.metadata.lastSaved);
```

### Monitor Storage Usage
```typescript
// Chrome DevTools Console
console.log(performance.memory);  // Rough estimate
// DevTools → Application → Local Storage → Shows actual size
```

## Configuration

### Storage Settings
Located in `src/lib/projectStorage.ts`:

```typescript
const STORAGE_KEY = 'corelogic_current_project';        // Key for localStorage
const AUTO_SAVE_INTERVAL = 5000;                        // ms between saves
const MAX_STORAGE_SIZE = 5 * 1024 * 1024;               // 5MB limit
```

**To adjust**:
1. Edit constants in `projectStorage.ts`
2. Restart dev server
3. No rebuild required

## Debugging

### Enable Verbose Logging
```typescript
// In browser console
localStorage.setItem('DEBUG_PROJECT_STORAGE', 'true');
// Now all projectStorage operations log details
```

### Export Project for Inspection
```typescript
const project = JSON.parse(localStorage.getItem('corelogic_current_project'));
console.log(JSON.stringify(project, null, 2));
// Copy output to file for inspection
```

### Recovery from Corrupt Storage
```typescript
// Clear corrupted storage
localStorage.removeItem('corelogic_current_project');
// Refresh page
// Project starts fresh or loads from Supabase if available
```

## Best Practices

### For Users
1. **Regular Export**: Download projects as `.json` files monthly
2. **Clear Old Data**: Delete unused projects from browser storage
3. **Multi-Device**: Enable Supabase auth for cloud sync across devices
4. **Backup**: Export critical projects to external storage

### For Developers
1. **Always check localStorage first**: Faster than cloud
2. **Graceful Supabase fallback**: Don't hard-fail if unavailable
3. **Validate on load**: Check project structure before use
4. **Size limits**: Monitor for quota exceeded errors
5. **Error logging**: Console.error and console.warn for diagnostics

## Future Enhancements

- [ ] IndexedDB migration (unlimited storage, async)
- [ ] Project export/import versioning
- [ ] Automatic conflict resolution (localStorage vs Supabase)
- [ ] Project compression (reduce storage footprint)
- [ ] Service Worker caching (offline support)
- [ ] Multi-tab synchronization

---

**Updated**: November 25, 2025  
**Status**: Production Ready ✅  
**Tested Browsers**: Chrome 131, Firefox 133, Safari 18
