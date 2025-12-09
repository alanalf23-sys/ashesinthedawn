#!/usr/bin/env python
"""
Test script for unified Codette server endpoints
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"
TIMEOUT = 5

def print_test(name: str, passed: bool, details: str = ""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"\n{status} - {name}")
    if details:
        print(f"   {details}")

def test_health():
    """Test health endpoint"""
    try:
        resp = requests.get(f"{BASE_URL}/health", timeout=TIMEOUT)
        data = resp.json()
        passed = resp.status_code == 200 and data.get("status") == "healthy"
        details = f"Status: {data.get('status')}, Real Engine: {data.get('real_engine')}, Training: {data.get('training_available')}"
        print_test("Health Endpoint", passed, details)
        return passed
    except Exception as e:
        print_test("Health Endpoint", False, str(e))
        return False

def test_status():
    """Test status endpoint"""
    try:
        resp = requests.get(f"{BASE_URL}/codette/status", timeout=TIMEOUT)
        data = resp.json()
        passed = resp.status_code == 200 and data.get("status") == "running"
        details = f"Version: {data.get('version')}, Features: {len(data.get('features', []))}"
        print_test("Status Endpoint", passed, details)
        return passed
    except Exception as e:
        print_test("Status Endpoint", False, str(e))
        return False

def test_chat():
    """Test chat endpoint"""
    try:
        payload = {
            "message": "What is gain staging?",
            "perspective": "neuralnets"
        }
        resp = requests.post(f"{BASE_URL}/codette/chat", json=payload, timeout=TIMEOUT)
        data = resp.json()
        passed = resp.status_code == 200 and "response" in data
        response_preview = data.get("response", "")[:80] + "..."
        details = f"Response: {response_preview}"
        print_test("Chat Endpoint", passed, details)
        return passed
    except Exception as e:
        print_test("Chat Endpoint", False, str(e))
        return False

def test_suggestions():
    """Test suggestions endpoint"""
    try:
        payload = {
            "context": {
                "type": "gain-staging"
            },
            "limit": 3
        }
        resp = requests.post(f"{BASE_URL}/codette/suggest", json=payload, timeout=TIMEOUT)
        data = resp.json()
        passed = resp.status_code == 200 and "suggestions" in data
        details = f"Suggestions: {len(data.get('suggestions', []))} items"
        print_test("Suggestions Endpoint", passed, details)
        return passed
    except Exception as e:
        print_test("Suggestions Endpoint", False, str(e))
        return False

def test_transport():
    """Test transport endpoints"""
    try:
        resp = requests.get(f"{BASE_URL}/transport/status", timeout=TIMEOUT)
        data = resp.json()
        passed = resp.status_code == 200 and "playing" in data
        details = f"Playing: {data.get('playing')}, BPM: {data.get('bpm')}, Loop: {data.get('loop_enabled')}"
        print_test("Transport Status Endpoint", passed, details)
        return passed
    except Exception as e:
        print_test("Transport Status Endpoint", False, str(e))
        return False

def test_training_context():
    """Test training context endpoint"""
    try:
        resp = requests.get(f"{BASE_URL}/api/training/context", timeout=TIMEOUT)
        data = resp.json()
        passed = resp.status_code == 200 and data.get("success") is True
        has_context = bool(data.get("data"))
        details = f"Training context available: {has_context}"
        print_test("Training Context Endpoint", passed, details)
        return passed
    except Exception as e:
        print_test("Training Context Endpoint", False, str(e))
        return False

def main():
    print("=" * 60)
    print("Testing Codette AI Unified Server")
    print("=" * 60)
    
    time.sleep(1)  # Give server time to be ready
    
    tests = [
        test_health,
        test_status,
        test_transport,
        test_training_context,
        test_chat,
        test_suggestions,
    ]
    
    results = [test() for test in tests]
    
    print("\n" + "=" * 60)
    passed = sum(results)
    total = len(results)
    print(f"Results: {passed}/{total} tests passed")
    print("=" * 60)
    
    if passed == total:
        print("✅ All tests passed! Unified server is working correctly.")
        return 0
    else:
        print(f"⚠️  {total - passed} test(s) failed.")
        return 1

if __name__ == "__main__":
    exit(main())
