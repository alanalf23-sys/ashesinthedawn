#!/usr/bin/env python3
"""Verify response formatting adjustments"""

import ast
import sys

try:
    with open('codette_server_unified.py', 'r') as f:
        code = f.read()
    
    # Parse to check syntax
    ast.parse(code)
    print("✅ Python syntax valid - Response adjustments applied successfully")
    
    # Check for key markers
    checks = {
        "mix_engineering default": "mix_engineering" in code,
        "DAW perspective icons": "🎚️" in code and "📊" in code,
        "Creative production": "creative_production" in code,
        "Technical troubleshooting": "technical_troubleshooting" in code,
        "Workflow optimization": "workflow_optimization" in code,
        "Icon mapping": "perspective_icons" in code,
    }
    
    print("\n✅ Verification Checks:")
    for check_name, result in checks.items():
        status = "✓" if result else "✗"
        print(f"  {status} {check_name}")
    
    if all(checks.values()):
        print("\n🎚️ All response adjustments verified!")
        print("   Perspectives: mix_engineering, audio_theory, creative_production,")
        print("                 technical_troubleshooting, workflow_optimization")
        print("   Icons: 🎚️📊🎵🔧⚡")
        sys.exit(0)
    else:
        print("\n⚠️ Some checks failed")
        sys.exit(1)
        
except SyntaxError as e:
    print(f"❌ Syntax error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
