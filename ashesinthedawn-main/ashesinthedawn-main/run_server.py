#!/usr/bin/env python
"""
Codette Server - Simple wrapper
Keeps the server running and handles restarts
"""
import subprocess
import sys
import time

if __name__ == "__main__":
    print("\n" + "="*70)
    print("Codette AI Server Launcher")
    print("="*70)
    print("Starting server on http://localhost:8000")
    print("Press Ctrl+C to stop\n")
    
    while True:
        try:
            # Run uvicorn
            result = subprocess.run([
                sys.executable, "-m", "uvicorn",
                "codette_server:app",
                "--host", "0.0.0.0",
                "--port", "8000",
                "--log-level", "info",
            ])
            
            if result.returncode != 0:
                print(f"\nServer exited with code {result.returncode}")
                print("Restarting in 2 seconds...")
                time.sleep(2)
            else:
                break
                
        except KeyboardInterrupt:
            print("\n\nServer stopped by user")
            sys.exit(0)
        except Exception as e:
            print(f"Error: {e}")
            print("Retrying in 2 seconds...")
            time.sleep(2)



