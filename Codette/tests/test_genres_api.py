#!/usr/bin/env python
"""Test script for genre templates API"""

import requests
import json
import time

# Give the server a moment to be ready
time.sleep(1)

BASE_URL = "http://localhost:8000"

print("=" * 60)
print("Testing Genre Templates API")
print("=" * 60)

# Test 1: Get available genres
print("\n✅ Test 1: GET /codette/genres")
try:
    response = requests.get(f"{BASE_URL}/codette/genres")
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Available Genres ({len(data['genres'])} total):")
    for genre in data['genres']:
        print(f"  - {genre['id']:15} : {genre['name']}")
    print(f"Status: {data['status']}")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 2: Get specific genre characteristics
print("\n✅ Test 2: GET /codette/genre/pop")
try:
    response = requests.get(f"{BASE_URL}/codette/genre/pop")
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Genre: {data['genre']}")
    print("Characteristics:")
    for key, value in data['characteristics'].items():
        print(f"  - {key}: {value}")
    print(f"API Status: {data['status']}")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 3: Get suggestions with genre context
print("\n✅ Test 3: POST /codette/suggest (with genre context)")
try:
    payload = {
        "context": {
            "type": "mixing",
            "genre": "hip-hop",
            "track_type": "vocal"
        },
        "limit": 4
    }
    response = requests.post(f"{BASE_URL}/codette/suggest", json=payload)
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Suggestions ({len(data['suggestions'])} total):")
    for i, sugg in enumerate(data['suggestions'], 1):
        print(f"  {i}. {sugg['title']} ({sugg['type']}) - Confidence: {sugg['confidence']:.2f}")
        print(f"     {sugg['description'][:60]}...")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 4: Test all genres
print("\n✅ Test 4: Testing all genres")
try:
    response = requests.get(f"{BASE_URL}/codette/genres")
    genres = response.json()['genres']
    for genre in genres:
        resp = requests.get(f"{BASE_URL}/codette/genre/{genre['id']}")
        if resp.status_code == 200:
            print(f"  ✅ {genre['id']:15} loaded successfully")
        else:
            print(f"  ❌ {genre['id']:15} failed: {resp.status_code}")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "=" * 60)
print("✅ All tests completed!")
print("=" * 60)
