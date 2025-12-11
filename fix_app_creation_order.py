#!/usr/bin/env python3
"""
Emergency Fix - Move app creation before exception handlers
"""

import re
from pathlib import Path

def fix_app_before_decorators():
    """Move FastAPI app creation before any @app decorators"""
    
    print("="*70)
    print("EMERGENCY FIX - App Creation Order")
    print("="*70)
    
    server_file = Path("codette_server_unified.py")
    
    # Read file
    with open(server_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print("\n[1/4] Analyzing file structure...")
    
    # Find where app is created (look for "app = FastAPI")
    app_creation_match = re.search(r'(app = FastAPI\([^)]*\))', content, re.MULTILINE | re.DOTALL)
    
    if not app_creation_match:
        print("? Could not find 'app = FastAPI()' in file!")
        return False
    
    app_creation_line = app_creation_match.group(1)
    print(f"? Found app creation: {app_creation_line[:60]}...")
    
    # Find exception handlers (look for @app.exception_handler)
    exception_handler_pattern = r'(@app\.exception_handler\([^)]*\)[^@]*?async def [^(]+\([^)]*\):[^}]+?})'
    exception_handlers = list(re.finditer(exception_handler_pattern, content, re.MULTILINE | re.DOTALL))
    
    if not exception_handlers:
        print("? No exception handlers found that need moving")
        return True
    
    print(f"? Found {len(exception_handlers)} exception handler(s)")
    
    # Find lifespan context manager (look for @asynccontextmanager)
    lifespan_pattern = r'(@asynccontextmanager[^@]*?async def lifespan\([^)]*\):[^}]+?yield[^}]+?})'
    lifespan_match = re.search(lifespan_pattern, content, re.MULTILINE | re.DOTALL)
    
    print("\n[2/4] Determining correct order...")
    
    # The correct order should be:
    # 1. All imports
    # 2. Logging setup
    # 3. Transport Manager
    # 4. Lifespan context manager (if exists)
    # 5. FastAPI app creation ? MUST BE HERE
    # 6. CORS middleware
    # 7. Exception handlers ? THESE REFERENCE app
    # 8. All endpoints
    
    # Find the FastAPI import section
    fastapi_import = "from fastapi import FastAPI"
    fastapi_import_pos = content.find(fastapi_import)
    
    if fastapi_import_pos == -1:
        print("? Could not find FastAPI import!")
        return False
    
    # Find where lifespan ends (if it exists)
    insert_position = fastapi_import_pos
    
    if lifespan_match:
        lifespan_end = lifespan_match.end()
        insert_position = lifespan_end
        print("? Found lifespan context manager")
    
    # Find logging setup end
    logging_pattern = r'logger = logging\.getLogger\(__name__\)'
    logging_match = re.search(logging_pattern, content)
    
    if logging_match and logging_match.end() > insert_position:
        insert_position = logging_match.end()
    
    # Find Transport Manager end
    transport_pattern = r'transport_manager = TransportManager\(\)'
    transport_match = re.search(transport_pattern, content)
    
    if transport_match and transport_match.end() > insert_position:
        insert_position = transport_match.end()
    
    print("\n[3/4] Restructuring file...")
    
    # Remove app creation from current location
    content_without_app = content.replace(app_creation_match.group(0), '')
    
    # Find the section header before app creation to preserve it
    app_section_header = '''
# ============================================================================
# FASTAPI APP CREATION
# ============================================================================
'''
    
    # Insert app creation right after the insert position
    new_app_section = f'''

# ============================================================================
# FASTAPI APP CREATION (Must be before decorators)
# ============================================================================

{app_creation_line}

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("[OK] FastAPI app created")
'''
    
    # Insert the new section
    lines = content_without_app.split('\n')
    
    # Find the line after transport_manager
    for i, line in enumerate(lines):
        if 'transport_manager = TransportManager()' in line:
            # Insert after this line
            lines.insert(i + 1, new_app_section)
            break
    
    new_content = '\n'.join(lines)
    
    print("\n[4/4] Writing fixed file...")
    
    # Backup original
    backup_file = server_file.with_suffix('.py.backup2')
    with open(backup_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"? Backup saved to {backup_file}")
    
    # Write fixed version
    with open(server_file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"? Fixed file written")
    
    # Verify syntax
    print("\n[Verify] Checking syntax...")
    import subprocess
    import sys
    result = subprocess.run([sys.executable, '-m', 'py_compile', str(server_file)],
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
    print("  4. Lifespan (if exists)")
    print("  5. FastAPI app creation ? MOVED HERE")
    print("  6. CORS middleware")
    print("  7. Exception handlers ? Now safe to use @app")
    print("  8. All endpoints")
    print("\n[Next] Start server: python codette_server_unified.py")
    print("="*70)
    
    return True

if __name__ == "__main__":
    import sys
    success = fix_app_before_decorators()
    sys.exit(0 if success else 1)
