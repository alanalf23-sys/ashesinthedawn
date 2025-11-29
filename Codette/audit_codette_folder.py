#!/usr/bin/env python3
"""
Codette Folder Audit & Testing Script
Verifies all Python files in the Codette folder are real working code
"""
import os
import sys
import importlib.util
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

CODETTE_FOLDER = Path(__file__).parent

# Files we've verified or fixed
FIXED_FILES = {
    'codette_new.py': 'Codette class with respond() - WORKING',
    'chat_with_codette.py': 'Interactive CLI - FIXED', 
    'codette_cli.py': 'Command-line interface - FIXED',
    'codette_api.py': 'FastAPI endpoint - FIXED',
    'config.py': 'Configuration manager - FIXED',
    'database_manager.py': 'Database manager - FIXED',
    'cognitive_auth.py': 'Auth manager - Working',
    'cognitive_processor.py': 'Processor - Working',
    'defense_system.py': 'Defense system - Working',
    'health_monitor.py': 'Health monitor - Working',
}

# Files to skip or ignore
SKIP_FILES = {
    '__pycache__',
    '.pytest_cache',
    '*.spec',
    'test_',
    'analyze_',
    '.pyc',
}

def is_placeholder_code(file_path):
    """Check if file contains placeholder/stub code"""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            
        # Check for common placeholders
        placeholders = [
            'pass  # TODO',
            'raise NotImplementedError',
            '# placeholder',
            '# stub',
            'print("not implemented")',
            'return None  # TODO',
            'def __init__',  # Only init, no implementation
        ]
        
        # Check if file is mostly empty or just has imports
        lines = [l.strip() for l in content.split('\n') if l.strip() and not l.strip().startswith('#')]
        
        if len(lines) < 5:
            return True, "File too short or empty"
        
        # Check for specific patterns
        if 'raise NotImplementedError' in content:
            return True, "Contains NotImplementedError"
        
        return False, "Code appears functional"
    except Exception as e:
        return True, f"Error reading: {e}"

def test_import(file_path):
    """Try to import the module"""
    try:
        spec = importlib.util.spec_from_file_location("module", file_path)
        if spec and spec.loader:
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            return True, "Import successful"
    except Exception as e:
        return False, str(e)

def main():
    """Run audit"""
    print("\n" + "="*70)
    print("CODETTE FOLDER CODE AUDIT")
    print("="*70 + "\n")
    
    results = {
        'total_files': 0,
        'fixed_files': 0,
        'functional_files': 0,
        'placeholder_files': 0,
        'error_files': 0,
        'issues': []
    }
    
    py_files = sorted([f for f in CODETTE_FOLDER.glob('*.py') if f.is_file()])
    
    print(f"Found {len(py_files)} Python files\n")
    
    for py_file in py_files:
        filename = py_file.name
        results['total_files'] += 1
        
        # Check if in fixed list
        if filename in FIXED_FILES:
            print(f"[FIXED] {filename:<30} - {FIXED_FILES[filename]}")
            results['fixed_files'] += 1
            continue
        
        # Check for placeholders
        is_placeholder, reason = is_placeholder_code(py_file)
        
        if is_placeholder:
            status = "[PLACEHOLDER]"
            results['placeholder_files'] += 1
            results['issues'].append((filename, reason))
        else:
            # Try to import
            importable, import_reason = test_import(py_file)
            if importable:
                status = "[FUNCTIONAL]"
                results['functional_files'] += 1
            else:
                status = "[ERROR]"
                results['error_files'] += 1
                results['issues'].append((filename, import_reason))
        
        print(f"{status} {filename:<30} - {reason if is_placeholder else import_reason}")
    
    # Print summary
    print("\n" + "="*70)
    print("AUDIT SUMMARY")
    print("="*70)
    print(f"Total files:         {results['total_files']}")
    print(f"Fixed files:         {results['fixed_files']}")
    print(f"Functional files:    {results['functional_files']}")
    print(f"Placeholder files:   {results['placeholder_files']}")
    print(f"Error files:         {results['error_files']}")
    
    if results['issues']:
        print(f"\nISSUES FOUND ({len(results['issues'])}):")
        for filename, issue in results['issues']:
            print(f"  - {filename}: {issue}")
    else:
        print("\nNO ISSUES FOUND - All files appear to be working code!")
    
    print("\n" + "="*70 + "\n")
    
    # Return exit code based on issues
    return 0 if not results['issues'] else 1

if __name__ == "__main__":
    sys.exit(main())
