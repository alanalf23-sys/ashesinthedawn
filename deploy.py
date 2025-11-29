#!/usr/bin/env python
"""
Codette Unified Server - Deployment Helper
Quick start scripts for common deployment scenarios
"""

import subprocess
import sys
import os
import time

def run_command(cmd, description=""):
    """Run a command and report results"""
    if description:
        print(f"\n📋 {description}")
    print(f"   → {cmd}")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.stdout:
            print(f"   ✅ {result.stdout.strip()}")
        if result.returncode != 0 and result.stderr:
            print(f"   ❌ {result.stderr.strip()}")
        return result.returncode == 0
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def check_server_health():
    """Check if server is running"""
    try:
        import requests
        resp = requests.get("http://localhost:8000/health", timeout=2)
        return resp.status_code == 200
    except:
        return False

def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Codette Unified Server Deployment Helper"
    )
    parser.add_argument(
        "action",
        choices=["start", "test", "setup", "check"],
        help="Action to perform"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Port to run server on (default: 8000)"
    )
    parser.add_argument(
        "--dev",
        action="store_true",
        help="Run in development mode (verbose logging)"
    )
    
    args = parser.parse_args()
    
    # Setup environment
    if args.port != 8000:
        os.environ["CODETTE_PORT"] = str(args.port)
    
    print("=" * 70)
    print("🎵 Codette Unified Server - Deployment Helper")
    print("=" * 70)
    
    if args.action == "start":
        print(f"\n🚀 Starting Codette Unified Server on port {args.port}")
        print("-" * 70)
        cmd = "python codette_server_unified.py"
        if args.port != 8000:
            cmd = f"set CODETTE_PORT={args.port} & {cmd}"
        run_command(cmd, "Starting server...")
    
    elif args.action == "test":
        print(f"\n🧪 Testing Codette Unified Server")
        print("-" * 70)
        
        # Check if server is running
        if not check_server_health():
            print("❌ Server is not running! Start with: python deploy.py start")
            return 1
        
        print("✅ Server is running!")
        run_command("python test_unified_server.py", "Running endpoint tests...")
    
    elif args.action == "setup":
        print(f"\n⚙️  Setting up Codette Unified Server")
        print("-" * 70)
        
        print("\n1️⃣  Checking Python...")
        run_command("python --version")
        
        print("\n2️⃣  Checking dependencies...")
        run_command(
            "python -m pip list | findstr fastapi",
            "Checking FastAPI installation"
        )
        
        print("\n3️⃣  Checking server syntax...")
        run_command(
            "python -m py_compile codette_server_unified.py",
            "Validating server code"
        )
        
        print("\n4️⃣  Creating environment file...")
        if not os.path.exists(".env"):
            with open(".env", "w") as f:
                f.write("# Codette Server Configuration\n")
                f.write(f"CODETTE_PORT=8000\n")
            print("   ✅ Created .env file")
        else:
            print("   ℹ️  .env file already exists")
        
        print("\n✅ Setup complete!")
    
    elif args.action == "check":
        print(f"\n🔍 Checking Codette Unified Server Status")
        print("-" * 70)
        
        # Check files exist
        files = [
            "codette_server_unified.py",
            "test_unified_server.py",
            "src/lib/codetteBridge.ts",
        ]
        
        print("\n📁 Files:")
        for f in files:
            exists = os.path.exists(f)
            status = "✅" if exists else "❌"
            print(f"   {status} {f}")
        
        # Check server status
        print("\n🌐 Server Status:")
        if check_server_health():
            print("   ✅ Server is running on port 8000")
            try:
                import requests
                resp = requests.get("http://localhost:8000/codette/status")
                data = resp.json()
                print(f"   ✅ Version: {data.get('version')}")
                print(f"   ✅ Real Engine: {data.get('real_engine')}")
                print(f"   ✅ Training: {data.get('training_available')}")
            except:
                pass
        else:
            print("   ℹ️  Server is not running")
        
        # Check environment
        print("\n🔧 Configuration:")
        port = os.getenv("CODETTE_PORT", "8000")
        print(f"   Port: {port}")
        
        print("\n✅ Status check complete!")
    
    print("\n" + "=" * 70)
    return 0

if __name__ == "__main__":
    sys.exit(main())
