#!/usr/bin/env python
"""Test script to verify follow-up detection and response variation"""
import sys
sys.path.insert(0, 'Codette')

from codette_enhanced import Codette

def main():
    print('=' * 60)
    print('FOLLOW-UP DETECTION TEST')
    print('=' * 60)
    
    c = Codette()
    
    # Test follow-up detection
    test_cases = [
        ('what else', True),
        ('anything else', True),
        ('more tips', True),
        ('ok', True),
        ('what vocals', False),
        ('how do I mix vocals', False),
    ]
    
    passed = 0
    for query, expected in test_cases:
        result = c._is_followup_question(query)
        status = 'PASS' if result == expected else 'FAIL'
        if result == expected:
            passed += 1
        print('  %s: "%s" -> %s (expected: %s)' % (status, query, result, expected))
    
    print('Results: %d/%d passed' % (passed, len(test_cases)))
    
    # Test response variation
    print()
    print('=' * 60)
    print('RESPONSE VARIATION TEST')
    print('=' * 60)
    
    daw_ctx = {
        'selected_track': {'name': 'audio 1', 'type': 'audio', 'volume': 0, 'pan': 0},
        'track_counts': {'total': 1, 'audio': 1}
    }
    
    r1 = c.respond('what do you recommend', daw_ctx)
    r2 = c.respond('what else', daw_ctx)
    
    has_ctx_1 = 'Currently working on' in r1
    has_ctx_2 = 'Currently working on' in r2
    
    print('First response: %d chars, has context: %s' % (len(r1), has_ctx_1))
    print('Follow-up: %d chars, has context: %s' % (len(r2), has_ctx_2))
    print('Responses different: %s' % (r1 != r2))
    
    # Success check
    success = has_ctx_1 and not has_ctx_2 and r1 != r2
    print()
    if success:
        print('SUCCESS! Follow-up detection working correctly.')
    else:
        print('FAILED! Check the logic.')
    
    return 0 if success else 1

if __name__ == '__main__':
    sys.exit(main())
