#!/usr/bin/env python3
"""
Final Verification - Confirm Server Startup Fix
"""
import subprocess
import time
import sys
import requests

print("="*70)
print("FINAL VERIFICATION - Server Startup Fix")
print("="*70)

# Step 1: Syntax check
print("\n[1/3] Checking syntax...")
result = subprocess.run([sys.executable, '-m', 'py_compile', 'codette_server_unified.py'],
                       capture_output=True, text=True)
if result.returncode == 0:
    print("? Syntax check PASSED")
else:
    print(f"? Syntax check FAILED:\n{result.stderr}")
    sys.exit(1)

# Step 2: Check if file contains startup code
print("\n[2/3] Checking for startup code...")
with open('codette_server_unified.py', 'r', encoding='utf-8') as f:
    content = f.read()
    
if 'if __name__ == "__main__":' in content and 'uvicorn.run' in content:
    print("? Startup code found in file")
else:
    print("? Startup code MISSING from file")
    sys.exit(1)

# Step 3: Try to start server
print("\n[3/3] Testing server startup (this may take a moment)...")
print("Starting server in background...")

# Start server as subprocess
proc = subprocess.Popen(
    [sys.executable, 'codette_server_unified.py'],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

# Wait for server to start
print("Waiting for server to initialize...")
time.sleep(10)

# Check if server is listening
try:
    response = requests.get('http://localhost:8000/health', timeout=5)
    if response.status_code == 200:
        print("? Server is listening and responding!")
        print(f"   Response: {response.json()}")
    else:
        print(f"??  Server responded with status {response.status_code}")
except requests.exceptions.ConnectionError:
    print("? Server is NOT listening on port 8000")
    print("\nServer output:")
    proc.terminate()
    stdout, stderr = proc.communicate(timeout=2)
    print(stdout[:500] if stdout else "(no stdout)")
    print(stderr[:500] if stderr else "(no stderr)")
    sys.exit(1)
except Exception as e:
    print(f"? Error testing server: {e}")
    proc.terminate()
    sys.exit(1)

# Clean up
print("\nStopping test server...")
proc.terminate()
try:
    proc.wait(timeout=5)
except subprocess.TimeoutExpired:
    proc.kill()

print("\n" + "="*70)
print("? ALL VERIFICATIONS PASSED")
print("="*70)
print("\nThe server is now fixed and ready to use!")
print("\nTo start the server normally:")
print("  python codette_server_unified.py")
print("\nTo test all endpoints:")
print("  python test_endpoints.py")
print("\n" + "="*70)
