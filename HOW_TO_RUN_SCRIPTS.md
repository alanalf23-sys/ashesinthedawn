# How to Run PowerShell Scripts Correctly

## The Error You Saw

```
SyntaxError: Non-UTF-8 code starting with '\x95'...
```

This means the script was being run with **Python** instead of **PowerShell**.

---

## ? Correct Ways to Run

### Method 1: Double-Click the BAT File (Easiest!)

Just double-click:
```
START.bat
```

This will automatically run the PowerShell script correctly.

---

### Method 2: Right-Click ? Run with PowerShell

1. Right-click `start-complete.ps1`
2. Select **"Run with PowerShell"**

---

### Method 3: From PowerShell Terminal

Open PowerShell (not Command Prompt!) and run:

```powershell
.\start-complete.ps1
```

Or with explicit execution:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\start-complete.ps1
```

---

### Method 4: From Visual Studio Terminal

Make sure your terminal is set to **PowerShell** (not cmd):

1. Click terminal dropdown
2. Select "PowerShell" or "Windows PowerShell"
3. Run:
   ```powershell
   .\start-complete.ps1
   ```

---

## ? Wrong Ways (Will Give Errors)

### Don't Run with Python
```powershell
# WRONG - Don't do this:
python start-complete.ps1
```

### Don't Run in Command Prompt
```cmd
REM WRONG - Don't do this:
start-complete.ps1
```
Use `START.bat` instead if you're in cmd.

---

## ?? If PowerShell Scripts Are Blocked

If you see "execution of scripts is disabled on this system":

### Option A: Bypass for This Session
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\start-complete.ps1
```

### Option B: Use the BAT File
```
START.bat
```
(Already includes bypass flag)

### Option C: Change Execution Policy (Admin)
```powershell
# Run PowerShell as Administrator, then:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned
```

---

## ?? Quick Start (Choose One)

**Easiest:**
```
Double-click START.bat
```

**PowerShell:**
```powershell
.\start-complete.ps1
```

**With Bypass:**
```powershell
powershell.exe -ExecutionPolicy Bypass -File start-complete.ps1
```

---

## ?? Other Scripts

All these PowerShell scripts work the same way:

- `start-backend.ps1` - Backend only
- `verify-backend.ps1` - Test backend
- `fix-backend.ps1` - Clean up processes
- `check-ports.ps1` - Check port status

Run them with:
```powershell
.\script-name.ps1
```

Or create a `.bat` file for any of them:
```batch
@echo off
powershell.exe -ExecutionPolicy Bypass -File "%~dp0script-name.ps1"
pause
```

---

## ? You're Ready!

Just use **START.bat** (double-click) or run in PowerShell terminal with `.\start-complete.ps1`
