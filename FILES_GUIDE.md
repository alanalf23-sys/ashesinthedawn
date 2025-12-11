# ?? CoreLogic Studio - Files & Documentation Guide

## ?? START HERE

**New to the project?**
?? **[QUICK_START_CARD.md](QUICK_START_CARD.md)** - 2-minute quick reference

**Just want to start the server?**
?? **Double-click `START.bat`** - One-click startup

---

## ?? Quick Actions

### Start the System
```
Method 1: Double-click START.bat (easiest!)
Method 2: Run .\start-complete.ps1 in PowerShell
```

### Verify Everything is Working
```
Method 1: Double-click VERIFY.bat
Method 2: Run .\verify-backend.ps1 in PowerShell
```

### Start Backend Only
```
Method 1: Double-click START-BACKEND.bat
Method 2: Run .\start-backend.ps1 in PowerShell
```

---

## ?? Documentation Files

### Quick References
| File | Purpose | Read Time |
|------|---------|-----------|
| **QUICK_START_CARD.md** | One-page quick reference | 2 min |
| **HOW_TO_RUN_SCRIPTS.md** | How to run PowerShell scripts | 3 min |
| **CONNECTION_FIX_SUMMARY.md** | Complete startup guide | 5 min |

### Detailed Guides
| File | Purpose | Read Time |
|------|---------|-----------|
| **BACKEND_FIX_COMPLETE.md** | Comprehensive troubleshooting | 10 min |

---

## ??? Launcher Files (.bat)

**Double-click these files to run:**

| File | What It Does |
|------|--------------|
| **START.bat** | Starts backend + frontend automatically |
| **START-BACKEND.bat** | Starts backend server only |
| **VERIFY.bat** | Tests if backend is responding |

**Tip:** These are the easiest way to run the system!

---

## ?? PowerShell Scripts (.ps1)

**Run these in PowerShell terminal:**

### Main Scripts
| File | Command | Purpose |
|------|---------|---------|
| **start-complete.ps1** | `.\start-complete.ps1` | Full automated startup |
| **start-backend.ps1** | `.\start-backend.ps1` | Backend only with checks |
| **verify-backend.ps1** | `.\verify-backend.ps1` | Test backend connection |

### Utility Scripts
| File | Command | Purpose |
|------|---------|---------|
| **fix-backend.ps1** | `.\fix-backend.ps1` | Clean up hung processes |
| **check-ports.ps1** | `.\check-ports.ps1` | Port diagnostics |

---

## ?? You're All Set!

Just double-click **START.bat** and you're ready to go!

For detailed help, see the documentation files above.

**Happy creating! ????**
