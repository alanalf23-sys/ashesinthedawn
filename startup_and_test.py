#!/usr/bin/env python
"""
Start Codette server and wait for it to be ready
"""
import subprocess
import time
import requests
import sys

def wait_for_server(max_wait=30):
    """Wait for server to be ready"""
    print("Waiting for server to start...")
    start_time = time.time()
    
    while time.time() - start_time < max_wait:
        try:
            response = requests.get("http://localhost:8000/health", timeout=2)
            if response.status_code == 200:
                print("? Server is ready!")
                return True
        except requests.exceptions.ConnectionError:
            print(".", end="", flush=True)
            time.sleep(1)
        except Exception as e:
            print(f"??  Error: {e}")
            time.sleep(1)
    
    print("\n? Server did not start within timeout")
    return False

def test_daw_intelligence():
    """Test DAW intelligence"""
    print("\n" + "="*70)
    print("Testing Codette DAW Intelligence")
    print("="*70 + "\n")
    
    payload = {
        "query": "how can I improve my bass mixing?",
        "perspectives": ["neural_network"]
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/api/codette/query",
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            perspectives = data.get("perspectives", {})
            
            for perspective, text in perspectives.items():
                print(f"[{perspective}]")
                print(f"  {text[:300]}...")
                print()
            
            # Check for DAW content
            response_text = str(perspectives)
            daw_indicators = ['bass', 'Hz', 'eq', 'compression', 'frequency', 'kick', 'sub-bass', 'sidechain', 'daw expert']
            
            found_indicators = [ind for ind in daw_indicators if ind.lower() in response_text.lower()]
            
            if found_indicators:
                print("? SUCCESS: Codette is providing DAW-specific responses!")
                print(f"   Found keywords: {', '.join(found_indicators[:5])}")
                return True
            else:
                print("? FAIL: No DAW-specific content detected")
                print("   Expected: Technical mixing advice")
                print("   Got: Generic response")
                return False
        else:
            print(f"? Server error: {response.status_code}")
            return False
    
    except Exception as e:
        print(f"? Error: {e}")
        return False

if __name__ == "__main__":
    print("="*70)
    print("Codette Server Startup & Test")
    print("="*70)
    print()
    
    # Wait for server (assuming it's already starting)
    if wait_for_server(max_wait=60):
        time.sleep(2)  # Extra buffer
        success = test_daw_intelligence()
        
        if success:
            print("\n? ALL TESTS PASSED!")
            print("   Codette is now responding with intelligent DAW advice")
            sys.exit(0)
        else:
            print("\n? TESTS FAILED")
            print("   Server may need restart or code reload")
            sys.exit(1)
    else:
        print("\n? Server failed to start")
        print("   Check: python codette_server_unified.py")
        sys.exit(1)
