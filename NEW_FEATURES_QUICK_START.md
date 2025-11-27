# CoreLogic Studio - New Features Quick Start (November 27, 2025)

**Latest Update**: 4 new productivity features  
**Version**: 7.0.0+session  
**Status**: ✅ Ready for testing

---

## 🆕 What's New This Session

### 1. 📁 Project Auto-Save & Persistence

Your projects are now **automatically saved** to your browser every 5 seconds.

**What it does:**
- Work is never lost - even if browser crashes
- Projects restore automatically when you reload
- Status shown in TopBar with "Saving..." indicator

**How to use:**
1. Create a project with tracks
2. Wait 5 seconds - see "Saving..." in TopBar
3. Status changes to "Saved ✓"
4. Close browser/tab
5. Reopen - **project is restored automatically!**

**Storage Details:**
- Stored in browser's localStorage
- Up to 5MB per project
- Works offline

---

### 2. 💾 Export & Share Projects

Export your projects as JSON files for backup or sharing.

**How to export:**
1. Go to menu: **File → Export Project** (or use export modal)
2. File automatically downloads as `ProjectName-123456.corelogic.json`
3. Share the file with collaborators or keep as backup

**How to import:**
1. Go to menu: **File → Import Project** (or use import modal)
2. Select `.json` file from your computer
3. Project loads and replaces current project
4. All tracks and settings restored

**Limitations:**
- Audio files aren't included (project structure only)
- Max file size: 50MB
- Requires valid CoreLogic project format

**Use Cases:**
- ✅ Backup projects to external drive
- ✅ Share templates with other users
- ✅ Version control (different exports = versions)
- ✅ Archive completed projects

---

### 3. 🎙️ Audio Device Selection

Choose which microphone and speaker to use.

**How to use:**
1. Click Settings ⚙️ in TopBar
2. Scroll to "Audio Devices" section
3. Select your **Input Device** (microphone)
4. Select your **Output Device** (speaker)
5. Devices auto-detect when plugged in

**What you can do:**
- Switch between multiple audio interfaces
- Use external audio I/O
- Plug/unplug devices - app adapts automatically
- See device names and connection status

**Requirements:**
- Windows/Mac permission to access audio devices
- May need to grant microphone permission first time

---

### 4. 💡 Save Status Indicator

Visual feedback that your work is being saved.

**Where to look:**
- **TopBar, right side** (next to Codette status)

**What you'll see:**
- **Blue "Saving..."** - Project is being backed up
- **Green "Saved ✓"** - Successfully saved (lasts 2 seconds)
- **Red "Save error"** - Something went wrong

**What it means:**
- No action needed - fully automatic
- Reassurance that your work is protected
- Alert if something prevents saving

---

## 🎯 Suggested Workflow

### Typical Session

```
1. Start CoreLogic Studio
   ↓ (Auto-restores last project)

2. Add tracks and work on project
   ↓ Every 5 seconds: "Saving..."

3. Export project for backup
   Shortcut: File → Export Project
   ↓ Downloads: project-name.corelogic.json

4. Change audio devices if needed
   Shortcut: ⚙️ Settings → Audio Devices

5. Work continues...
   Watch save indicator in TopBar

6. Close browser
   ↓ Project automatically saved

7. Come back later
   ↓ (Auto-restores exactly where you left off)
```

---

## 🔧 Technical Details

### Storage

**localStorage Backup:**
- Automatic every 5 seconds
- Transparent to user
- Up to 5MB limit
- Browser restart: automatic restore

**File Export:**
- Format: `.corelogic.json`
- Includes project metadata
- Human-readable JSON
- Can be edited if needed

### Audio Devices

**Supported APIs:**
- MediaDevices for device enumeration
- AudioContext for audio routing
- Automatic device change detection

**Device Types:**
- Input: Microphones, line-in, USB audio
- Output: Speakers, headphones, USB audio

---

## ⚙️ Configuration

### Project Storage Settings

In `src/lib/projectStorage.ts`:
```typescript
const STORAGE_KEY = 'corelogic_current_project';
const AUTO_SAVE_INTERVAL = 5000; // 5 seconds
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB
```

### Import/Export Limits

In `src/lib/projectImportExport.ts`:
```typescript
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const SUPPORTED_FORMATS = ['.json', '.corelogic.json'];
```

---

## 🐛 Troubleshooting

### Project Not Saving?
- Check browser console (F12 → Console)
- Verify localStorage is enabled
- Make sure not in private/incognito mode
- Clear browser cache and try again

### Can't Find Saved Project?
- Check localStorage in DevTools (F12 → Application → localStorage)
- Look for key: `corelogic_current_project`
- Try hard refresh: Ctrl+Shift+R

### Import Fails?
- Verify file is valid JSON
- Check file size < 50MB
- Make sure file ends with `.json`
- Look for error message in alert

### Audio Devices Not Showing?
- Grant microphone permission when prompted
- Check OS audio settings
- Plug in audio device and wait 2 seconds
- Reload page if devices don't appear

---

## 📊 Feature Statistics

| Feature | Status | Lines | Impact |
|---------|--------|-------|--------|
| Project Storage | ✅ Live | 132 | High - Core data protection |
| Save Indicator | ✅ Live | 50 | Medium - UX feedback |
| Import/Export | ✅ Live | 260 | High - Sharing & backup |
| Device Selection | ✅ Live | 70 | Medium - Audio flexibility |

**Total**: ~512 lines of production code

---

## 🚀 What's Coming Next

### Short Term (Next Session)
- [ ] Performance optimization (bundle size)
- [ ] Keyboard shortcuts reference
- [ ] Enhanced error messages
- [ ] Mobile responsiveness testing

### Medium Term (2-3 Sessions)
- [ ] Audio file embedding in projects
- [ ] Cloud sync to Supabase
- [ ] Collaborative editing (multiple users)
- [ ] Project templates

### Long Term
- [ ] Real-time audio processing
- [ ] VST3 plugin support
- [ ] Professional mixing features
- [ ] Mobile app version

---

## 📖 For Developers

### Testing the New Features

#### 1. Test Project Storage
```bash
npm run dev
# 1. Create a project with tracks
# 2. Wait 5 seconds
# 3. Open F12 → Application → localStorage
# 4. Check for 'corelogic_current_project' key
# 5. Reload page - project restored
```

#### 2. Test Import/Export
```bash
# 1. Create a project
# 2. Export: File → Export Project
# 3. File downloads as .corelogic.json
# 4. Create new project
# 5. Import: File → Import Project
# 6. Select downloaded file
# 7. Verify tracks restored
```

#### 3. Test Audio Devices
```bash
# 1. Go to Settings ⚙️
# 2. Scroll to Audio Devices
# 3. See input/output dropdowns
# 4. Plug/unplug audio device
# 5. Devices should auto-update
```

#### 4. Test Save Indicator
```bash
# 1. Open DevTools Console (F12)
# 2. Make any change to project
# 3. Look at TopBar right side
# 4. See "Saving..." then "Saved ✓"
# 5. Check console for [ProjectStorage] logs
```

### Code References

- **Storage**: `src/lib/projectStorage.ts`
- **Import/Export**: `src/lib/projectImportExport.ts`
- **Save Hook**: `src/hooks/useSaveStatus.ts`
- **Device Hook**: `src/hooks/useAudioDevices.ts`
- **Context**: `src/contexts/DAWContext.tsx` (lines 1-50, 1350+)

---

## 📞 Support

### Common Questions

**Q: Where are my projects stored?**
A: Browser's localStorage (per domain/browser). Exported files go to Downloads folder.

**Q: Will projects sync across computers?**
A: Not automatically yet. Export/import manually, or use cloud features (coming soon).

**Q: Can I edit exported JSON files?**
A: Yes! They're human-readable JSON. Careful with structure though.

**Q: Do I need internet for auto-save?**
A: No - everything is local browser storage.

**Q: Can I recover deleted projects?**
A: If localStorage cleared - only if you exported first. Otherwise lost.

---

**Last Updated**: November 27, 2025  
**Ready for**: User testing & feedback  
**Next Session**: Browser verification + optimization
