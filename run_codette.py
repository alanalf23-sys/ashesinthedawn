#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Codette AI FastAPI Server Launcher
Starts the Codette backend service on port 8000
"""

import sys
import os

# Add the project root to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == '__main__':
    import subprocess
    
    print("=" * 67)
    print("[+] Codette AI FastAPI Server Starting")
    print("=" * 67)
    print("Host: 127.0.0.1")
    print("Port: 8000")
    print()
    print("Server will be available at:")
    print("   http://localhost:8000")
    print("   http://localhost:8000/health (health check)")
    print("   http://localhost:8000/docs (API documentation)")
    print()
    print("Press Ctrl+C to stop the server")
    print("=" * 67)
    print("===       ")
    print()
    
    # Run the server
    subprocess.run([
        sys.executable, "-m", "uvicorn",
        "codette_server:app",
        "--host", "127.0.0.1",
        "--port", "8000",
        "--reload"
    ])
