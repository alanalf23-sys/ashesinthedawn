#!/usr/bin/env python3
"""
UI Integration Test - Comprehensive End-to-End Validation
Tests the complete flow from UI → Backend → UI Display
"""

import requests
import json
import re
import sys
from datetime import datetime

API_URL = "http://localhost:8000"
ENDPOINTS_TO_TEST = [
    "/codette/chat",
]

def print_header(text):
    """Print formatted header"""
    print(f"\n{'='*70}")
    print(f"  {text}")
    print(f"{'='*70}\n")

def print_section(text):
    """Print formatted section"""
    print(f"\n{'-'*70}")
    print(f"  {text}")
    print(f"{'-'*70}\n")

def test_endpoint_health():
    """Test that API endpoint is reachable"""
    print_section("1. Endpoint Health Check")
    try:
        response = requests.post(
            f"{API_URL}/codette/chat",
            json={"message": "test"},
            timeout=5
        )
        if response.status_code == 200:
            print(f"✅ Endpoint is reachable (HTTP 200)")
            return True
        else:
            print(f"❌ Endpoint returned HTTP {response.status_code}")
            print(f"Response: {response.text[:200]}")
            return False
    except Exception as e:
        print(f"❌ Failed to reach endpoint: {e}")
        return False

def test_request_format():
    """Test that request format is correct"""
    print_section("2. Request Format Validation")
    
    request_payload = {
        "message": "How should I organize my mixing workflow?",
        "perspective": "mix_engineering",
        "context": []
    }
    
    print(f"Request Payload:")
    print(json.dumps(request_payload, indent=2))
    
    try:
        response = requests.post(
            f"{API_URL}/codette/chat",
            json=request_payload,
            timeout=10
        )
        
        if response.status_code == 200:
            print(f"\n✅ Request format accepted (HTTP 200)")
            return True, response.json()
        else:
            print(f"❌ Request rejected with HTTP {response.status_code}")
            print(f"Error: {response.text[:500]}")
            return False, None
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return False, None

def test_response_format(data):
    """Test that response format is correct"""
    print_section("3. Response Format Validation")
    
    if not data:
        print("❌ No response data")
        return False
    
    # Check required fields
    required_fields = ["response", "perspective", "timestamp"]
    for field in required_fields:
        if field not in data:
            print(f"❌ Missing required field: {field}")
            return False
        print(f"✅ {field}: {type(data[field]).__name__}")
    
    print(f"\nFull Response:")
    print(f"  Perspective: {data.get('perspective')}")
    print(f"  Confidence: {data.get('confidence')}")
    print(f"  Response length: {len(data.get('response', ''))} characters")
    
    return True

def test_multi_perspective_format(response_text):
    """Test that response contains multi-perspective format"""
    print_section("4. Multi-Perspective Format Validation")
    
    perspectives = [
        "mix_engineering",
        "audio_theory",
        "creative_production",
        "technical_troubleshooting",
        "workflow_optimization"
    ]
    
    print("Expected perspectives:")
    for p in perspectives:
        print(f"  - {p}")
    
    print("\nSearching in response...")
    found_perspectives = []
    
    for perspective in perspectives:
        pattern = f"\\*\\*{perspective}\\*\\*"
        if re.search(pattern, response_text):
            found_perspectives.append(perspective)
            print(f"✅ Found: {perspective}")
        else:
            print(f"❌ Missing: {perspective}")
    
    if len(found_perspectives) >= 3:
        print(f"\n✅ Multi-perspective format detected ({len(found_perspectives)}/{len(perspectives)} perspectives)")
        return True
    else:
        print(f"\n❌ Insufficient perspectives ({len(found_perspectives)}/{len(perspectives)})")
        return False

def test_regex_parsing(response_text):
    """Test the UI regex pattern against response"""
    print_section("5. Frontend Regex Parsing Test")
    
    # This is the regex from CodetteMasterPanel.tsx (UPDATED)
    regex_pattern = r"^.*?\*\*([a-z_]+)\*\*:\s*\[([^\]]+)\]\s*(.*)"
    
    print("Testing regex pattern (from CodetteMasterPanel.tsx line 274):")
    print(f"  Pattern: {regex_pattern}")
    
    lines = response_text.split('\n')
    matches = []
    
    for i, line in enumerate(lines):
        match = re.match(regex_pattern, line)
        if match:
            perspective = match.group(1)
            engine = match.group(2)
            content = match.group(3)[:50] + ("..." if len(match.group(3)) > 50 else "")
            
            matches.append({
                'perspective': perspective,
                'engine': engine,
                'content': content,
                'line_number': i + 1
            })
            
            print(f"✅ Line {i+1}: {perspective}")
            print(f"   Engine: {engine}")
            print(f"   Content: {content}")
    
    if len(matches) >= 3:
        print(f"\n✅ Regex successfully parsed {len(matches)} perspective lines")
        return True, matches
    else:
        print(f"\n❌ Regex parsed only {len(matches)} lines (expected ≥3)")
        print("\nFull response for debugging:")
        print(response_text[:500])
        return False, matches

def test_icon_mapping(matches):
    """Test that perspectives can be mapped to icons"""
    print_section("6. Perspective → Icon Mapping")
    
    icon_map = {
        'mix_engineering': '🎚️',
        'audio_theory': '📊',
        'creative_production': '🎵',
        'technical_troubleshooting': '🔧',
        'workflow_optimization': '⚡'
    }
    
    print("Icon mapping (from CodetteMasterPanel.tsx):")
    for perspective, icon in icon_map.items():
        print(f"  {icon} {perspective}")
    
    print("\nMatched perspectives with icons:")
    for match in matches:
        perspective = match['perspective']
        icon = icon_map.get(perspective, '✨')
        status = "✅" if perspective in icon_map else "⚠️"
        print(f"{status} {icon} {perspective}")
    
    return True

def test_display_format(matches):
    """Test how response would be displayed"""
    print_section("7. UI Display Format Simulation")
    
    icon_map = {
        'mix_engineering': '🎚️',
        'audio_theory': '📊',
        'creative_production': '🎵',
        'technical_troubleshooting': '🔧',
        'workflow_optimization': '⚡'
    }
    
    print("How each perspective would display in UI:\n")
    
    for i, match in enumerate(matches[:5]):  # Show first 5
        perspective = match['perspective']
        icon = icon_map.get(perspective, '✨')
        content = match['content']
        
        print(f"┌─ Perspective {i+1} (border-l-2 border-purple-500)")
        print(f"│  {icon} {perspective.upper().replace('_', ' ')}")
        print(f"│  {content}")
        print(f"└─\n")
    
    return True

def run_all_tests():
    """Run all validation tests"""
    print_header("UI ↔ Backend Integration Test Suite")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print(f"API URL: {API_URL}")
    
    results = {
        'health': False,
        'request_format': False,
        'response_format': False,
        'multi_perspective': False,
        'regex_parsing': False,
        'icon_mapping': False,
        'display_format': False,
    }
    
    # Test 1: Health
    results['health'] = test_endpoint_health()
    if not results['health']:
        print("\n❌ Backend endpoint is not accessible. Cannot continue tests.")
        return results
    
    # Test 2: Request Format
    success, data = test_request_format()
    results['request_format'] = success
    if not success:
        print("\n❌ Request format validation failed. Backend rejected request.")
        return results
    
    # Test 3: Response Format
    results['response_format'] = test_response_format(data)
    if not results['response_format']:
        print("\n❌ Response format validation failed.")
        return results
    
    # Test 4: Multi-Perspective Format
    results['multi_perspective'] = test_multi_perspective_format(data.get('response', ''))
    
    # Test 5: Regex Parsing
    success, matches = test_regex_parsing(data.get('response', ''))
    results['regex_parsing'] = success
    if success and matches:
        # Test 6: Icon Mapping
        results['icon_mapping'] = test_icon_mapping(matches)
        
        # Test 7: Display Format
        results['display_format'] = test_display_format(matches)
    
    # Summary
    print_header("Test Summary")
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name.replace('_', ' ').title()}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n✅ All tests passed! UI ↔ Backend integration is working correctly.")
        return 0
    else:
        print(f"\n⚠️ {total - passed} test(s) failed. See details above.")
        return 1

if __name__ == "__main__":
    exit_code = run_all_tests()
    sys.exit(exit_code)

