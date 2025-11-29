#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Codette AI Server Launcher
Starts the FastAPI/Uvicorn server on port 8001
Integration point with React DAW frontend
"""

import sys
import os
import uvicorn
from pathlib import Path

# Add codette folder to path
codette_path = Path(__file__).parent / "codette"
sys.path.insert(0, str(codette_path))

def main():
    """Start the Codette AI server"""
    print("[>>] Starting Codette AI Server...")
    print("[*] Server will run on: http://localhost:8001")
    print("[+] Integration: React DAW will connect to this server")
    print("-" * 60)
    
    # Start uvicorn server with the unified server
    uvicorn.run(
        "codette_server_unified:app",
        host="127.0.0.1",
        port=8001,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    main()
