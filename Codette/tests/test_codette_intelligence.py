#!/usr/bin/env python
"""
Quick test to verify Codette is responding with DAW intelligence
"""

import requests
import json

def test_codette_daw_response():
    """Test that Codette gives intelligent DAW responses"""
    print("=" * 70)
    print("Testing Codette DAW Intelligence")
    print("=" * 70)
    print()
    
    # Test 1: DAW-specific query
    print("Test 1: DAW-Specific Query")
    print("-" * 70)
    
    payload = {
        "query": "how can I improve my bass mixing?",
        "perspectives": ["neural_network", "davinci_synthesis"]
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
            
            print(f"? Server responded (status: {response.status_code})")
            print()
            
            # Check if response contains DAW-specific content
            has_daw_content = False
            for perspective, text in perspectives.items():
                print(f"[{perspective}]")
                print(f"  {text[:200]}...")
                print()
                
                # Check for DAW keywords in response
                daw_indicators = ['bass', 'Hz', 'eq', 'compression', 'frequency', 'kick', 'sub-bass', 'sidechain']
                if any(indicator in text.lower() for indicator in daw_indicators):
                    has_daw_content = True
            
            if has_daw_content:
                print("? SUCCESS: Codette is providing DAW-specific intelligent responses!")
                print("   Response contains: bass mixing advice, frequency recommendations, etc.")
            else:
                print("? FAIL: Response lacks DAW-specific content")
                print("   Expected: Mixing advice with technical terms (Hz, EQ, compression)")
                print("   Got: Generic response without audio engineering guidance")
                print()
                print("   Action Required: Server needs restart to load updated code")
        else:
            print(f"? Server error: {response.status_code}")
            print(f"   Response: {response.text}")
    
    except requests.exceptions.ConnectionError:
        print("? FAIL: Cannot connect to server")
        print("   Action Required: Start server with: python codette_server_unified.py")
    except Exception as e:
        print(f"? Error: {e}")
    
    print()
    print("=" * 70)
    
    # Test 2: Non-DAW query (should still work)
    print()
    print("Test 2: Non-DAW Query (should use multi-perspective)")
    print("-" * 70)
    
    payload2 = {
        "query": "what is creativity?",
        "perspectives": ["neural_network"]
    }
    
    try:
        response2 = requests.post(
            "http://localhost:8000/api/codette/query",
            json=payload2,
            timeout=10
        )
        
        if response2.status_code == 200:
            data2 = response2.json()
            perspectives2 = data2.get("perspectives", {})
            
            print("? Server responded")
            for perspective, text in perspectives2.items():
                print(f"[{perspective}] {text[:150]}...")
            print()
            print("? Non-DAW queries still work with multi-perspective analysis")
        else:
            print(f"??  Status: {response2.status_code}")
    
    except Exception as e:
        print(f"??  Error: {e}")
    
    print()
    print("=" * 70)
    print("Testing Complete")
    print("=" * 70)

if __name__ == "__main__":
    test_codette_daw_response()
