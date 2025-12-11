#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Quick Fix for NameError: 'app' is not defined
Moves exception handlers to after FastAPI app initialization
"""

import re
from pathlib import Path
from datetime import datetime

def fix_app_order():
    """Fix the order of app initialization and exception handlers"""
    
    server_file = Path("codette_server_unified.py")
    if not server_file.exists():
        print(f"[ERROR] File not found: {server_file}")
        return False
    
    print("="*70)
    print("FIXING APP INITIALIZATION ORDER")
    print("="*70)
    
    # Read content
    print("\n[INFO] Reading file...")
    content = server_file.read_text(encoding='utf-8')
    
    # Find and extract the validation error handler that was added
    validation_handler_pattern = r'(# ============================================================================\n# VALIDATION ERROR HANDLING.*?# END VALIDATION ERROR HANDLING\n# ============================================================================\n)'
    
    validation_handler_match = re.search(validation_handler_pattern, content, re.DOTALL)
    
    if not validation_handler_match:
        print("[WARNING] Could not find validation error handler section")
        return False
    
    validation_handler_code = validation_handler_match.group(1)
    print("[INFO] Found validation error handler section")
    
    # Remove it from its current location
    content = content.replace(validation_handler_code, '')
    print("[INFO] Removed from old location")
    
    # Find where FastAPI app is created
    app_creation_pattern = r'(app = FastAPI\([^)]+\))'
    
    app_match = re.search(app_creation_pattern, content, re.DOTALL)
    if not app_match:
        print("[ERROR] Could not find FastAPI app creation")
        return False
    
    print("[INFO] Found FastAPI app creation")
    
    # Find CORS middleware (good insertion point - after app creation)
    cors_pattern = r'(app\.add_middleware\(\s*CORSMiddleware[^)]+\))'
    
    cors_match = re.search(cors_pattern, content, re.DOTALL)
    if not cors_match:
        print("[WARNING] Could not find CORS middleware")
        return False
    
    print("[INFO] Found CORS middleware")
    
    # Insert validation handler AFTER CORS middleware
    insertion_point = cors_match.end()
    content = content[:insertion_point] + '\n' + validation_handler_code + content[insertion_point:]
    
    print("[INFO] Moved validation handler to after CORS middleware")
    
    # Also need to move the request logging middleware if it exists
    request_logging_pattern = r'(# ============================================================================\n# REQUEST LOGGING MIDDLEWARE.*?# END REQUEST LOGGING MIDDLEWARE\n# ============================================================================\n)'
    
    request_logging_match = re.search(request_logging_pattern, content, re.DOTALL)
    
    if request_logging_match:
        request_logging_code = request_logging_match.group(1)
        print("[INFO] Found request logging middleware")
        
        # Remove from current location
        content = content.replace(request_logging_code, '')
        print("[INFO] Removed from old location")
        
        # Insert after validation handler
        validation_handler_match = re.search(validation_handler_pattern, content, re.DOTALL)
        if validation_handler_match:
            insertion_point = validation_handler_match.end()
            content = content[:insertion_point] + '\n' + request_logging_code + content[insertion_point:]
            print("[INFO] Moved request logging middleware to after validation handler")
    
    # Write back
    print("\n[INFO] Writing updated file...")
    server_file.write_text(content, encoding='utf-8')
    
    print("\n" + "="*70)
    print("FIX APPLIED SUCCESSFULLY")
    print("="*70)
    print("\n[SUCCESS] Exception handlers moved to correct position")
    print("\nThe correct order is now:")
    print("  1. Imports")
    print("  2. FastAPI app creation")
    print("  3. CORS middleware")
    print("  4. Exception handlers (validation, HTTP, etc.)")
    print("  5. Request logging middleware")
    print("  6. Endpoints")
    print("\n" + "="*70)
    
    return True

def main():
    print("\n")
    success = fix_app_order()
    
    if success:
        print("\n[NEXT STEP] Start the server:")
        print("  python codette_server_unified.py")
        print("\n")
    else:
        print("\n[ERROR] Fix failed - check error messages above")
        print("\n")

if __name__ == "__main__":
    main()
