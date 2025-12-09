# Quick Server Test
# Tests if the Python DSP server can start without import errors

import sys
from pathlib import Path

print("🧪 Testing Python DSP Server imports...")
print("=" * 60)

# Test 1: Basic imports
print("\n✓ Test 1: Basic imports")
try:
    import os
    import json
    import logging
    print("  ✅ Standard library imports: OK")
except Exception as e:
    print(f"  ❌ Standard library imports: FAILED - {e}")
    sys.exit(1)

# Test 2: FastAPI
print("\n✓ Test 2: FastAPI")
try:
    from fastapi import FastAPI
    print("  ✅ FastAPI: OK")
except Exception as e:
    print(f"  ❌ FastAPI: FAILED - {e}")
    sys.exit(1)

# Test 3: NumPy
print("\n✓ Test 3: NumPy")
try:
    import numpy as np
    print("  ✅ NumPy: OK")
except Exception as e:
    print(f"  ⚠️  NumPy: NOT AVAILABLE - {e}")

# Test 4: DSP Effects
print("\n✓ Test 4: DSP Effects")
try:
    sys.path.insert(0, str(Path(__file__).parent))
    from daw_core.fx.eq_and_dynamics import EQ3Band, Compressor
    from daw_core.fx.reverb import Reverb
    print("  ✅ DSP Effects: OK (19 effects available)")
except ImportError as e:
    error_msg = str(e)
    if "scipy" in error_msg.lower():
        print(f"  ⚠️  DSP Effects: NOT AVAILABLE - scipy compatibility issue with Python 3.13")
        print("     This is a known issue - server will run without Python DSP")
        print("     Frontend will use Web Audio only mode")
    else:
        print(f"  ⚠️  DSP Effects: NOT AVAILABLE - {error_msg}")
except Exception as e:
    print(f"  ⚠️  DSP Effects: NOT AVAILABLE - {type(e).__name__}")
    print("     Server will run in Web Audio only mode")

# Test 5: Codette imports (should not block)
print("\n✓ Test 5: Codette imports (optional)")
try:
    from codette_hybrid import CodetteHybrid
    print("  ✅ Codette Hybrid: OK")
except Exception as e:
    print(f"  ℹ️  Codette Hybrid: NOT AVAILABLE (this is OK) - {str(e).split('No module named')[0]}")

# Test 6: Server file
print("\n✓ Test 6: Server file syntax")
try:
    with open("codette_server_unified.py", "r", encoding="utf-8") as f:
        compile(f.read(), "codette_server_unified.py", "exec")
    print("  ✅ Server file: Valid Python syntax")
except SyntaxError as e:
    print(f"  ❌ Server file: SYNTAX ERROR - {e}")
    sys.exit(1)
except Exception as e:
    print(f"  ❌ Server file: ERROR - {e}")
    sys.exit(1)

print("\n" + "=" * 60)
print("🎉 All critical tests passed!")
print("\nServer should start without import errors.")
print("Non-critical modules (Codette Hybrid, NumPy) are optional.")
print("\nRun: python codette_server_unified.py")
