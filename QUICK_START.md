# Quick Start Guide - CoreLogic Studio
**Backend is Ready! Frontend Needs Node.js**

## ? What's Installed

**Backend (Python) - COMPLETE**
- Python 3.9.13 ?
- fastapi 0.124.0 ?
- uvicorn 0.38.0 ?
- numpy 2.0.2 ?
- scipy 1.13.1 ?
- pydantic 2.12.5 ?

## ?? Start Backend Now

Open Terminal and run:

```powershell
cd D:\HorizonCore\GitHub
py run_server.py
```

The Codette AI server will start on http://localhost:8001

## ? Install Frontend

**Step 1**: Download Node.js from https://nodejs.org/
- Click "LTS" (v20.x recommended)
- Run installer (2 minutes)
- Restart VS Code

**Step 2**: Install frontend packages
```powershell
cd D:\HorizonCore\GitHub
npm install
```

**Step 3**: Start frontend server
```powershell
npm run dev
```

The app will be available at http://localhost:5173

## ?? Full System

**Terminal 1 - Backend** (Ready Now ?)
```powershell
py run_server.py
```

**Terminal 2 - Frontend** (After Node.js ?)
```powershell
npm run dev
```

**Browser**
```
http://localhost:5173
```

---

See `INSTALLATION_STATUS.md` for complete details.
