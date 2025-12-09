#!/usr/bin/env python
"""
Quick test to verify Codette response variation
"""

import sys
from pathlib import Path

# Add Codette to path
codette_path = Path(__file__).parent / "Codette"
if codette_path.exists():
    sys.path.insert(0, str(codette_path))

try:
    from codette_new import Codette
    
    print("? Codette imported successfully")
    print("\nTesting response variation...")
    print("=" * 70)
    
    codette = Codette(user_name="TestUser")
    
    # Test same query multiple times
    query = "How should I mix vocals in a pop song?"
    
    for i in range(3):
        print(f"\n?? Attempt {i + 1}:")
        response = codette.respond(query)
        print(f"Response length: {len(response)} chars")
        print(f"First 100 chars: {response[:100]}...")
        print("-" * 70)
    
    # Test with varied prompts
    print("\n\n? Testing with perspective variations:")
    print("=" * 70)
    
    perspectives = [
        "[neural_network perspective] How should I mix vocals in a pop song?",
        "[human_intuition perspective] How should I mix vocals in a pop song?",
        "[creative perspective] How should I mix vocals in a pop song?"
    ]
    
    for perspective_query in perspectives:
        print(f"\n?? Query: {perspective_query}")
        response = codette.respond(perspective_query)
        print(f"Response: {response[:150]}...")
        print("-" * 70)
    
    print("\n? Test complete!")
    
except ImportError as e:
    print(f"? Could not import Codette: {e}")
    print("   Make sure codette_new.py exists in the Codette directory")
except Exception as e:
    print(f"? Error during test: {e}")
    import traceback
    traceback.print_exc()
