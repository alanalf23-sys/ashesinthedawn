# Codette AI Hybrid System - Build Guide

Complete guide for building a standalone executable of Codette AI.

## ?? Prerequisites

### System Requirements
- **OS**: Windows 10/11 (64-bit), Linux, or macOS
- **Python**: 3.10 or 3.11 (recommended)
- **RAM**: 8GB minimum, 16GB recommended
- **Disk**: 10GB free space (for build process)
- **Optional**: NVIDIA GPU with CUDA 11.8+ for ML features

### Software Requirements
- Python 3.10+ installed
- Git (for cloning)
- Visual Studio Build Tools (Windows only)

## ?? Quick Start

### 1. Install Build Dependencies

```bash
# Install PyInstaller and core dependencies
pip install -r requirements-build.txt

# Verify installation
python -c "import PyInstaller; print(PyInstaller.__version__)"
```

### 2. Build Executable

```bash
# Option A: Using build script (recommended)
python build_codette.py --clean --test

# Option B: Direct PyInstaller
pyinstaller codette_hybrid.spec
```

### 3. Test Executable

```bash
# Windows
dist\CodetteAI-Hybrid.exe

# Linux/Mac
./dist/CodetteAI-Hybrid
```

## ?? Build Script Options

```bash
# Clean build with testing
python build_codette.py --clean --test

# Debug build (shows detailed logs)
python build_codette.py --debug

# Skip dependency check (faster)
python build_codette.py --skip-deps

# All options
python build_codette.py --clean --debug --test
```

## ?? Advanced Configuration

### Customizing the Build

Edit `codette_hybrid.spec` to customize:

#### 1. **Change Executable Name**

```python
exe = EXE(
    ...
    name='MyCodetteAI',  # Change this
    ...
)
```

#### 2. **Add Icon**

```python
exe = EXE(
    ...
    icon='myicon.ico',  # Add your icon
    ...
)
```

#### 3. **Console vs GUI Mode**

```python
exe = EXE(
    ...
    console=True,   # False for GUI mode (no console window)
    ...
)
```

#### 4. **Include Additional Files**

```python
datas = [
    ('myfile.json', '.'),
    ('mydir/*', 'mydir'),
]
```

### Optimizing Build Size

#### Exclude Unused Packages

```python
excludes=[
    'matplotlib',  # If not using visualization
    'PyQt5',       # If not using GUI
    'jupyter',     # Dev tools
]
```

#### Disable UPX Compression (faster builds)

```python
exe = EXE(
    ...
    upx=False,  # Disable compression
    ...
)
```

## ?? Troubleshooting

### Build Fails with "Module not found"

**Problem**: PyInstaller can't find a module

**Solution**: Add to `hiddenimports` in spec file:

```python
hiddenimports=[
    'your_missing_module',
    'another_module',
]
```

### Executable Crashes on Startup

**Problem**: Missing DLL or data files

**Solutions**:

1. **Check logs in debug mode**:
   ```bash
   python build_codette.py --debug
   ```

2. **Add missing DLLs**:
   ```python
   binaries=[
       ('path/to/missing.dll', '.'),
   ]
   ```

3. **Run from command line to see errors**:
   ```bash
   dist\CodetteAI-Hybrid.exe  # See console output
   ```

### Large Executable Size

**Problem**: Executable is >500MB

**Solutions**:

1. **Exclude unused packages** (see above)

2. **Use UPX compression**:
   ```python
   upx=True,
   upx_exclude=['python*.dll'],
   ```

3. **Remove debug symbols**:
   ```python
   strip=True,
   ```

### Import Errors at Runtime

**Problem**: "No module named X" when running executable

**Solution**: Add to `collect_submodules`:

```python
hiddenimports.extend(collect_submodules('problematic_package'))
```

### CUDA/GPU Issues

**Problem**: PyTorch can't find CUDA

**Solutions**:

1. **Use CPU-only build**:
   ```bash
   pip install torch --index-url https://download.pytorch.org/whl/cpu
   ```

2. **Include CUDA DLLs** (Windows):
   ```python
   binaries=[
       ('C:/Program Files/NVIDIA GPU Computing Toolkit/CUDA/v11.8/bin/*.dll', '.'),
   ]
   ```

## ?? Build Process Details

### What Gets Built

```
dist/
??? CodetteAI-Hybrid.exe      # Main executable (Windows)
??? CodetteAI-Hybrid           # Main executable (Linux/Mac)
??? README.txt                 # User documentation
??? _internal/                 # Dependencies (bundled)
?   ??? numpy/
?   ??? torch/
?   ??? transformers/
?   ??? ...
??? cocoons/                   # Memory storage (created at runtime)
```

### Build Time Estimates

| Configuration | Time | Size |
|--------------|------|------|
| Clean build (full) | 5-10 min | ~800MB |
| Incremental build | 2-3 min | ~800MB |
| Debug build | 8-15 min | ~1.2GB |
| With CUDA | 10-20 min | ~2GB |

### Memory Usage During Build

- **PyInstaller analysis**: ~2GB RAM
- **Compilation**: ~4GB RAM
- **Packaging**: ~2GB RAM
- **Peak usage**: ~6GB RAM

## ?? Testing the Build

### Automated Tests

```bash
# Run full test suite
python build_codette.py --test

# Manual tests
dist\CodetteAI-Hybrid.exe
# Wait for "SERVER READY" message
# Open http://localhost:8000/docs
```

### Verify Features

```bash
# Test health
curl http://localhost:8000/health

# Test chat
curl -X POST http://localhost:8000/codette/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Codette"}'

# Test status
curl http://localhost:8000/api/codette/status
```

## ?? Distribution

### Package for Release

```bash
# Create distribution package
mkdir CodetteAI-v3.0.0-hybrid
cp -r dist/* CodetteAI-v3.0.0-hybrid/
cp .env.example CodetteAI-v3.0.0-hybrid/
cp README.md CodetteAI-v3.0.0-hybrid/

# Create ZIP
7z a CodetteAI-v3.0.0-hybrid.zip CodetteAI-v3.0.0-hybrid/
```

### Release Checklist

- [ ] Build passes all tests
- [ ] Executable runs without errors
- [ ] API endpoints respond correctly
- [ ] Documentation included
- [ ] .env.example provided
- [ ] Version number updated
- [ ] Change log included
- [ ] License file included

## ?? Security Considerations

### Environment Variables

**Never include** in the build:
- API keys
- Passwords
- Service role keys

Instead, provide `.env.example`:

```bash
# .env.example
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_key_here
```

### Code Signing (Optional)

#### Windows

```bash
signtool sign /f mycert.pfx /p password /tr http://timestamp.digicert.com dist\CodetteAI-Hybrid.exe
```

#### macOS

```bash
codesign --force --sign "Developer ID Application: Your Name" dist/CodetteAI-Hybrid
```

## ?? Performance Optimization

### Startup Time

**Current**: ~3-5 seconds
**Optimized**: ~1-2 seconds

**Optimizations**:

1. **Lazy imports**:
   ```python
   def heavy_function():
       import heavy_module  # Import only when needed
   ```

2. **Disable unnecessary features**:
   ```python
   use_ml_features=False  # Faster startup
   ```

3. **Pre-compile Python modules**:
   ```bash
   python -m compileall Codette/
   ```

### Runtime Performance

1. **Enable caching**:
   - Response cache (300s TTL)
   - Vector search cache

2. **Optimize imports**:
   - Remove unused imports
   - Use specific imports (`from X import Y`)

3. **Profile bottlenecks**:
   ```bash
   python -m cProfile -o profile.stats codette_server_unified.py
   ```

## ?? Cross-Platform Builds

### Build for Multiple Platforms

```bash
# Windows (on Windows)
python build_codette.py --clean

# Linux (on Linux)
python build_codette.py --clean

# macOS (on macOS)
python build_codette.py --clean
```

### Platform-Specific Issues

#### Windows
- Include Visual C++ Redistributable
- CUDA requires NVIDIA drivers

#### Linux
- May need `libpython3.10.so`
- Set executable permissions: `chmod +x dist/CodetteAI-Hybrid`

#### macOS
- Code signing required for distribution
- Gatekeeper may block unsigned apps

## ?? Build Logs

Logs are saved to:
- `build/CodetteAI-Hybrid/warn-CodetteAI-Hybrid.txt` - Warnings
- `build/CodetteAI-Hybrid/xref-CodetteAI-Hybrid.html` - Cross-references

Review these if build fails.

## ?? Getting Help

### Common Issues Database

See `TROUBLESHOOTING.md` for:
- Build errors
- Runtime errors
- Platform-specific issues
- Performance problems

### Community Support

- GitHub Issues: https://github.com/Raiff1982/ashesinthedawn/issues
- Discussions: https://github.com/Raiff1982/ashesinthedawn/discussions

## ?? Next Steps

After successful build:

1. **Test thoroughly** on target system
2. **Document any issues** encountered
3. **Create release notes**
4. **Share with community**
5. **Gather feedback**

## ? Verification Checklist

- [ ] Python 3.10+ installed
- [ ] All dependencies installed
- [ ] Build completes without errors
- [ ] Executable starts successfully
- [ ] Server responds to API calls
- [ ] All features work (chat, status, effects)
- [ ] Documentation included
- [ ] Ready for distribution

---

**Version**: 3.0.0-hybrid
**Last Updated**: December 2025
**Maintainer**: Codette AI Team
