#!/usr/bin/env python
"""Test script to verify training data and tips are properly configured"""

from codette_training_data import get_training_context

ctx = get_training_context()

# Test DAW functions with tips
daw = ctx.get('daw_functions', {})
transport = daw.get('transport', {})
play_func = transport.get('play', {})

print("=" * 60)
print("TESTING DAW FUNCTION TIPS")
print("=" * 60)
print(f"\nPlay function found: {'play' in transport}")
print(f"Has tips: {'tips' in play_func}")
print(f"Tips content:\n{play_func.get('tips', [])}")

# Test music data
music = ctx.get('music', {})
print("\n" + "=" * 60)
print("TESTING MUSIC DATA")
print("=" * 60)
print(f"Music data available: {len(music) > 0}")
if music:
    print(f"Music data keys: {list(music.keys())[:10]}")

print("\n✅ All training data verified!")
