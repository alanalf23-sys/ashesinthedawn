#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Test DAW-specific mixing advice generation"""
import requests
import sys

# Ensure UTF-8 output
sys.stdout.recoding = 'utf-8'

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
]

for test_name, payload in tests:
    print('\n' + '=' * 70)
    print(f'TEST: {test_name}')
    print('=' * 70)
    
    try:
        response = requests.post('http://localhost:8000/codette/chat', json=payload, timeout=15)
        data = response.json()
        resp_text = data.get('response', 'No response')
        
        # Check what type of response we got
        if 'Drum Track Mixing Guide' in resp_text or 'Bass Track Mixing Guide' in resp_text:
            print('[SUCCESS] DAW-SPECIFIC ADVICE DETECTED!')
            print(f'Response length: {len(resp_text)} characters')
            print('\nFirst 500 characters:')
            # Remove emojis for display
            safe_text = resp_text.encode('ascii', 'ignore').decode('ascii')
            print(safe_text[:500])
        elif 'Multi-Perspective Analysis' in resp_text:
            print('[CODETTE ENGINE RESPONSE - NOT DAW ADVICE]')
            print(resp_text[:300])
        else:
            print('[UNKNOWN RESPONSE TYPE]')
            print(resp_text[:300])
            
    except Exception as e:
        print(f'ERROR: {e}')

print('\n' + '=' * 70)
