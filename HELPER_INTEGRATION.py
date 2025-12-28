#!/usr/bin/env python
"""
QUICK IMPLEMENTATION HELPER - Local Codette Model Integration
Helps apply modifications to codette_server_unified.py
"""

import os
import sys
from pathlib import Path

def check_prerequisites():
    """Check if all prerequisite files exist"""
    print("\n" + "="*70)
    print(" INTEGRATION PREREQUISITE CHECK")
    print("="*70)
    
    files_to_check = [
        ("codette_local_loader.py", "Local model loader"),
        ("codette_integration.py", "Integration layer"),
        ("codette_server_unified.py", "Main server file"),
    ]
    
    all_exist = True
    for filename, desc in files_to_check:
        path = Path(filename)
        status = "? EXISTS" if path.exists() else "? MISSING"
        print(f"\n{status}: {filename}")
        print(f"  Purpose: {desc}")
        if not path.exists():
            all_exist = False
    
    print("\n" + "="*70)
    return all_exist


def show_modifications():
    """Show what modifications need to be made"""
    print("\n" + "="*70)
    print(" INTEGRATION MODIFICATION POINTS")
    print("="*70)
    
    modifications = [
        {
            "step": 1,
            "location": "Line ~60",
            "find": "# Load environment variables from .env file",
            "action": "Add LOCAL CODETTE imports after this section",
        },
        {
            "step": 2,
            "location": "Line ~520",
            "find": "# Try to import OpenAI for fallback model",
            "action": "Add LOCAL MODEL LOADING before this section",
        },
        {
            "step": 3,
            "location": "Line ~1400",
            "find": "@app.post(\"/codette/chat\")",
            "action": "Replace entire chat endpoint with new version",
        },
        {
            "step": 4,
            "location": "Line ~1300",
            "find": "@app.get(\"/codette/status\")",
            "action": "Add new model-status endpoint after this",
        },
    ]
    
    for mod in modifications:
        print(f"\n?? STEP {mod['step']}: {mod['location']}")
        print(f"   Find: {mod['find']}")
        print(f"   Action: {mod['action']}")
    
    print("\n" + "="*70)


def show_quick_start():
    """Show quick start steps"""
    print("\n" + "="*70)
    print(" QUICK START (10 MINUTES)")
    print("="*70)
    
    steps = [
        "Open: QUICK_START_10MIN.md",
        "Follow: 5 implementation steps",
        "Copy: Code snippets from IMPLEMENTATION_SNIPPETS.md",
        "Paste: Into codette_server_unified.py",
        "Save: File (Ctrl+S)",
        "Test: python codette_server_unified.py",
    ]
    
    for i, step in enumerate(steps, 1):
        print(f"\n{i}. {step}")
    
    print("\n" + "="*70)


def verify_env_file():
    """Check .env file configuration"""
    print("\n" + "="*70)
    print(" ENVIRONMENT CONFIGURATION CHECK")
    print("="*70)
    
    try:
        from dotenv import load_dotenv
        load_dotenv()
        
        required_vars = {
            "CODETTE_MODEL_ID": "Local model path",
            "OPENAI_FALLBACK_ENABLED": "OpenAI fallback toggle",
        }
        
        missing = []
        for var, desc in required_vars.items():
            value = os.getenv(var)
            if value:
                if var == "CODETTE_MODEL_ID":
                    path = Path(value)
                    if path.exists():
                        print(f"\n? {var}")
                        print(f"   Value: {value}")
                        print(f"   Status: Path exists")
                    else:
                        print(f"\n??  {var}")
                        print(f"   Value: {value}")
                        print(f"   Status: ?? Path NOT found (will use fallback)")
                else:
                    print(f"\n? {var}")
                    print(f"   Value: {value}")
            else:
                print(f"\n? {var}")
                print(f"   Status: NOT SET")
                missing.append(var)
        
        if missing:
            print(f"\n??  Missing env variables: {', '.join(missing)}")
            print("   The server will use fallback engines")
        else:
            print("\n? All required env variables are set!")
        
    except ImportError:
        print("\n??  python-dotenv not installed")
        print("   Install with: pip install python-dotenv")
    
    print("\n" + "="*70)


def main():
    """Main helper function"""
    print("\n" + "?? "*35)
    print(" LOCAL CODETTE MODEL INTEGRATION HELPER")
    print("?? "*35)
    
    # Check prerequisites
    if not check_prerequisites():
        print("\n? MISSING FILES!")
        print("   Please ensure codette_local_loader.py and codette_integration.py exist")
        return False
    
    # Check environment
    verify_env_file()
    
    # Show modifications
    show_modifications()
    
    # Show quick start
    show_quick_start()
    
    print("\n" + "="*70)
    print(" NEXT STEPS")
    print("="*70)
    print("""
1. Open this file for reference: QUICK_START_10MIN.md
2. Copy code snippets: IMPLEMENTATION_SNIPPETS.md  
3. Edit server file: codette_server_unified.py
4. Apply modifications at the 4 locations above
5. Save and test: python codette_server_unified.py

? Estimated time: 10 minutes
? Difficulty: Easy (copy & paste)
? Risk: Low (fallback chain intact)
    """)
    
    print("="*70 + "\n")
    
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
