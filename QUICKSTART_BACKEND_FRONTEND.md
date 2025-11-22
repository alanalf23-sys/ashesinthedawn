# 🚀 Quick Start: Codette Backend-Frontend

**Time**: 5 minutes  
**Difficulty**: ⭐ Easy

---

## Step 1: Setup Environment (1 minute)

Create `.env.local` in project root:

```dotenv
VITE_CODETTE_API_URL=http://localhost:8000
VITE_CODETTE_ENABLED=true
```

---

## Step 2: Start Backend (1 minute)

Open **PowerShell** and run:

```powershell
.\start_codette_server.ps1
```

**Windows Users**: If you get permission error, run once:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Mac/Linux Users**: Use bash instead:
```bash
chmod +x start_codette_server.sh
./start_codette_server.sh
```

**Wait for**: "Codette Backend Server is now running" message

---

## Step 3: Start Frontend (1 minute)

Open **new PowerShell** and run:

```powershell
npm run dev
```

**Wait for**: "Local: http://localhost:5173" message

---

## Step 4: Test (2 minutes)

1. Open browser: `http://localhost:5173`
2. Look for **Codette button** (💬 or 🤖)
3. Should show **🟢 GREEN** indicator (connected)
4. Click button
5. Type message: "Hello Codette"
6. Send and wait for response!

---

## That's It! ✅

Your AI backend is now talking to your frontend!

---

## What Each Terminal Shows

### Terminal 1 (Backend)
```
╔═══════════════════════════════════════════════════════════════╗
║          Codette AI Backend Server Starting                   ║
╚═══════════════════════════════════════════════════════════════╝

🌐 Host: 0.0.0.0
🔌 Port: 8000
✅ Codette Available: true

📡 Server will be available at:
   http://localhost:8000
   http://localhost:8000/health
   http://localhost:8000/docs
```

### Terminal 2 (Frontend)
```
  VITE v5.4.8  dev server running at:

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

---

## If Something Goes Wrong

### Backend Won't Start

```powershell
# Check Python
python --version

# Should be 3.10 or higher
```

If not installed: [Download Python](https://www.python.org/downloads/)

### Backend Starts But Says "Codette not available"

```powershell
# Verify Codette folder exists
ls Codette/codette.py
```

Should show: `codette.py` file exists

### Frontend Shows Red Indicator

1. Wait 5 seconds
2. Refresh page
3. Check `.env.local` has correct URL
4. Check backend terminal (should show requests)

### Help!

See detailed guide: `BACKEND_SETUP.md`

---

## Success Indicators

✅ Backend terminal shows startup message  
✅ Frontend terminal shows "dev server running"  
✅ Browser shows Codette indicator as 🟢 GREEN  
✅ Can send message and receive response  
✅ No errors in browser console  
✅ No errors in backend terminal  

---

## Common Commands

| What | Command |
|------|---------|
| Test backend health | `curl http://localhost:8000/health` |
| View API docs | Visit `http://localhost:8000/docs` |
| Stop backend | `Ctrl+C` in backend terminal |
| Stop frontend | `Ctrl+C` in frontend terminal |
| Restart everything | Stop both, start again |

---

## File Reference

| File | Do What |
|------|---------|
| `.env.local` | Configure frontend (create this) |
| `start_codette_server.ps1` | Start backend (run this) |
| `npm run dev` | Start frontend (run this) |

---

## Architecture (Simple Version)

```
Browser
   ↓ (Click button)
React App
   ↓ (HTTP request)
Python Backend (localhost:8000)
   ↓ (Call method)
Codette AI
   ↓ (Generate response)
Python Backend
   ↓ (HTTP response)
React App
   ↓ (Display)
Browser (shows answer!)
```

---

## Next Steps

- [ ] Get it running (this guide)
- [ ] Test all perspectives (try "neural", "newtonian", "davinci", "quantum")
- [ ] Send different message types
- [ ] Explore backend at http://localhost:8000/docs
- [ ] See detailed docs: `BACKEND_SETUP.md`

---

## That's It!

Your AI is now integrated with your DAW. Enjoy! 🎉

Questions? See `BACKEND_SETUP.md` for troubleshooting.

