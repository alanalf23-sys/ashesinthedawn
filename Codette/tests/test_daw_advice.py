#!/usr/bin/env python
"""Test DAW-specific mixing advice generation"""
import requests

tests = [
    ('DRUM TRACK', {
        'message': 'how do I mix this drum track better?',
        'daw_context': {
            'selected_track': {'id': 'd1', 'name': 'Drums', 'type': 'audio', 'volume': -3, 'pan': 0},
            'total_tracks': 6
        }
    }),
    ('BASS TRACK', {
        'message': 'help me improve the bass sound',
        'daw_context': {
            'selected_track': {'id': 'b1', 'name': 'Bass Guitar', 'type': 'audio', 'volume': -5, 'pan': 0},
            'total_tracks': 6
        }
    }),
    ('VOCAL TRACK', {
        'message': 'how can I make the vocals sound better?',
        'daw_context': {
            'selected_track': {'id': 'v1', 'name': 'Lead Vocals', 'type': 'audio', 'volume': -1, 'pan': 0},
            'total_tracks': 6
        }
    }),
    ('GUITAR TRACK', {
        'message': 'tips for mixing my guitar track',
        'daw_context': {
            'selected_track': {'id': 'g1', 'name': 'Synth Pad', 'type': 'audio', 'volume': -8, 'pan': -0.3},
            'total_tracks': 8
        }
    }),
]

for test_name, payload in tests:
    print('\n' + '=' * 70)
    print(f'TEST: {test_name}')
    print('=' * 70)
    
    try:
        response = requests.post('http://localhost:8000/codette/chat', json=payload, timeout=15)
        data = response.json()
        resp_text = data.get('response', 'No response')
        
        # Print first 1000 chars
        print(resp_text[:1200])
        if len(resp_text) > 1200:
            print('\n... [OUTPUT TRUNCATED FOR READABILITY] ...\n')
        print(f'\nConfidence: {data.get("confidence", "N/A")}')
    except Exception as e:
        print(f'ERROR: {e}')

print('\n' + '=' * 70)
print('All tests complete!')
print('=' * 70)
