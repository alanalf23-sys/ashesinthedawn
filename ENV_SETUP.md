# Codette Environment Configuration

## Overview

The `Codette/.env` file contains all configuration for the Codette backend server. This file is already in `.gitignore` to protect your sensitive keys and configuration.

## File Location

```
I:\ashesinthedawn\
??? Codette/
?   ??? .env           ? Your configuration (gitignored)
?   ??? .env.example   ? Template (committed to git)
?   ??? env_loader.py  ? Loads .env automatically
??? codette_server_unified.py  ? Backend server (loads Codette/.env)
??? verify_env.py      ? Test script
```

## Quick Setup

### Option 1: If .env doesn't exist yet

```bash
cd Codette
cp .env.example .env
# Edit .env with your settings
```

### Option 2: If .env already exists

Your configuration is already set up! The server will automatically load from `Codette/.env`.

## Verification

Test that your `.env` is being read correctly:

```bash
# From project root
python verify_env.py
```

Expected output:
```
===================================================================
Codette Environment Verification
===================================================================

1. Checking .env file location...
   Expected: I:\ashesinthedawn\Codette\.env
   ? File EXISTS

2. Loading environment variables...
   ? Environment loaded successfully

3. Environment Variables Status:
===================================================================
Codette Environment Variables Status
===================================================================
  ? CODETTE_MODEL_ID: C:\Users\Jonathan\...
  ? CODETTE_PORT: 8000
  ? CODETTE_HOST: 0.0.0.0
  ? VITE_SUPABASE_URL: https://ngvcyxvtorwqocnqcbyz.supabase.co
  ? OPENAI_API_KEY: sk-proj-c...
  ? OPENAI_FALLBACK_ENABLED: true
===================================================================

4. Specific Variable Checks:
   ? CODETTE_PORT (Backend port): Correct
   ? CODETTE_MODEL_ID (Model path): Set
   ? VITE_SUPABASE_URL (Supabase URL prefix): Correct

===================================================================
? ALL CHECKS PASSED - Environment configured correctly!
===================================================================
```

## How It Works

### Automatic Loading

When you start the backend server:

```bash
python codette_server_unified.py
```

The server automatically:
1. ? Finds `Codette/.env`
2. ? Loads all variables
3. ? Makes them available to Python via `os.environ`
4. ? Prints confirmation

### Manual Loading (Python)

```python
from Codette.env_loader import load_codette_env, get_env

# Load .env file
load_codette_env()

# Get variables
model_id = get_env('CODETTE_MODEL_ID')
port = get_env('CODETTE_PORT', default='8000')
```

## Security

### ? .env is gitignored

The `.env` file is already in `.gitignore`:

```gitignore
# Environment
.env
.env.local
.env.*.local
```

### ? .env.example is committed

The `.env.example` file shows structure but contains no secrets:

```bash
# Template - no real keys
CODETTE_MODEL_ID=path/to/model
OPENAI_API_KEY=your_key_here
```

### ?? Never commit .env

```bash
# Check what would be committed
git status

# If .env appears (it shouldn't):
git rm --cached Codette/.env
git commit -m "Remove .env from tracking"
```

## Common Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `CODETTE_MODEL_ID` | AI model path | `C:\Users\...\model` |
| `CODETTE_PORT` | Backend port | `8000` |
| `CODETTE_HOST` | Backend host | `0.0.0.0` |
| `VITE_SUPABASE_URL` | Database URL | `https://...supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | DB public key | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | DB admin key | `eyJhbGc...` |
| `OPENAI_API_KEY` | OpenAI key (fallback) | `sk-proj-...` |
| `OPENAI_FALLBACK_ENABLED` | Use OpenAI | `true` or `false` |

## Troubleshooting

### Problem: "Environment variable not found"

**Solution:**
```bash
# 1. Check .env exists
ls Codette/.env

# 2. Run verification
python verify_env.py

# 3. If missing, copy from example
cp Codette/.env.example Codette/.env
```

### Problem: "Wrong value being used"

**Solution:**
```bash
# 1. Check what's actually in .env
cat Codette/.env | grep VARIABLE_NAME

# 2. Make sure no trailing spaces
# 3. Restart backend server
```

### Problem: ".env changes not taking effect"

**Solution:**
```bash
# Restart the backend server
# Ctrl+C to stop
python codette_server_unified.py
```

## Multiple Environments

### Development (.env)
```bash
CODETTE_PORT=8000
OPENAI_FALLBACK_ENABLED=true
```

### Production (.env.production)
```bash
CODETTE_PORT=8000
OPENAI_FALLBACK_ENABLED=false
CORS_ORIGINS=https://yourdomain.com
```

Load specific file:
```python
from env_loader import load_codette_env
load_codette_env('.env.production')
```

## Best Practices

### ? DO
- Keep `.env` in `.gitignore`
- Use `.env.example` as template
- Document all variables
- Use specific variable names
- Verify after changes

### ? DON'T
- Commit `.env` to git
- Share `.env` publicly
- Hardcode secrets in code
- Use generic names like `KEY`
- Skip verification

## Summary

| File | Purpose | Git |
|------|---------|-----|
| `Codette/.env` | Your configuration | ? gitignored |
| `Codette/.env.example` | Template | ? committed |
| `Codette/env_loader.py` | Loader module | ? committed |
| `verify_env.py` | Test script | ? committed |

**Your secrets are safe!** ??

---

**Need help?** Run `python verify_env.py` to diagnose issues.
