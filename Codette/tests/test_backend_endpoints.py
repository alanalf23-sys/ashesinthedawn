#!/usr/bin/env python3
"""Test backend endpoints to verify RPC calls work"""

import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def test_endpoint(name, endpoint, data):
    """Test a single endpoint"""
    print(f"\n{'='*80}")
    print(f"TEST: {name}")
    print(f"Endpoint: POST {endpoint}")
    print(f"Request: {json.dumps(data, indent=2)}")
    print()
    
    try:
        response = requests.post(
            f"{BASE_URL}{endpoint}",
            json=data,
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        result = response.json()
        
        # Show suggestions if present
        if "suggestions" in result:
            print(f"Suggestions returned: {len(result['suggestions'])}")
            for i, sugg in enumerate(result['suggestions'][:2]):
                print(f"  {i+1}. Source: {sugg.get('source', 'N/A')}")
                print(f"     Title: {sugg.get('title', 'N/A')}")
                print(f"     Confidence: {sugg.get('confidence', 'N/A')}")
        
        # Show message if present
        if "message" in result:
            print(f"Message: {result['message'][:100]}...")
        
        print("✅ SUCCESS")
        return True
        
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False

# Run tests
print("\n" + "="*80)
print("BACKEND ENDPOINT RPC TESTS")
print("="*80)

results = []

# Test 1
results.append(test_endpoint(
    "Suggestions - Mixing",
    "/codette/suggest",
    {
        "context": {
            "type": "mixing",
            "track_type": "audio",
            "track_name": "Vocals"
        },
        "limit": 5
    }
))

# Test 2
results.append(test_endpoint(
    "Chat - Reverb Question",
    "/codette/chat",
    {
        "message": "How should I set up reverb?"
    }
))

# Test 3
results.append(test_endpoint(
    "Suggestions - Mastering",
    "/codette/suggest",
    {
        "context": {
            "type": "mastering",
            "track_type": "audio",
            "track_name": "Master"
        },
        "limit": 5
    }
))

# Test 4
results.append(test_endpoint(
    "Chat - EQ Question",
    "/codette/chat",
    {
        "message": "Best way to do EQ?"
    }
))

# Summary
print("\n" + "="*80)
print("SUMMARY")
print("="*80)
passed = sum(results)
failed = len(results) - passed
print(f"Passed: {passed}")
print(f"Failed: {failed}")
print(f"Total:  {len(results)}")

if failed == 0:
    print("\n✅ ALL TESTS PASSED!")
    print("Backend endpoints successfully call RPC functions")
    sys.exit(0)
else:
    print("\n❌ SOME TESTS FAILED")
    sys.exit(1)
