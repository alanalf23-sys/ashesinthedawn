# ?? Quick Fix Guide - Pydantic Version Conflict

## ?? Problem
Your `requirements.txt` had conflicting versions:
- `pydantic==2.12.5` (requires `pydantic-core==2.41.5`)
- `pydantic-core==2.14.1` (incompatible with Pydantic 2.12.5)

## ? Solution Applied

I've updated your `requirements.txt` to:
- Remove the explicit `pydantic-core==2.14.1` pin
- Specify `pydantic>=2.6.0,<3.0.0` (flexible versioning)
- Let pip resolve dependencies automatically

## ?? How to Fix Your Environment

### Step 1: Run the Fix Script
```powershell
.\fix_pydantic_env.ps1
```

This script will:
1. Activate your virtual environment
2. Clear pip cache
3. Remove old conflicting versions
4. Install fresh dependencies from updated `requirements.txt`
5. Verify installation

### Step 2: Wait for Completion
The script will show:
```
? Activating virtual environment...
? Clearing pip cache...
? Removing old Pydantic versions...
? Installing dependencies from requirements.txt...
? Verifying installation...
? Pydantic installed successfully
? Environment fixed!
```

### Step 3: Start Your Server
```powershell
python codette_server_unified.py
```

Or use the startup script:
```powershell
.\start-all.ps1
```

---

## ?? What Changed in requirements.txt

### Before (? Conflicting)
```
pydantic==2.12.5
pydantic-core==2.14.1  # ? Incompatible!
```

### After (? Fixed)
```
pydantic>=2.6.0,<3.0.0  # ? Let pip resolve
# (pydantic-core removed - pip handles it)
```

---

## ?? Expected Time
- Script runtime: 2-5 minutes (depending on internet speed)
- Installation: Automatic with progress indicators

---

## ? If Something Goes Wrong

### Issue: Script fails with "Permission Denied"
**Solution:** Run PowerShell as Administrator
```powershell
# Right-click PowerShell ? Run as Administrator
# Then run:
.\fix_pydantic_env.ps1
```

### Issue: Script hangs on installation
**Solution:** Press `Ctrl+C` and try manually
```powershell
.\venv\Scripts\Activate.ps1
pip cache purge
pip install -r requirements.txt
```

### Issue: "ModuleNotFoundError: No module named 'pydantic'"
**Solution:** Ensure venv is activated
```powershell
.\venv\Scripts\Activate.ps1
python -c "from pydantic import BaseModel; print('OK')"
```

---

## ? Verification Checklist

After running the fix script, verify everything works:

```powershell
# 1. Check Python
python --version
# Should show: Python 3.13.7 (or similar)

# 2. Check Pydantic
python -c "import pydantic; print(pydantic.__version__)"
# Should show: 2.6.x or higher (not 2.14.1)

# 3. Check FastAPI
python -c "import fastapi; print('FastAPI OK')"
# Should print: FastAPI OK

# 4. Test server import
python -c "from codette_file_upload import analyze_uploaded_file; print('Server imports OK')"
# Should print: Server imports OK
```

---

## ?? Next Steps

1. **Run the fix script:**
   ```powershell
   .\fix_pydantic_env.ps1
   ```

2. **Verify installation:**
   ```powershell
   python -c "from pydantic import BaseModel; print('? Ready!')"
   ```

3. **Start your server:**
   ```powershell
   python codette_server_unified.py
   ```

4. **Open in browser:**
   ```
   http://localhost:5173
   ```

---

## ?? What Was Wrong

The original requirements had:
- **pydantic 2.12.5** - modern version with new features
- **pydantic-core 2.14.1** - an old version from 2024

But pydantic 2.12.5 needs pydantic-core 2.41.5 (not 2.14.1)!

**Fix:** Remove the explicit pydantic-core version and let pip automatically install the matching version (2.41.5).

---

## ? You're All Set!

The environment will be fixed after running the script. Your Codette server is ready to use! ??

---

*Last updated: December 10, 2025*
