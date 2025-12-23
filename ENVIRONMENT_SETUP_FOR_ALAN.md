# CoreLogic Studio - Environment Configuration Guide
**For: Alan**  
**Date:** December 2024  
**Project:** CoreLogic Studio (Sovereign DAW Engine v7.0)

---

## Quick Start - What You Need

CoreLogic Studio uses **3 environment configuration files** depending on what you're running:

### 1. **Frontend Configuration** (`.env` in root)
```bash
# Copy this command in the project root:
cp .env.example .env
```

### 2. **Codette AI Configuration** (`.env.codette` or `.env.local`)
```bash
# For Codette AI integration:
cp .env.codette.example .env.local
```

### 3. **Backend/Python Configuration** (`Codette/.env`)
```bash
# For Codette Python backend:
cp Codette/.env.example Codette/.env
```

---

## Environment Files Overview

### File 1: `.env.example` (Root - Frontend Config)
**Purpose:** Main CoreLogic Studio frontend configuration  
**Location:** `i:\ashesinthedawn\.env.example`  
**Copy to:** `.env` (git-ignored)

**Key Settings:**
- **Supabase Authentication:**
  ```
  VITE_SUPABASE_URL=your_supabase_url
  VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
  ```

- **Display Configuration:**
  ```
  VITE_APP_NAME=CoreLogic Studio
  VITE_APP_VERSION=7.0
  VITE_FPS_LIMIT=60
  VITE_VU_REFRESH=150
  ```

- **Codette Integration:**
  ```
  VITE_CODETTE_API=http://localhost:8000
  ```

- **Debug Settings:**
  ```
  VITE_LOG_LEVEL=info
  VITE_SHOW_PERF_MONITOR=false
  VITE_MOCK_AUDIO=false
  ```

### File 2: `.env.codette.example` (Codette Integration)
**Purpose:** Detailed Codette AI feature configuration  
**Location:** `i:\ashesinthedawn\.env.codette.example`  
**Copy to:** `.env.local` (git-ignored)

**Key Settings:**
- **Enable Codette:**
  ```
  VITE_CODETTE_ENABLED=true
  VITE_CODETTE_API=http://localhost:8000
  ```

- **Feature Flags:**
  ```
  VITE_CODETTE_WEBSOCKET_ENABLED=true
  VITE_CODETTE_CACHE_ENABLED=true
  VITE_CODETTE_AUTO_RECONNECT=true
  ```

- **Perspectives (Active AI Personalities):**
  ```
  VITE_CODETTE_ACTIVE_PERSPECTIVES=newtonian_logic,davinci_synthesis,neural_network
  ```

- **Auto-Apply Safety:**
  ```
  VITE_CODETTE_AUTO_APPLY=false  # Manual review before changes
  ```

- **Performance:**
  ```
  VITE_CODETTE_MAX_HISTORY=100
  VITE_CODETTE_CACHE_SIZE=500
  VITE_CODETTE_TIMEOUT=30000
  ```

### File 3: `Codette/.env.example` (Python Backend)
**Purpose:** Codette Python backend API credentials  
**Location:** `i:\ashesinthedawn\Codette\.env.example`  
**Copy to:** `Codette/.env` (git-ignored)

**Key Settings:**
- **Hugging Face (for AI models):**
  ```
  HUGGINGFACEHUB_API_TOKEN=hf_YOUR_TOKEN_HERE
  ```
  - Get token: https://huggingface.co/settings/tokens
  - Permissions: Read-only
  - Expiration: 90 days (rotate regularly)

- **Google Custom Search (optional):**
  ```
  GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY_HERE
  GOOGLE_CUSTOM_SEARCH_ID=YOUR_SEARCH_ENGINE_ID_HERE
  ```
  - Get API Key: https://console.cloud.google.com/apis/credentials
  - Get Search Engine ID: https://programmablesearchengine.google.com/

---

## Complete Setup Instructions

### Step 1: Copy All Environment Files
```bash
# In project root (i:\ashesinthedawn)
cp .env.example .env
cp .env.codette.example .env.local

# In Codette subdirectory
cd Codette
cp .env.example .env
cd ..
```

### Step 2: Configure Frontend (.env)
Edit `.env` and set:
```bash
# Required: Supabase (if using auth)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Optional: Customize display
VITE_APP_NAME=CoreLogic Studio
VITE_FPS_LIMIT=60
VITE_VU_REFRESH=150

# Optional: Debug mode
VITE_LOG_LEVEL=debug  # or 'info' for production
```

### Step 3: Configure Codette Integration (.env.local)
Edit `.env.local` and set:
```bash
# Enable Codette AI
VITE_CODETTE_ENABLED=true
VITE_CODETTE_API=http://localhost:8000

# Choose AI personalities (comma-separated)
VITE_CODETTE_ACTIVE_PERSPECTIVES=newtonian_logic,davinci_synthesis,neural_network

# Safety: Manual review before applying changes
VITE_CODETTE_AUTO_APPLY=false

# Performance tuning
VITE_CODETTE_MAX_HISTORY=100
VITE_CODETTE_CACHE_SIZE=500
```

### Step 4: Configure Python Backend (Codette/.env)
Edit `Codette/.env` and set:
```bash
# Required: Hugging Face token for AI models
HUGGINGFACEHUB_API_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Google Custom Search
GOOGLE_API_KEY=AIzaSy...
GOOGLE_CUSTOM_SEARCH_ID=...
```

### Step 5: Verify Configuration
```bash
# Check all .env files exist (should NOT error)
ls -la .env .env.local Codette/.env

# Start backend (terminal 1)
cd Codette
python codette_server_unified.py

# Verify backend health (terminal 2)
curl http://localhost:8000/health
# Should return: {"status":"healthy",...}

# Start frontend (terminal 3)
npm run dev
# Opens http://localhost:5173
```

---

## Environment Variables Reference

### Frontend Variables (VITE_* prefix)
All `VITE_` prefixed variables are accessible in React frontend code:
```typescript
// Access in TypeScript/React:
const apiUrl = import.meta.env.VITE_CODETTE_API;
const isEnabled = import.meta.env.VITE_CODETTE_ENABLED === 'true';
```

### Backend Variables (No prefix)
Non-prefixed variables are Python backend only:
```python
# Access in Python:
import os
api_token = os.getenv('HUGGINGFACEHUB_API_TOKEN')
```

---

## Configuration Presets

### Development (Default)
```bash
# .env.local
VITE_CODETTE_API=http://localhost:8000
VITE_CODETTE_ENABLED=true
VITE_CODETTE_DEBUG=true
VITE_CODETTE_AUTO_APPLY=false

# Codette/.env
HUGGINGFACEHUB_API_TOKEN=hf_development_token
```

### Docker Deployment
```bash
# .env.local
VITE_CODETTE_API=http://codette-server:8000
VITE_CODETTE_ENABLED=true
VITE_CODETTE_DEBUG=false
```

### Production
```bash
# .env.local
VITE_CODETTE_API=https://api.yourdomain.com/codette
VITE_CODETTE_ENABLED=true
VITE_CODETTE_API_KEY=your_secure_api_key
VITE_CODETTE_AUTO_APPLY=false
VITE_CODETTE_CORS_ORIGINS=https://yourdomain.com
VITE_CODETTE_HTTPS_ONLY=true
VITE_CODETTE_DEBUG=false
```

---

## Troubleshooting

### Issue: Codette panel won't open
**Check:**
```bash
# 1. Verify backend is running
curl http://localhost:8000/health

# 2. Check frontend .env.local
cat .env.local | grep VITE_CODETTE_ENABLED
# Should be: VITE_CODETTE_ENABLED=true

# 3. Check browser console for errors
# Open DevTools → Console → Look for Codette API errors
```

### Issue: Backend fails to start
**Check:**
```bash
# 1. Verify Codette/.env exists
ls -la Codette/.env

# 2. Check for Hugging Face token
cat Codette/.env | grep HUGGINGFACEHUB
# Should have a valid token: hf_...

# 3. Check port 8000 is available
netstat -an | grep 8000
# Should be empty or show LISTENING
```

### Issue: CORS errors in browser
**Fix in backend:**
```python
# codette_server_unified.py should have:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Security Best Practices

1. **Never commit .env files to git**
   - `.env`, `.env.local`, `Codette/.env` are all in `.gitignore`
   - Only commit `.env.example` templates

2. **Rotate API tokens regularly**
   - Hugging Face tokens: Every 90 days
   - Google API keys: Every 90 days

3. **Use minimal permissions**
   - Hugging Face: Read-only tokens
   - Google API: Restrict to Custom Search only

4. **Keep secrets secure**
   - Use environment variables in production (not .env files)
   - Use secret management systems (AWS Secrets Manager, Azure Key Vault)

5. **Run security scans**
   ```bash
   # Check for accidentally committed secrets
   .\scan-secrets.ps1
   ```

---

## Quick Reference Card

| Environment File | Purpose | Copy To | Required For |
|-----------------|---------|---------|--------------|
| `.env.example` | Frontend config | `.env` | Running app |
| `.env.codette.example` | Codette features | `.env.local` | AI integration |
| `Codette/.env.example` | Backend secrets | `Codette/.env` | Python backend |

**Minimal Setup (just to run app):**
```bash
cp .env.example .env
# Edit VITE_SUPABASE_* if using auth
npm run dev
```

**Full Setup (with Codette AI):**
```bash
cp .env.example .env
cp .env.codette.example .env.local
cp Codette/.env.example Codette/.env
# Edit Codette/.env with HUGGINGFACEHUB_API_TOKEN
python Codette/codette_server_unified.py &
npm run dev
```

---

## Files to Send to Alan

1. **This guide:** `ENVIRONMENT_SETUP_FOR_ALAN.md`
2. **Frontend template:** `.env.example`
3. **Codette template:** `.env.codette.example`
4. **Backend template:** `Codette/.env.example`

**Do NOT send:**
- Actual `.env` files (contain secrets)
- API keys or tokens
- Production credentials

---

## Contact & Support

**Project:** CoreLogic Studio (Sovereign DAW Engine)  
**Version:** 7.0  
**Architecture:** Codette Model (Intent → Truth → Execution → Authority → Telemetry)

**Key Systems:**
- **UI Layer:** React 18 + Tailwind CSS + Vite
- **State Authority:** DAWContext (Truth Engine)
- **Execution Engine:** AudioEngine (Web Audio API)
- **DSP Authority:** Python daw_core (19 effects, 197/197 tests passing)
- **Telemetry:** VU Meters, spectrum analyzers, LUFS metering

**Recent Completions (Dec 2024):**
- ✅ Gradient removal (19+ components)
- ✅ MediaExplorer with File System Access API
- ✅ FXBrowser with 30+ plugins
- ✅ VU Meter telemetry fully functional
- ✅ Python DSP integration

---

## Appendix: All Available Environment Variables

### Frontend (.env)
```bash
# Auth
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY

# System
VITE_APP_NAME
VITE_APP_VERSION
VITE_FPS_LIMIT
VITE_VU_REFRESH

# Display
VITE_CHANNEL_COUNT
VITE_CHANNEL_WIDTH
VITE_SHOW_WATERMARK
VITE_SHOW_GRID

# Theme
VITE_DEFAULT_THEME
VITE_TRANSITION_DURATION

# Codette
VITE_CODETTE_API
VITE_CODETTE_ENABLED

# Debug
VITE_LOG_LEVEL
VITE_SHOW_PERF_MONITOR
VITE_MOCK_AUDIO
```

### Codette Integration (.env.local)
```bash
# Connection
VITE_CODETTE_API
VITE_CODETTE_ENABLED
VITE_CODETTE_API_KEY
VITE_CODETTE_WEBSOCKET_ENABLED
VITE_CODETTE_TIMEOUT

# Features
VITE_CODETTE_CACHE_ENABLED
VITE_CODETTE_AUTO_RECONNECT
VITE_CODETTE_AUTO_APPLY

# Performance
VITE_CODETTE_MAX_HISTORY
VITE_CODETTE_CACHE_SIZE
VITE_CODETTE_MAX_RECONNECT_ATTEMPTS

# Analysis
VITE_CODETTE_ANALYSIS_MODE
VITE_CODETTE_SAMPLE_RATE
VITE_CODETTE_REALTIME_ANALYSIS

# Suggestions
VITE_CODETTE_MIN_CONFIDENCE
VITE_CODETTE_DEFAULT_SUGGESTION_LIMIT

# Perspectives
VITE_CODETTE_DEFAULT_PERSPECTIVE
VITE_CODETTE_MULTI_PERSPECTIVE
VITE_CODETTE_ACTIVE_PERSPECTIVES

# Debug
VITE_CODETTE_DEBUG
VITE_CODETTE_METRICS_ENABLED
VITE_CODETTE_LOG_LEVEL

# Deployment
VITE_CODETTE_ENV
VITE_CODETTE_CORS_ORIGINS
VITE_CODETTE_HTTPS_ONLY
```

### Backend (Codette/.env)
```bash
# API Credentials
HUGGINGFACEHUB_API_TOKEN
GOOGLE_API_KEY
GOOGLE_CUSTOM_SEARCH_ID

# Server Config
CODETTE_HOST
CODETTE_PORT
```

---

**End of Guide**
