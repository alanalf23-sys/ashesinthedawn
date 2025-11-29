# CoreLogic Studio - Fresh Start Guide

## ✅ All Systems Clean

All processes have been terminated:
- ✅ Node processes: 0
- ✅ Python processes: 0
- ✅ Ports freed up (5173, 8000)

---

## 🚀 To Start the App Fresh

### Option 1: Start Both Services (Recommended)

**Terminal 1 - Frontend (React Dev Server)**:
```bash
cd i:\ashesinthedawn
npm run dev
```
- Expected output: `VITE v7.2.4 ready in XXX ms`
- Access at: http://localhost:5173
- HMR (Hot Module Reload) enabled

**Terminal 2 - Backend (Python API Server)**:
```bash
cd i:\ashesinthedawn
python codette_server.py
```
- Expected output: `Uvicorn running on http://0.0.0.0:8000`
- API available at: http://localhost:8000

---

### Option 2: Frontend Only (Lightweight Testing)

**Terminal 1**:
```bash
cd i:\ashesinthedawn
npm run dev
```
- Frontend works independently
- Backend features disabled but UI fully functional
- Fastest for UI testing

---

### Option 3: Production Build

**Build**:
```bash
cd i:\ashesinthedawn
npm run build
```
- Creates optimized production bundle in `dist/`
- Build time: ~2.58s
- Bundle size: 144 kB gzipped

**Preview**:
```bash
npm run preview
```
- Serves production build locally
- Access at: http://localhost:4173

---

## ✅ Pre-Flight Checks

Before starting, verify everything is ready:

```bash
# Check TypeScript (should show no errors)
npm run typecheck

# Check Python (should import without errors)
python -c "import fastapi, codette_server; print('OK')"

# Check build (should succeed)
npm run build
```

---

## 📊 Expected Output

### Frontend (npm run dev)
```
  VITE v7.2.4  ready in 456 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

### Backend (python codette_server.py)
```
[OK] Codette (BroaderPerspectiveEngine) imported successfully
[OK] Codette AI engine initialized
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

---

## 🔧 Troubleshooting

**Port Already in Use**?
```bash
# Kill process on port 5173 (Frontend)
netstat -ano | findstr :5173
taskkill /PID [PID] /F

# Kill process on port 8000 (Backend)
netstat -ano | findstr :8000
taskkill /PID [PID] /F
```

**Module Not Found**?
```bash
# Reinstall dependencies
npm install
pip install -r requirements.txt
```

**TypeScript Errors**?
```bash
# Run type check
npm run typecheck

# Clear cache
rm -r node_modules/.vite
npm run dev
```

---

## 📋 Quick Commands Reference

| Command | Purpose | Time |
|---------|---------|------|
| `npm run dev` | Start dev server | Instant |
| `npm run build` | Build for production | 2.58s |
| `npm run typecheck` | Verify TypeScript | Fast |
| `npm run lint` | Check code style | Fast |
| `python codette_server.py` | Start backend API | 1-2s |

---

## 🎯 Next Steps

1. **Open Terminal 1**: Start frontend with `npm run dev`
2. **Open Terminal 2**: Start backend with `python codette_server.py`
3. **Visit**: http://localhost:5173 in your browser
4. **Start Creating**: The app is ready to use!

---

**Status**: ✅ All Clean - Ready for Fresh Start
**Generated**: November 25, 2025
