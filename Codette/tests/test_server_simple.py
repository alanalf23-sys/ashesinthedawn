#!/usr/bin/env python
"""
Minimal test server to verify FastAPI + Codette work
"""
import sys
import os
from pathlib import Path
import subprocess

# Add Codette to path
codette_path = Path(__file__).parent / "Codette"
sys.path.insert(0, str(codette_path))

print("[TEST] Importing FastAPI...")
from fastapi import FastAPI
print("[OK] FastAPI imported")

print("[TEST] Creating app...")
app = FastAPI(title="Codette Test")
print("[OK] App created")

print("[TEST] Adding route...")
@app.get("/")
def root():
    return {"status": "ok"}

@app.get("/health")
def health():
    return {"status": "healthy", "codette_available": True}

print("[OK] Routes added")

if __name__ == "__main__":
    import subprocess
    import sys
    
    print("\n[INFO] Starting test server on http://0.0.0.0:8001")
    print("[INFO] Try: curl http://localhost:8001/health")
    print("[INFO] Press Ctrl+C to stop\n")
    
    # Run uvicorn as subprocess to give it its own stdin
    try:
        result = subprocess.run(
            [
                sys.executable, "-m", "uvicorn",
                "test_server_simple:app",
                "--host", "0.0.0.0",
                "--port", "8001",
                "--log-level", "warning",
            ],
            cwd=Path(__file__).parent,
        )
        sys.exit(result.returncode)
    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
