#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Comprehensive test of DAW-specific mixing advice"""
import requests

tests = [
    ('DRUM TRACK', 'how do I mix this drum track better?', 'Drums', 'Drum Track Mixing Guide'),
    ('BASS TRACK', 'help me improve the bass sound', 'Bass Guitar', 'Bass Track Mixing Guide'),
    ('VOCAL TRACK', 'how can I make the vocals sound better?', 'Lead Vocals', 'Vocal Track Mixing Guide'),
    ('GUITAR/SYNTH', 'tips for mixing my synth pad', 'Synth Pad', 'Instrument Track Mixing Guide'),
    ('GENERIC MIXING', 'any mixing tips for this track?', 'Guitar', 'Mixing Fundamentals'),
]

print('=' * 70)
print('DAW-SPECIFIC MIXING ADVICE - COMPREHENSIVE TEST')
print('=' * 70)

passed = 0
failed = 0

for test_name, message, track_name, expected_guide in tests:
    payload = {
        'message': message,
        'daw_context': {
            'selected_track': {'id': 't1', 'name': track_name, 'type': 'audio', 'volume': -3, 'pan': 0},
            'total_tracks': 6
        }
    }
    
    try:
        response = requests.post('http://localhost:8000/codette/chat', json=payload, timeout=15)
        data = response.json()
        resp_text = data.get('response', '')
        
        if expected_guide in resp_text:
            print(f'\n[PASS] {test_name}')
            print(f'       Response type: {expected_guide}')
            print(f'       Response size: {len(resp_text)} chars')
            passed += 1
        else:
            print(f'\n[FAIL] {test_name}')
            print(f'       Expected: {expected_guide}')
            print(f'       Got: {resp_text[:80]}...')
            failed += 1
    except Exception as e:
        print(f'\n[ERROR] {test_name}: {e}')
        failed += 1

print('\n' + '=' * 70)
print(f'RESULTS: {passed} passed, {failed} failed')
print('=' * 70)
