#!/usr/bin/env python3
"""
EMERGENCY FIX - Logger not defined before TransportManager
===========================================================
The TransportManager.__init__ tries to use 'logger' but it's not
defined yet at module import time.

Solution: Make logging calls safe by checking if logger exists,
or move logging setup earlier.
"""

import re
from pathlib import Path

def main():
    print("="*70)
    print("EMERGENCY FIX - Fixing logger initialization order")
    print("="*70)
    
    server_file = Path("codette_server_unified.py")
    content = server_file.read_text(encoding='utf-8')
    
    print("\n[STRATEGY] Moving logging setup BEFORE transport manager")
    
    # Find the transport manager section (the one we just added)
    transport_section_pattern = r'(# ={70,}\n# TRANSPORT CLOCK MODELS.*?# END TRANSPORT CLOCK\n# ={70,}\n)'
    
    transport_match = re.search(transport_section_pattern, content, re.DOTALL)
    
    if not transport_match:
        print("[ERROR] Could not find transport section!")
        return False
    
    transport_code = transport_match.group(0)
    print("[INFO] Found transport section")
    
    # Remove it from current location
    content = content.replace(transport_code, '')
    print("[INFO] Removed transport section from old location")
    
    # Find logging setup section
    logging_setup_pattern = r'(# ={70,}\n# LOGGING SETUP\n# ={70,}.*?logger = logging\.getLogger\(__name__\)\n)'
    
    logging_match = re.search(logging_setup_pattern, content, re.DOTALL)
    
    if not logging_match:
        print("[ERROR] Could not find logging setup!")
        return False
    
    print("[INFO] Found logging setup")
    
    # Insert transport code AFTER logging setup
    insertion_point = logging_match.end()
    content = content[:insertion_point] + '\n' + transport_code + content[insertion_point:]
    
    print("[INFO] Moved transport section to AFTER logging setup")
    
    # Write back
    server_file.write_text(content, encoding='utf-8')
    print("[INFO] File written")
    
    # Verify
    print("\n[VERIFY] Checking syntax...")
    import subprocess
    result = subprocess.run(['python', '-m', 'py_compile', 'codette_server_unified.py'],
                          capture_output=True, text=True)
    
    if result.returncode == 0:
        print("[SUCCESS] ? File compiles!")
    else:
        print(f"[ERROR] Compilation failed:\n{result.stderr}")
        return False
    
    print("\n" + "="*70)
    print("FIX APPLIED SUCCESSFULLY")
    print("="*70)
    print("\nThe correct order is now:")
    print("  1. Imports")
    print("  2. Environment setup")
    print("  3. FastAPI imports")
    print("  4. Logging setup ? logger created here")
    print("  5. Transport Manager ? uses logger (now safe!)")
    print("  6. App creation")
    print("  7. Middleware & exception handlers")
    print("  8. Endpoints")
    
    print("\n[NEXT] Start server: python codette_server_unified.py")
    print("="*70)
    
    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
