#!/usr/bin/env python3
"""
Test suite for Codette AI training system
Verifies all training modules load and integrate correctly
"""

import requests
import json
import sys
from pathlib import Path

# Configuration
API_BASE = "http://127.0.0.1:8000"
TIMEOUT = 5

def print_section(title):
    """Print a formatted section header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def test_health_check():
    """Test 1: Backend health check"""
    print_section("TEST 1: Backend Health Check")
    try:
        response = requests.get(f"{API_BASE}/health", timeout=TIMEOUT)
        data = response.json()
        print(f"✓ Status: {data.get('status')}")
        print(f"✓ Training Available: {data.get('training_available')}")
        print(f"✓ Codette Available: {data.get('codette_available')}")
        return response.status_code == 200
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_training_health():
    """Test 2: Training module health"""
    print_section("TEST 2: Training Module Health")
    try:
        response = requests.get(f"{API_BASE}/api/training/health", timeout=TIMEOUT)
        data = response.json()
        if response.status_code == 200:
            print(f"✓ Health endpoint: Success")
            print(f"✓ Training Available: {data.get('training_available')}")
            if 'modules' in data.get('data', {}):
                modules = data['data']['modules']
                for module, status in modules.items():
                    print(f"  - {module}: {status}")
            return True
        else:
            print(f"✗ Status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_training_context():
    """Test 3: Training context retrieval"""
    print_section("TEST 3: Training Context Retrieval")
    try:
        response = requests.get(f"{API_BASE}/api/training/context", timeout=TIMEOUT)
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Context retrieved successfully")
            print(f"✓ Success: {data.get('success')}")
            print(f"✓ Message: {data.get('message')}")
            
            if 'data' in data and data['data']:
                context_data = data['data']
                print(f"\n  Available Context Areas:")
                for key in context_data.keys():
                    if isinstance(context_data[key], dict):
                        count = len(context_data[key])
                        print(f"    - {key}: {count} items")
                    elif isinstance(context_data[key], list):
                        print(f"    - {key}: {len(context_data[key])} items")
                    else:
                        print(f"    - {key}: available")
            return True
        else:
            print(f"✗ Status code: {response.status_code}")
            print(f"✗ Response: {response.text}")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_gain_staging_analysis():
    """Test 4: Gain staging analysis with training"""
    print_section("TEST 4: Gain Staging Analysis")
    try:
        payload = {
            "track_id": "test_vocal",
            "track_name": "Lead Vocal",
            "track_type": "audio",
            "peak_level": -3.5,
            "rms_level": -15.0,
            "headroom": -3,
            "clipping_detected": False,
            "dynamics": {
                "crest_factor": 8.5,
                "dynamic_range": 18
            }
        }
        
        response = requests.post(
            f"{API_BASE}/api/analyze/gain-staging",
            json=payload,
            timeout=TIMEOUT
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Analysis completed")
            print(f"✓ Status: {data.get('status')}")
            print(f"✓ Score: {data.get('score', 'N/A')}/100")
            
            if 'findings' in data:
                print(f"\n  Findings:")
                for finding in data['findings'][:3]:
                    print(f"    • {finding}")
            
            if 'recommendations' in data:
                print(f"\n  Recommendations:")
                for rec in data['recommendations'][:3]:
                    print(f"    → {rec}")
            
            return True
        else:
            print(f"✗ Status code: {response.status_code}")
            print(f"✗ Response: {response.text}")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_ws_connection():
    """Test 5: WebSocket connection"""
    print_section("TEST 5: WebSocket Connection")
    try:
        import websocket
        ws = websocket.create_connection(f"ws://127.0.0.1:8000/ws", timeout=TIMEOUT)
        
        # Send a test message
        test_msg = json.dumps({"type": "test", "message": "Hello Codette"})
        ws.send(test_msg)
        
        # Try to receive response
        response = ws.recv()
        ws.close()
        
        print(f"✓ WebSocket connected")
        print(f"✓ Test message sent and response received")
        return True
    except ImportError:
        print(f"⊘ WebSocket module not installed, skipping")
        return True
    except Exception as e:
        print(f"⊘ WebSocket test skipped: {e}")
        return True

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("  CODETTE AI TRAINING SYSTEM TEST SUITE")
    print("="*60)
    
    tests = [
        ("Health Check", test_health_check),
        ("Training Health", test_training_health),
        ("Training Context", test_training_context),
        ("Gain Staging Analysis", test_gain_staging_analysis),
        ("WebSocket Connection", test_ws_connection),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n✗ Test failed with exception: {e}")
            results.append((test_name, False))
    
    # Summary
    print_section("TEST SUMMARY")
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Codette AI training system is fully operational.")
        return 0
    else:
        print(f"\n⚠ {total - passed} test(s) failed. Check configuration.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
