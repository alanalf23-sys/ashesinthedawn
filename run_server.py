#!/usr/bin/env python
"""
Simple launcher for codette_server
"""
import subprocess
import sys

if __name__ == "__main__":
    # Run uvicorn pointing to the app defined in codette_server module
    # Keep stdout/stderr attached so we can see what's happening
    result = subprocess.run([
        sys.executable, "-m", "uvicorn",
        "codette_server:app",
        "--host", "0.0.0.0",
        "--port", "8000",
        "--log-level", "info",
    ])
    print(f"Server exited with code {result.returncode}")



