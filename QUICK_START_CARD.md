# ?? CoreLogic Studio - Quick Start Card

## Easiest Way to Start

```
Double-click: START.bat
```

**That's it!** Wait 10 seconds, then open browser to `http://localhost:5173`

---

## All Launchers (Double-Click)

| File | What It Does |
|------|--------------|
| **START.bat** | Starts everything automatically |
| **START-BACKEND.bat** | Starts backend only |
| **VERIFY.bat** | Tests if backend is working |

---

## Manual Start (PowerShell)

```powershell
# Complete startup
.\start-complete.ps1

# Or step-by-step
.\start-backend.ps1    # Terminal 1
.\verify-backend.ps1   # Terminal 2 (verify)
npm run dev            # Terminal 2 (frontend)
```

---

## Quick Verification

**After starting, check:**

1. **Backend running?**
   - Look for: `Uvicorn running on http://0.0.0.0:8000`
   
2. **Backend responding?**
   - Double-click `VERIFY.bat`
   - Should show: `? SUCCESS!`

3. **Frontend running?**
   - Look for: `Local: http://localhost:5173/`

4. **Browser working?**
   - Open: http://localhost:5173
   - Press: **Ctrl+Shift+R** (hard refresh)
   - Check console (F12): No connection errors

---

## Stop Servers

**If you used START.bat:**
- Press `Ctrl+C` in the terminal window
- Or close the window

**If you used PowerShell scripts:**
```powershell
# Get job IDs from startup output, then:
Stop-Job <JobID>
Remove-Job <JobID>
```

**Nuclear option (kill all):**
```powershell
Get-Process python | Stop-Process -Force
Get-Process node | Stop-Process -Force
```

---

## Troubleshooting

### Backend won't start
```
Double-click: START-BACKEND.bat
Look for error messages in window
```

### Port 8000 already in use
```powershell
Get-Process python | Stop-Process -Force
```
Then try starting again.

### Frontend can't connect
1. Make sure backend is running (VERIFY.bat)
2. Hard refresh browser: Ctrl+Shift+R
3. Check console (F12) for errors

### Scripts give "execution policy" error
```
Use the .bat launchers instead!
(They bypass the policy automatically)
```

---

## File Reference

### Launchers (.bat - Double-Click)
- `START.bat` - Full startup
- `START-BACKEND.bat` - Backend only
- `VERIFY.bat` - Test connection

### Scripts (.ps1 - Run in PowerShell)
- `start-complete.ps1` - Full startup
- `start-backend.ps1` - Backend only
- `verify-backend.ps1` - Test connection
- `fix-backend.ps1` - Clean up hung processes
- `check-ports.ps1` - Port diagnostics

### Documentation
- `CONNECTION_FIX_SUMMARY.md` - Complete guide
- `HOW_TO_RUN_SCRIPTS.md` - Script execution help
- `BACKEND_FIX_COMPLETE.md` - Detailed troubleshooting

---

## URLs

- **Backend API:** http://localhost:8000
- **Backend Health:** http://localhost:8000/health
- **Frontend:** http://localhost:5173
- **API Docs:** http://localhost:8000/docs

---

## ? You're All Set!

**To start working:** Just double-click `START.bat` and you're ready to go!

**Need help?** Check `HOW_TO_RUN_SCRIPTS.md`

?? Happy creating! ??
