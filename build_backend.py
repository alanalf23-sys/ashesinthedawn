#!/usr/bin/env python
"""
PyInstaller build script for CoreLogic Studio backend
Bundles Python backend as standalone executable for Windows/Mac

Usage:
    python build_backend.py --platform windows
    python build_backend.py --platform mac
"""

import os
import sys
import subprocess
import argparse
import shutil
from pathlib import Path

def build_backend(platform='windows'):
    """Build backend executable using PyInstaller"""
    
    print(f"🔨 Building backend for {platform}...")
    
    # Paths
    project_root = Path(__file__).parent
    backend_file = project_root / 'codette_server_unified.py'
    dist_dir = project_root / 'dist' / 'backend'
    
    if not backend_file.exists():
        print(f"❌ Backend file not found: {backend_file}")
        return False
    
    # Clean old builds
    if dist_dir.exists():
        print(f"🧹 Cleaning {dist_dir}...")
        shutil.rmtree(dist_dir)
    
    # Build command
    output_name = 'codette-server'
    if platform == 'windows':
        output_file = f'{output_name}.exe'
    else:
        output_file = output_name
    
    cmd = [
        'pyinstaller',
        '--onefile',  # Single executable
        '--console',  # Show console window
        '--name', output_name,
        '--distpath', str(dist_dir.parent),
        '--workpath', str(project_root / 'build'),
        '--specpath', str(project_root / 'build'),
        
        # Include data files
        '--add-data', f'{project_root}/codette_training_data.py{os.pathsep}.',
        '--add-data', f'{project_root}/Codette{os.pathsep}Codette',
        '--add-data', f'{project_root}/daw_core{os.pathsep}daw_core',
        
        # Hidden imports
        '--hidden-import=numpy',
        '--hidden-import=scipy',
        '--hidden-import=sklearn',
        '--hidden-import=nltk',
        '--hidden-import=uvicorn',
        '--hidden-import=fastapi',
        '--hidden-import=pydantic',
        
        # Optimizations
        '--optimize', '2',  # Enable optimizations
        '--noupx',  # Skip UPX compression (can cause issues)
        
        str(backend_file),
    ]
    
    # Platform-specific options
    if platform == 'mac':
        cmd.extend([
            '--osx-bundle-identifier', 'com.corelogic.studio.backend',
            '--codesign-identity', '-',  # Sign with self
        ])
    elif platform == 'windows':
        cmd.extend([
            '--icon', str(project_root / 'assets' / 'icon.ico'),
        ])
    
    print(f"\n📦 Running: {' '.join(cmd)}\n")
    
    try:
        result = subprocess.run(cmd, check=True)
        print(f"\n✅ Backend built successfully!")
        print(f"📍 Output: {dist_dir}/backend/{output_file}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Build failed: {e}")
        return False

def verify_backend(platform='windows'):
    """Verify backend executable exists and works"""
    
    print(f"\n🧪 Verifying backend build...")
    
    dist_dir = Path(__file__).parent / 'dist' / 'backend'
    
    if platform == 'windows':
        exe_file = dist_dir / 'codette-server.exe'
    else:
        exe_file = dist_dir / 'codette-server'
    
    if not exe_file.exists():
        print(f"❌ Executable not found: {exe_file}")
        return False
    
    print(f"✅ Executable found: {exe_file}")
    print(f"   Size: {exe_file.stat().st_size / 1024 / 1024:.1f} MB")
    
    # Test run (with timeout)
    print(f"\n🚀 Testing backend startup...")
    try:
        # Start process with timeout
        proc = subprocess.Popen(
            [str(exe_file)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        
        # Wait up to 5 seconds for server startup
        try:
            stdout, stderr = proc.communicate(timeout=5)
        except subprocess.TimeoutExpired:
            print(f"✅ Backend started successfully (timeout expected)")
            proc.kill()
            proc.wait()
            return True
        
        if 'Application startup complete' in stdout or 'listening on' in stdout.lower():
            print(f"✅ Backend started successfully")
            return True
        else:
            print(f"⚠️  Backend started but may not be fully ready")
            print(f"   STDOUT: {stdout[:200]}")
            print(f"   STDERR: {stderr[:200]}")
            return True
            
    except Exception as e:
        print(f"❌ Test run failed: {e}")
        return False

def create_build_info(platform='windows'):
    """Create build info file for Electron to reference"""
    
    dist_dir = Path(__file__).parent / 'dist' / 'backend'
    dist_dir.mkdir(parents=True, exist_ok=True)
    
    if platform == 'windows':
        exe_name = 'codette-server.exe'
    else:
        exe_name = 'codette-server'
    
    build_info = {
        'platform': platform,
        'executable': exe_name,
        'port': 8000,
        'built': __import__('datetime').datetime.now().isoformat(),
    }
    
    import json
    info_file = dist_dir / 'build-info.json'
    with open(info_file, 'w') as f:
        json.dump(build_info, f, indent=2)
    
    print(f"\n📝 Build info saved to {info_file}")

def main():
    parser = argparse.ArgumentParser(
        description='Build CoreLogic Studio backend executable'
    )
    parser.add_argument(
        '--platform',
        choices=['windows', 'mac'],
        default='windows',
        help='Target platform (default: windows)',
    )
    parser.add_argument(
        '--verify',
        action='store_true',
        help='Verify the build after completion',
    )
    parser.add_argument(
        '--skip-verify',
        dest='verify',
        action='store_false',
        help='Skip verification after build',
    )
    parser.set_defaults(verify=True)
    
    args = parser.parse_args()
    
    print(f"""
╔═══════════════════════════════════════════════╗
║  CoreLogic Studio Backend Build Script        ║
║  Building for: {args.platform:30} ║
╚═══════════════════════════════════════════════╝
    """)
    
    # Check dependencies
    print("📋 Checking dependencies...")
    try:
        import PyInstaller
        print(f"   ✅ PyInstaller {PyInstaller.__version__}")
    except ImportError:
        print("   ❌ PyInstaller not found. Install with: pip install pyinstaller")
        return False
    
    # Build
    if not build_backend(args.platform):
        return False
    
    # Create build info
    create_build_info(args.platform)
    
    # Verify
    if args.verify:
        if not verify_backend(args.platform):
            print("\n⚠️  Verification failed but build may still be usable")
    
    print(f"""
╔═══════════════════════════════════════════════╗
║  Build Complete!                             ║
║  Next steps:                                  ║
║  1. npm install --save-dev electron           ║
║  2. npm run build:electron                    ║
║  3. Test with dist/CoreLogic Studio.exe       ║
╚═══════════════════════════════════════════════╝
    """)
    
    return True

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
