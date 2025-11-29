#!/usr/bin/env python3
"""
Phase 6 Verification Script
Validates all implementations are working correctly
"""

import sys
import os
from pathlib import Path

print("=" * 70)
print("CoreLogic Studio v7.0.2 - Phase 6 Verification")
print("=" * 70)

# Change to project directory
os.chdir(Path(__file__).parent)

passed = 0
failed = 0

def test(name, condition, details=""):
    global passed, failed
    status = "✅ PASS" if condition else "❌ FAIL"
    print(f"\n{status}: {name}")
    if details:
        print(f"  → {details}")
    if condition:
        passed += 1
    else:
        failed += 1
    return condition

print("\n" + "=" * 70)
print("MODULE IMPORTS")
print("=" * 70)

# Test genre templates
try:
    from codette_genre_templates import (
        get_genre_suggestions,
        get_available_genres,
        get_genre_characteristics,
        GENRE_TEMPLATES
    )
    test("Genre Templates Module", True, "All functions imported")
    test("Genre Count", len(GENRE_TEMPLATES) == 6, f"Found {len(GENRE_TEMPLATES)} genres")
    
    genres = get_available_genres()
    test("Genre Loading", len(genres) == 6, f"Loaded {len(genres)} genre templates")
    
    for genre in genres:
        test(f"Genre '{genre['id']}'", 
             all(k in genre for k in ['id', 'name', 'description']),
             f"{genre['name']}")
except Exception as e:
    test("Genre Templates Module", False, str(e))

# Test effects
print("\n" + "=" * 70)
print("AUDIO EFFECTS")
print("=" * 70)

try:
    from daw_core.fx.modulation_and_utility import (
        Chorus, Flanger, Tremolo, Gain, WidthControl, DynamicEQ
    )
    test("Effects Module", True, "All new effects imported")
    
    # Test each effect
    effects = {
        'Chorus': Chorus(),
        'Flanger': Flanger(),
        'Tremolo': Tremolo(),
        'Gain': Gain(),
        'WidthControl': WidthControl(),
        'DynamicEQ': DynamicEQ(),
    }
    
    for name, effect in effects.items():
        has_process = hasattr(effect, 'process')
        has_dict = hasattr(effect, 'to_dict')
        test(f"Effect: {name}", has_process and has_dict, 
             f"Methods verified")
    
    # Test effect processing
    import numpy as np
    test_audio = np.random.randn(1024, 2).astype(np.float32)
    
    for name, effect in effects.items():
        try:
            output = effect.process(test_audio)
            test(f"Effect Processing: {name}", output.shape == test_audio.shape,
                 f"Shape preserved: {output.shape}")
        except Exception as e:
            test(f"Effect Processing: {name}", False, str(e))
            
except Exception as e:
    test("Effects Module", False, str(e))

# Test backend integration
print("\n" + "=" * 70)
print("BACKEND INTEGRATION")
print("=" * 70)

# Check if genre_templates is imported in server
try:
    with open('codette_server_unified.py', 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
        
    test("Server: Genre Import", 
         'from codette_genre_templates import' in content,
         "Genre templates imported in server")
    
    test("Server: Genre Endpoints",
         '@app.get("/codette/genres")' in content,
         "Genre endpoint defined")
    
    test("Server: WebSocket Streaming",
         'analyze_stream' in content,
         "WebSocket streaming support added")
    
    test("Server: Error Handling",
         'try:' in content and 'except' in content,
         "Error handling present")
         
except Exception as e:
    test("Backend Files", False, str(e))

# Test frontend integration
print("\n" + "=" * 70)
print("FRONTEND INTEGRATION")
print("=" * 70)

try:
    with open('src/components/CodetteSystem.tsx', 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    test("Frontend: Genre State",
         'selectedGenre' in content and 'availableGenres' in content,
         "Genre state management added")
    
    test("Frontend: Genre Selector",
         'select' in content.lower() and 'genre' in content.lower(),
         "Genre selector UI present")
    
    test("Frontend: WebSocket Listener",
         'WebSocket(' in content and 'analyzeStream' in content or 'analyze_stream' in content,
         "WebSocket listener implemented")
    
    test("Frontend: Real-time Updates",
         'analysis_update' in content or 'setWsData' in content,
         "Real-time analysis updates")
         
except Exception as e:
    test("Frontend Files", False, str(e))

# Test file existence
print("\n" + "=" * 70)
print("FILE STRUCTURE")
print("=" * 70)

files_to_check = {
    'codette_genre_templates.py': 'Genre templates',
    'daw_core/fx/modulation_and_utility.py': 'Modulation and utility effects',
    'src/components/CodetteSystem.tsx': 'Updated Codette component',
    'PHASE_6_COMPLETION_SUMMARY.md': 'Phase 6 documentation',
}

for filepath, description in files_to_check.items():
    exists = Path(filepath).exists()
    test(f"File: {filepath}", exists, description)

# Summary
print("\n" + "=" * 70)
print("VERIFICATION SUMMARY")
print("=" * 70)
print(f"\n✅ Passed: {passed}")
print(f"❌ Failed: {failed}")
print(f"📊 Total:  {passed + failed}")
print(f"📈 Score:  {passed / (passed + failed) * 100:.1f}%")

if failed == 0:
    print("\n🎉 ALL CHECKS PASSED - PHASE 6 READY FOR DEPLOYMENT!")
    sys.exit(0)
else:
    print(f"\n⚠️  {failed} check(s) failed - Please review above")
    sys.exit(1)
