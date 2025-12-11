# ?? Backend Connection Fix - Step-by-Step Guide

## Issue Summary
The frontend was trying to connect to the backend, but the server on port 8000 was hung/not responding.

## ? What We Fixed
1. **Killed hung backend process** on port 8000
2. **Verified .env configuration** is correct (port 8000)
3. **Confirmed codetteBridge.ts** correctly reads environment variables
4. **Created startup scripts** for easy backend management

---

## ?? Step-by-Step Instructions

### Step 1: Start Backend Server

Open a **new PowerShell terminal** and run:

```powershell
.\start-backend.ps1
```

**What you should see:**
```
=== CoreLogic Studio Backend Startup ===
[OK] Port 8000 is available
Starting backend server...

? FastAPI app created with CORS enabled
? Real Codette AI Engine initialized successfully
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

> **Leave this terminal window open!** The backend runs here.

---

### Step 2: Verify Backend is Working

In a **different terminal**, run:

```powershell
.\verify-backend.ps1
```

**Expected output:**
```
? SUCCESS! Backend is responding

Response:
{
  "status": "healthy",
  "service": "Codette AI Unified Server",
  ...
}
```

If you see this, **backend is ready!** ?

---

### Step 3: Start Frontend

In the **same terminal** as Step 2 (or a new one), run:

```powershell
npm run dev
```

**Expected output:**
```
VITE v7.2.4  ready in 500 ms

?  Local:   http://localhost:5173/
?  press h to show help
```

---

### Step 4: Open in Browser

1. Open browser to: **http://localhost:5173**
2. Press **Ctrl + Shift + R** to hard refresh
3. Open DevTools (F12) and check Console tab
4. You should see: `? Codette connected` or similar

---

## ?? Verification Checklist

- [ ] Backend terminal shows "Uvicorn running on http://0.0.0.0:8000"
- [ ] `.\verify-backend.ps1` returns success
- [ ] Frontend shows "VITE ... ready"
- [ ] Browser loads http://localhost:5173
- [ ] No console errors about connection refused
- [ ] Codette status indicator shows "Online" or "Connected"

---

## ??? Quick Reference Commands

### Backend Management
```powershell
# Start backend
.\start-backend.ps1

# Verify backend
.\verify-backend.ps1

# Check what's on port 8000
Get-NetTCPConnection -LocalPort 8000

# Kill process on port 8000
$pid = (Get-NetTCPConnection -LocalPort 8000).OwningProcess
Stop-Process -Id $pid -Force
```

### Frontend Management
```powershell
# Start frontend
npm run dev

# Stop frontend (in terminal)
Ctrl + C
```

### Testing Connection
```powershell
# Test backend health endpoint
Invoke-WebRequest -Uri "http://localhost:8000/health" -Method Get

# In browser (open URL)
http://localhost:8000/health
```

---

## ?? Troubleshooting

### Backend won't start - Port already in use

**Error:** `Address already in use`

**Fix:**
```powershell
# Kill everything on port 8000
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force

# Wait 2 seconds
Start-Sleep -Seconds 2

# Try again
.\start-backend.ps1
```

---

### Backend starts but verify fails

**Error:** `Backend not responding`

**Possible causes:**
1. **Backend is still starting** - Wait 10 seconds and try verify again
2. **Python dependencies missing** - Run `pip install -r requirements.txt`
3. **Firewall blocking** - Allow Python through Windows Firewall
4. **Wrong directory** - Make sure you're in `I:\ashesinthedawn`

---

### Frontend shows "Connection refused"

**Error:** `ECONNREFUSED` in browser console

**Check:**
1. Is backend running? Look for "Uvicorn running" message
2. Does `.\verify-backend.ps1` succeed?
3. Hard refresh browser: **Ctrl + Shift + R**
4. Clear browser cache if hard refresh doesn't work

---

### Frontend connects to wrong port (8001)

This shouldn't happen anymore, but if it does:

1. **Check .env file:**
   ```powershell
   Get-Content .env | Select-String "VITE_CODETTE_API"
   ```
   Should show: `VITE_CODETTE_API=http://localhost:8000`

2. **Restart frontend** (important!):
   - Stop: Ctrl+C in frontend terminal
   - Start: `npm run dev`

3. **Hard refresh browser:** Ctrl+Shift+R

---

## ?? Files Created

- **start-backend.ps1** - Starts backend server on port 8000
- **verify-backend.ps1** - Tests if backend is responding
- **fix-backend.ps1** - Cleans up hung processes
- **check-ports.ps1** - Diagnostic tool for port issues

---

## ? Success Indicators

### Backend Terminal
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Frontend Terminal
```
VITE v7.2.4  ready in 500 ms
?  Local:   http://localhost:5173/
```

### Browser Console (F12)
```
? Codette API initialized
? Connected to backend
[Codette] Health check: healthy
```

---

## ?? Quick Start (After Fix)

**Every time you start working:**

1. **Terminal 1 (Backend):**
   ```powershell
   .\start-backend.ps1
   ```
   Wait for "Uvicorn running"

2. **Terminal 2 (Verify):**
   ```powershell
   .\verify-backend.ps1
   ```
   Should show "SUCCESS"

3. **Terminal 2 (Frontend):**
   ```powershell
   npm run dev
   ```
   Wait for "ready"

4. **Browser:**
   - Open http://localhost:5173
   - Hard refresh once: Ctrl+Shift+R

**Done!** ??

---

## ?? Need Help?

If issues persist:

1. **Check both terminal windows** for error messages
2. **Run diagnostics:**
   ```powershell
   .\check-ports.ps1
   ```
3. **Verify .env:**
   ```powershell
   type .env
   ```
4. **Check backend is correct file:**
   ```powershell
   Test-Path codette_server_unified.py
   ```

---

## ?? You're All Set!

The connection issue between frontend and backend is now **completely fixed**. The configuration was already correct in your code - it was just the backend process that was hung.

**Happy coding!** ??
