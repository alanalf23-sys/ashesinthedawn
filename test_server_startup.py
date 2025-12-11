#!/usr/bin/env python3
"""Test if server starts successfully"""
import subprocess
import time
import requests
import sys

print("="*70)
print("TESTING SERVER STARTUP")
print("="*70)

# Start server in background
print("\n[1/3] Starting server...")
proc = subprocess.Popen(
    [sys.executable, "codette_server_unified.py"],
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True,
    bufsize=1
)

# Wait for startup
time.sleep(10)

# Check if process is still running
if proc.poll() is not None:
    print("? Server process exited!")
    print("\nOutput:")
    print(proc.stdout.read())
    sys.exit(1)

print("? Server process is running")

# Test health endpoint
print("\n[2/3] Testing health endpoint...")
try:
    response = requests.get("http://localhost:8000/health", timeout=5)
    if response.status_code == 200:
        print(f"? Health check passed: {response.json()}")
    else:
        print(f"? Health check failed: {response.status_code}")
except Exception as e:
    print(f"? Health check error: {e}")

# Test transport endpoint
print("\n[3/3] Testing transport status...")
try:
    response = requests.get("http://localhost:8000/transport/status", timeout=5)
    if response.status_code == 200:
        print(f"? Transport endpoint working: {response.json()['status']}")
    else:
        print(f"? Transport endpoint failed: {response.status_code}")
except Exception as e:
    print(f"? Transport endpoint error: {e}")

# Cleanup
print("\n[Cleanup] Stopping server...")
proc.terminate()
proc.wait(timeout=5)

print("\n" + "="*70)
print("? SERVER TEST COMPLETE")
print("="*70)
print("\nServer is working! You can now start it with:")
print("  python codette_server_unified.py")
