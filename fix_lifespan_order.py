#!/usr/bin/env python3
"""
Fix lifespan order - Move lifespan definition before app creation
"""

import re

def fix_lifespan_order():
    print("="*70)
    print("FIXING LIFESPAN ORDER")
    print("="*70)
    
    with open('codette_server_unified.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find lifespan function definition (should be after app creation currently)
    lifespan_pattern = r'(@asynccontextmanager\s+async def lifespan\(app: FastAPI\):.*?logger\.info\("Shutdown complete"\))'
    lifespan_match = re.search(lifespan_pattern, content, re.DOTALL)
    
    if not lifespan_match:
        print("? Could not find lifespan function")
        return False
    
    lifespan_code = lifespan_match.group(1)
    print("? Found lifespan function")
    
    # Remove it from current location
    content = content.replace(lifespan_code, '')
    
    # Find the line "from contextlib import asynccontextmanager" near the top
    # Insert lifespan function right after transport_manager
    transport_pattern = r'(transport_manager = TransportManager\(\))'
    transport_match = re.search(transport_pattern, content)
    
    if not transport_match:
        print("? Could not find transport_manager")
        return False
    
    # Insert lifespan after transport_manager with proper spacing
    insert_pos = transport_match.end()
    new_lifespan_section = f'\n\n# ============================================================================\n# LIFESPAN CONTEXT MANAGER (Must be before app creation)\n# ============================================================================\n\n{lifespan_code}\n'
    
    content = content[:insert_pos] + new_lifespan_section + content[insert_pos:]
    
    print("? Moved lifespan function before app creation")
    
    # Write back
    with open('codette_server_unified.py', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("? File written")
    
    # Verify syntax
    print("\n[Verify] Checking syntax...")
    import subprocess
    import sys
    result = subprocess.run([sys.executable, '-m', 'py_compile', 'codette_server_unified.py'],
                          capture_output=True, text=True)
    
    if result.returncode == 0:
        print("? Syntax check PASSED")
    else:
        print(f"? Syntax check FAILED:\n{result.stderr}")
        return False
    
    print("\n" + "="*70)
    print("? FIX COMPLETE")
    print("="*70)
    print("\nThe correct order is now:")
    print("  1. Imports")
    print("  2. Logging setup")
    print("  3. Transport Manager")
    print("  4. Lifespan function ? MOVED HERE")
    print("  5. FastAPI app creation (uses lifespan)")
    print("  6. CORS middleware")
    print("  7. Exception handlers")
    print("  8. All endpoints")
    print("\n[Next] Start server: python codette_server_unified.py")
    print("="*70)
    
    return True

if __name__ == "__main__":
    import sys
    success = fix_lifespan_order()
    sys.exit(0 if success else 1)
