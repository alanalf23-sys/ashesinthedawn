#!/usr/bin/env python
"""
End-to-end test for Codette follow-up detection through all layers
Tests: codette_enhanced -> codette_advanced -> codette_hybrid
"""
import sys
sys.path.insert(0, 'Codette')

def test_codette_enhanced():
    """Test base codette_enhanced directly"""
    print("\n" + "="*70)
    print("TEST 1: codette_enhanced (base layer)")
    print("="*70)
    
    from codette_enhanced import Codette
    c = Codette()
    
    daw_ctx = {
        'selected_track': {'name': 'Vocal 1', 'type': 'audio', 'volume': -6.0, 'pan': 0},
        'track_counts': {'total': 3, 'audio': 3}
    }
    
    r1 = c.respond('what should I do with this track', daw_ctx)
    r2 = c.respond('what else', daw_ctx)
    
    has_ctx_1 = 'Currently working on' in r1
    has_ctx_2 = 'Currently working on' in r2
    
    print(f"Response 1 length: {len(r1)} chars")
    print(f"Response 2 length: {len(r2)} chars")
    print(f"Response 1 has context intro: {has_ctx_1}")
    print(f"Response 2 has context intro: {has_ctx_2}")
    print(f"Responses are different: {r1 != r2}")
    
    success = has_ctx_1 and not has_ctx_2 and r1 != r2
    print(f"? PASS" if success else "? FAIL")
    return success

def test_codette_advanced():
    """Test codette_advanced (middle layer)"""
    print("\n" + "="*70)
    print("TEST 2: codette_advanced (middle layer)")
    print("="*70)
    
    from codette_advanced import CodetteAdvanced
    c = CodetteAdvanced()
    
    daw_ctx = {
        'selected_track': {'name': 'Bass 1', 'type': 'audio', 'volume': -8.0, 'pan': 0},
        'track_counts': {'total': 5, 'audio': 5}
    }
    
    r1 = c.respond('how do I process this', daw_ctx)
    r2 = c.respond('more tips', daw_ctx)
    
    has_ctx_1 = 'Currently working on' in r1
    has_ctx_2 = 'Currently working on' in r2
    
    print(f"Response 1 length: {len(r1)} chars")
    print(f"Response 2 length: {len(r2)} chars")
    print(f"Response 1 has context intro: {has_ctx_1}")
    print(f"Response 2 has context intro: {has_ctx_2}")
    print(f"Responses are different: {r1 != r2}")
    
    success = has_ctx_1 and not has_ctx_2 and r1 != r2
    print(f"? PASS" if success else "? FAIL")
    return success

def test_codette_hybrid():
    """Test codette_hybrid (top layer - used by server)"""
    print("\n" + "="*70)
    print("TEST 3: codette_hybrid (top layer - SERVER USES THIS)")
    print("="*70)
    
    from codette_hybrid import CodetteHybrid
    c = CodetteHybrid('TestUser', use_ml_features=False)
    
    daw_ctx = {
        'selected_track': {'name': 'Drum 1', 'type': 'audio', 'volume': -4.0, 'pan': 0.2},
        'track_counts': {'total': 8, 'audio': 6, 'instrument': 2}
    }
    
    r1 = c.respond('what should I do', daw_ctx)
    r2 = c.respond('anything else', daw_ctx)
    
    has_ctx_1 = 'Currently working on' in r1
    has_ctx_2 = 'Currently working on' in r2
    
    print(f"Response 1 length: {len(r1)} chars")
    print(f"Response 2 length: {len(r2)} chars")
    print(f"Response 1 has context intro: {has_ctx_1}")
    print(f"Response 2 has context intro: {has_ctx_2}")
    print(f"Responses are different: {r1 != r2}")
    
    success = has_ctx_1 and not has_ctx_2 and r1 != r2
    print(f"? PASS" if success else "? FAIL")
    return success

def test_multiple_followups():
    """Test multiple follow-ups in a row"""
    print("\n" + "="*70)
    print("TEST 4: Multiple follow-ups (conversation flow)")
    print("="*70)
    
    from codette_hybrid import CodetteHybrid
    c = CodetteHybrid('TestUser', use_ml_features=False)
    
    daw_ctx = {
        'selected_track': {'name': 'Guitar 1', 'type': 'audio', 'volume': -7.0, 'pan': -0.3},
        'track_counts': {'total': 4, 'audio': 4}
    }
    
    queries = [
        'how do I mix this guitar',
        'what else',
        'more ideas',
        'ok thanks',
        'what about EQ specifically'  # New topic - should show context again
    ]
    
    responses = []
    for i, query in enumerate(queries):
        r = c.respond(query, daw_ctx)
        has_ctx = 'Currently working on' in r
        responses.append((query, len(r), has_ctx))
        print(f"  {i+1}. '{query}' -> {len(r)} chars, context={has_ctx}")
    
    # Expected: context on query 1 and 5, no context on 2, 3, 4
    expected_context = [True, False, False, False, True]
    actual_context = [r[2] for r in responses]
    
    success = expected_context == actual_context
    print(f"\nExpected context pattern: {expected_context}")
    print(f"Actual context pattern:   {actual_context}")
    print(f"? PASS" if success else "? FAIL")
    return success

def main():
    print("\n" + "="*70)
    print("CODETTE FOLLOW-UP DETECTION - FULL STACK TEST")
    print("="*70)
    
    results = []
    
    try:
        results.append(("codette_enhanced", test_codette_enhanced()))
    except Exception as e:
        print(f"? FAIL: {e}")
        results.append(("codette_enhanced", False))
    
    try:
        results.append(("codette_advanced", test_codette_advanced()))
    except Exception as e:
        print(f"? FAIL: {e}")
        results.append(("codette_advanced", False))
    
    try:
        results.append(("codette_hybrid", test_codette_hybrid()))
    except Exception as e:
        print(f"? FAIL: {e}")
        results.append(("codette_hybrid", False))
    
    try:
        results.append(("multiple_followups", test_multiple_followups()))
    except Exception as e:
        print(f"? FAIL: {e}")
        results.append(("multiple_followups", False))
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for test_name, success in results:
        status = "? PASS" if success else "? FAIL"
        print(f"  {status}: {test_name}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n?? SUCCESS! All layers properly handle follow-up detection!")
        print("The server should now avoid repetitive context dumps.")
        return 0
    else:
        print("\n??  Some tests failed. Review the output above.")
        return 1

if __name__ == '__main__':
    sys.exit(main())
