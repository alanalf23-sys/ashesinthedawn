# 🚀 Quick Start Guide - AI Backend-Frontend Integration

## ⚡ 2-Minute Setup

### Terminal 1: Start Backend
```bash
cd I:\Codette
python run_server.py
```
✅ Backend running on http://localhost:5000

### Terminal 2: Start Frontend
```bash
cd i:\Packages\Codette\ashesinthedawn
npm run dev
```
✅ Frontend running on http://localhost:5173

## 🧪 Testing (2 Minutes)

1. Open http://localhost:5173
2. Click ⚡ icon in sidebar (AI Panel)
3. Choose a tab:
   - **Health** → Click "Gain Staging" 
   - **Mixing** → Select track, click "Mixing Chain"
   - **Routing** → Click "Suggest Routing"
   - **Full** → Click "Full Analysis"
4. Watch DevTools (F12) Network tab for `/api/` requests
5. See suggestions appear with confidence scores

## 📊 What Each Tab Does

| Tab | Sends To | Analyzes |
|-----|----------|----------|
| **Health** | /api/analyze/gain-staging | All track levels, finds optimizations |
| **Mixing** | /api/analyze/mixing | Selected track type, suggests EQ/compression |
| **Routing** | /api/analyze/routing | Track types, suggests bus configuration |
| **Full** | /api/analyze/session | Complete session, full recommendations |

## 🔍 Verification Checklist

### Backend Status
```bash
curl http://localhost:5000/api/health
# Should return: {"success": true, "status": "healthy"}
```

### Frontend Logs
- Open DevTools (F12)
- Check Console for messages with:
  - 🌉 = Bridge communication
  - 📡 = API calls
  - ⚠️ = Warnings
  - ❌ = Errors

### Network Inspection
1. F12 → Network tab
2. Filter: "api"
3. Click any AI button
4. See POST request to `/api/analyze/*`
5. Check Response tab for JSON prediction

## 🐛 Troubleshooting

### Backend Shows "Offline"
```bash
# Check if Flask is running
curl http://localhost:5000/api/health

# If fails, restart backend:
cd I:\Codette
python run_server.py
```

### Timeout Errors
```env
# In .env.local, increase timeout:
REACT_APP_CODETTE_TIMEOUT=20000  # 20 seconds instead of 10
```

### "Select a track first"
- Go to TrackList (left sidebar)
- Click a track to select it
- Return to AI Panel, Mixing tab
- Button should now be enabled

## 📈 Key Metrics to Monitor

- **API Response Time**: Should be 100-500ms
- **Backend Health**: Check every 5 seconds automatically
- **Confidence Score**: 0-100%, higher is better
- **Cache Hits**: Same analysis should be instant (2nd time)

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| CODETTE_BACKEND_SETUP.md | Full setup + deployment |
| INTEGRATION_VERIFICATION_REPORT.md | Complete verification |
| AI_BACKEND_FRONTEND_INTEGRATION.md | Architecture overview |

## 🎯 Architecture in One Image

```
User → AIPanel.tsx → CodetteBridge → HTTP → Flask → Codette AI → Response → UI
                      (retry, cache)    (5s timeout)     (analysis)
```

## ✅ Success Indicators

When working correctly, you'll see:
- ✅ Green "Backend Online" in AI Panel
- ✅ API requests in DevTools Network tab  
- ✅ Confidence scores on suggestions
- ✅ "Actionable" badge on recommendations
- ✅ Console messages with 📡 emoji

## ⚡ Pro Tips

1. **Speed up testing**: Select same track multiple times (cached)
2. **Monitor performance**: Keep Network tab open during analysis
3. **Debug issues**: Check backend console for error logs
4. **Test fallback**: Stop backend to see local AI kick in
5. **Check health**: Backend auto-checks every 5 seconds

## 🔧 Configuration Quick Reference

```env
# Backend URL (change if running on different port)
REACT_APP_CODETTE_BACKEND=http://localhost:5000

# Timeout in milliseconds
REACT_APP_CODETTE_TIMEOUT=10000

# Retry attempts
REACT_APP_CODETTE_RETRIES=3

# Enable/disable AI features
REACT_APP_AI_SESSION_ANALYSIS=true
REACT_APP_AI_MIXING_SUGGESTIONS=true
REACT_APP_AI_ROUTING_SUGGESTIONS=true
REACT_APP_AI_GAIN_STAGING=true
```

## 🚨 Emergency Troubleshooting

### Everything broken?
```bash
# 1. Kill running processes
# Ctrl+C in both terminals

# 2. Clear cache
cd i:\Packages\Codette\ashesinthedawn
npm run build

# 3. Restart fresh
npm run dev  # Terminal 1
# In new Terminal 2:
cd I:\Codette
python run_server.py
```

### Still broken?
1. Check backend console for Python errors
2. Check frontend console for TypeScript errors
3. Verify .env.local is in workspace root
4. Verify Python environment has Flask installed

## 📞 Support Contacts

- **Backend Issues**: Check `I:\Codette` logs
- **Frontend Issues**: Check DevTools Console (F12)
- **Network Issues**: Check DevTools Network tab (F12)
- **Build Issues**: Run `npm run build` to see errors

## 🎉 You're Ready!

Everything is configured and ready to go. Just:
1. Start backend ✅
2. Start frontend ✅
3. Open http://localhost:5173 ✅
4. Click ⚡ → Try AI features ✅

**That's it! The integration is complete and working.**
