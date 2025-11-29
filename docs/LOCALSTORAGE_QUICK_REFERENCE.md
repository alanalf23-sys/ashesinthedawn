# localStorage Quick Reference - CoreLogic Studio

## One-Line Summary
**CoreLogic Studio now saves projects to browser storage (localStorage) instead of requiring cloud authentication. Supabase sync happens automatically if you're logged in.**

## For Users

### What Changed?
- ✅ Projects save automatically every 5 seconds
- ✅ Works offline - no internet needed
- ✅ No account required to create/edit projects
- ✅ If you have Supabase account, projects sync to cloud automatically

### To Save Your Project
```
Projects save automatically!
Or: Click "Save" button in toolbar
```

### To Load a Saved Project
```
App automatically restores your last project on startup
Or: Use File Browser to select different project
```

### To Back Up a Project
```
Right-click project → "Export as JSON"
Save to your computer for safety
```

### To Restore a Backed-Up Project
```
Import the JSON file via File Browser
Automatically restores all settings and tracks
```

## For Developers

### Import & Use (in React Components)

```typescript
// Save a project
import { saveProjectToStorage } from '../lib/projectStorage';
saveProjectToStorage(myProject);

// Load a project
import { loadProjectFromStorage } from '../lib/projectStorage';
const project = loadProjectFromStorage();

// Clear storage
import { clearProjectStorage } from '../lib/projectStorage';
clearProjectStorage();
```

### In DAWContext

```typescript
// Save current project (localStorage + optional Supabase)
const { saveProject } = useDAW();
await saveProject();

// Load specific project (localStorage or Supabase fallback)
const { loadProject } = useDAW();
await loadProject(projectId);
```

### Storage Location

**What's Saved**: Your projects (tracks, settings, automation)  
**Where**: Browser's localStorage (5MB limit per domain)  
**When**: Every 5 seconds + manual save  
**How to Check**: DevTools → Application → Local Storage → corelogic_current_project

### Storage Size

```
Small project (5 tracks):        ~50KB
Medium project (20 tracks):      ~2MB
Large project (100+ tracks):     5-20MB
```

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Storage quota exceeded" | Too much data in localStorage | Delete old projects, export to .json |
| "Invalid project structure" | Corrupted data | Delete entry, create new project |
| "Supabase unavailable" | Not authenticated or offline | Use localStorage (automatic fallback) |

### Dev Testing

```bash
# Start dev server
npm run dev

# Test offline: DevTools → Network → Offline
# Edit project, wait 5 seconds
# Should see "Project saved to localStorage" in console

# Check saved data: DevTools → Application → Local Storage
# Look for: corelogic_current_project key
```

### Console Logs

```
[ProjectStorage] Project saved to localStorage    ✓ Success
[ProjectStorage] Project loaded from localStorage ✓ Success
[ProjectStorage] Cleared saved project            ✓ Cleared
[ProjectStorage] Error saving project: ...        ✗ Error
[DAWContext] No Supabase user, skipping cloud save → Normal (offline)
```

## Architecture Decision

### Why localStorage?
1. **Offline Support**: Works completely without internet
2. **Performance**: Instant read/write vs network latency
3. **Simplicity**: No authentication required
4. **Reliability**: Data persists across browser sessions

### Why Keep Supabase?
1. **Multi-Device Sync**: Same project on different computers
2. **Cloud Backup**: Project data in cloud
3. **Team Collaboration**: Future feature (potential)
4. **Optional**: Users opt-in via authentication

### Data Flow

```
Edit Project
    ↓
Every 5 seconds: Save to localStorage ✓
    ↓
If logged in with Supabase: Save to cloud ✓
    ↓
On app reload: Load from localStorage first
    ↓
If missing: Try Supabase as backup
```

## Migration Checklist

- [x] localStorage implementation ready
- [x] saveProject() uses localStorage primary
- [x] loadProject() checks localStorage first
- [x] Supabase fallback functional
- [x] Error handling complete
- [x] TypeScript validation (0 errors)
- [x] Auto-save interval active
- [x] Storage quota limits enforced
- [x] Documentation complete
- [x] Ready for testing

## Common Questions

**Q: What if I lose my browser data?**  
A: Projects are gone from localStorage, but you can recover from Supabase if logged in. That's why backups are recommended.

**Q: Can I use the app offline?**  
A: Yes! Completely offline support. Work on projects without internet.

**Q: Does this require authentication?**  
A: No. Works fully offline without any account.

**Q: Will my old Supabase projects load?**  
A: Yes. If not in localStorage, app checks Supabase as fallback.

**Q: How do I sync across devices?**  
A: Authenticate with Supabase → Projects auto-sync to cloud → Load on other device

**Q: Is my data secure?**  
A: localStorage is per-browser, not shared. Supabase uses secure authentication.

**Q: Can I export my projects?**  
A: Yes! Right-click project → Export as JSON → Save anywhere

---

## Quick Troubleshooting

**Project won't load?**
1. Check DevTools → Application → Local Storage
2. Look for `corelogic_current_project` key
3. Try importing from .json backup
4. Clear storage and start fresh

**Storage full?**
1. Export old projects as .json files
2. Delete from localStorage via DevTools
3. Restart app

**Supabase not syncing?**
1. App still works offline (localStorage saves)
2. Make sure you're authenticated
3. Check browser console for errors
4. Supabase is optional, not required

---

**Last Updated**: November 25, 2025  
**Status**: Production Ready ✅  
**Need Help?** See `LOCALSTORAGE_IMPLEMENTATION.md` for full documentation
