#!/usr/bin/env python3
"""
FINAL FIX - Ensure logger exists before use
Move all logger-dependent code AFTER logging setup
"""

import re

content = open('codette_server_unified.py', 'r', encoding='utf-8').read()

# Find logging setup section
logging_setup = re.search(r'(# ={70,}\n# LOGGING SETUP\n# ={70,}.*?logger = logging\.getLogger\(__name__\))', content, re.DOTALL)

if not logging_setup:
    print("ERROR: Could not find logging setup!")
    exit(1)

logging_end_pos = logging_setup.end()

# Find DAW Core import section (which uses logger)
daw_import = re.search(r'(# ={70,}\n# DAW CORE API IMPORT.*?except Exception as e:\s+logger\.error)', content, re.DOTALL)

if daw_import and daw_import.start() < logging_end_pos:
    print("? Moving DAW Core imports AFTER logging setup...")
    
    # Extract DAW import section
    daw_code = daw_import.group(0)
    
    # Remove from current location
    content_before = content[:daw_import.start()]
    content_after = content[daw_import.end():]
    
    # Find where to insert (after logging setup, before other stuff)
    # Insert right after logger setup
    new_content = content_before + content_after
    
    # Now find logging setup in new content and insert after it
    logging_setup_new = re.search(r'(logger = logging\.getLogger\(__name__\))', new_content)
    insert_pos = logging_setup_new.end()
    
    final_content = new_content[:insert_pos] + '\n\n' + daw_code + new_content[insert_pos:]
    
    with open('codette_server_unified.py', 'w', encoding='utf-8') as f:
        f.write(final_content)
    
    print("? Fixed!")
else:
    print("??  DAW imports already after logging setup")

print("\n[Verify] Checking syntax...")
import subprocess, sys
result = subprocess.run([sys.executable, '-m', 'py_compile', 'codette_server_unified.py'],
                      capture_output=True, text=True)

if result.returncode == 0:
    print("? Syntax OK")
else:
    print(f"? Syntax error:\n{result.stderr}")
    exit(1)

print("\n? ALL FIXED - Server should start now!")
print("Run: python codette_server_unified.py")
