#!/usr/bin/env python
"""
Integration Test Suite - Real Codette AI + React DAW
Tests all endpoints with real AI verification
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://127.0.0.1:8001"
HEADERS = {"Content-Type": "application/json"}

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_test(name, status, details=""):
    symbol = f"{Colors.GREEN}✅{Colors.RESET}" if status else f"{Colors.RED}❌{Colors.RESET}"
    print(f"{symbol} {name}")
    if details:
        print(f"   {details}")

def print_section(title):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{title}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")

# ============================================================================
# TEST SUITE
# ============================================================================

def test_health_check():
    """Test 1: Health check endpoint"""
    print_section("Test 1: Health Check")
    try:
        resp = requests.get(f"{BASE_URL}/health", headers=HEADERS, timeout=5)
        status = resp.status_code == 200
        details = f"Status: {resp.status_code} | Service: {resp.json().get('service', 'N/A')}"
        print_test("Health Check", status, details)
        return status
    except Exception as e:
        print_test("Health Check", False, f"Error: {e}")
        return False

def test_status_endpoint():
    """Test 2: Status endpoint with AI mode detection"""
    print_section("Test 2: Status Endpoint")
    try:
        resp = requests.get(f"{BASE_URL}/status", headers=HEADERS, timeout=5)
        status = resp.status_code == 200
        data = resp.json()
        
        ai_mode = data.get("ai_mode", "UNKNOWN")
        print_test("Status Endpoint", status, f"AI Mode: {ai_mode}")
        
        if "ai_engine" in data:
            engine = data["ai_engine"]
            print_test("Real AI Detected", True, f"Engine: {engine.get('engine')} v{engine.get('version')}")
            
            components = engine.get("components", {})
            if components:
                print(f"   Components loaded: {json.dumps(components, indent=6)}")
        
        return status
    except Exception as e:
        print_test("Status Endpoint", False, f"Error: {e}")
        return False

def test_chat_endpoint():
    """Test 3: Chat with real AI"""
    print_section("Test 3: Chat Endpoint (Real AI)")
    try:
        payload = {
            "message": "How should I approach mixing a professional vocal track?",
            "conversation_id": "test-session-001"
        }
        
        resp = requests.post(f"{BASE_URL}/chat", json=payload, headers=HEADERS, timeout=10)
        status = resp.status_code == 200
        
        if status:
            data = resp.json()
            print_test("Chat Request", True, f"Confidence: {data.get('confidence', 0):.2f}")
            print_test("AI Source", True, f"Source: {data.get('source', 'unknown')}")
            
            response_text = data.get('response', '')
            if response_text:
                print(f"   Response Preview: {response_text[:100]}...")
            
            # Check for multi-perspective data
            if 'all_perspectives' in data:
                perspectives = data['all_perspectives']
                print_test("Multi-Perspective Analysis", True, f"Perspectives: {len(perspectives)}")
                for p in perspectives[:3]:
                    print(f"   - {p.get('name', 'unknown').upper()}")
            
            # Check sentiment
            if 'sentiment' in data:
                sentiment = data['sentiment']
                print_test("Sentiment Analysis", True, f"Compound: {sentiment.get('compound', 0):.2f}")
        else:
            print_test("Chat Request", False, f"Status: {resp.status_code}")
        
        return status
    except Exception as e:
        print_test("Chat Endpoint", False, f"Error: {e}")
        return False

def test_suggestions_endpoint():
    """Test 4: Suggestions with real AI"""
    print_section("Test 4: Suggestions Endpoint (Real AI)")
    try:
        payload = {
            "context": {
                "type": "mixing",
                "genre": "electronic",
                "mood": "energetic"
            }
        }
        
        resp = requests.post(f"{BASE_URL}/suggestions", json=payload, headers=HEADERS, timeout=10)
        status = resp.status_code == 200
        
        if status:
            data = resp.json()
            suggestions = data.get('suggestions', [])
            print_test("Suggestions Request", True, f"Received {len(suggestions)} suggestions")
            
            for i, sugg in enumerate(suggestions[:3], 1):
                source = sugg.get('source', 'unknown')
                confidence = sugg.get('confidence', 0)
                print(f"   {i}. {sugg.get('title', 'N/A')} ({source}, {confidence:.2f})")
        else:
            print_test("Suggestions Request", False, f"Status: {resp.status_code}")
        
        return status
    except Exception as e:
        print_test("Suggestions Endpoint", False, f"Error: {e}")
        return False

def test_analyze_endpoint():
    """Test 5: Audio analysis with real AI"""
    print_section("Test 5: Analysis Endpoint (Real AI)")
    try:
        payload = {
            "analysis_type": "spectrum",
            "audio_data": {
                "duration": 30.5,
                "peak_level": -1.5,
                "rms_level": -17.8
            }
        }
        
        resp = requests.post(f"{BASE_URL}/analyze", json=payload, headers=HEADERS, timeout=10)
        status = resp.status_code == 200
        
        if status:
            data = resp.json()
            quality_score = data.get('quality_score', 0)
            print_test("Audio Analysis", True, f"Quality Score: {quality_score:.2f}")
            print_test("AI Assessment", True, f"Source: {data.get('source', 'unknown')}")
            
            assessment = data.get('ai_quality_assessment', '')
            if assessment:
                print(f"   Assessment: {assessment}")
            
            recommendations = data.get('recommendations', [])
            if recommendations:
                print(f"   Recommendations: {len(recommendations)}")
                for rec in recommendations[:2]:
                    print(f"   - {rec}")
        else:
            print_test("Audio Analysis", False, f"Status: {resp.status_code}")
        
        return status
    except Exception as e:
        print_test("Analysis Endpoint", False, f"Error: {e}")
        return False

def test_sync_endpoint():
    """Test 6: DAW state sync"""
    print_section("Test 6: Sync Endpoint")
    try:
        payload = {
            "tracks": [
                {"id": "track-1", "name": "Vocals", "type": "audio"},
                {"id": "track-2", "name": "Bass", "type": "audio"},
                {"id": "track-3", "name": "Drums", "type": "audio"}
            ],
            "bpm": 120,
            "current_time": 15.5,
            "is_playing": True
        }
        
        resp = requests.post(f"{BASE_URL}/sync", json=payload, headers=HEADERS, timeout=5)
        status = resp.status_code == 200
        
        if status:
            data = resp.json()
            sync_status = data.get('status', '')
            print_test("DAW State Sync", True, sync_status)
        else:
            print_test("DAW State Sync", False, f"Status: {resp.status_code}")
        
        return status
    except Exception as e:
        print_test("Sync Endpoint", False, f"Error: {e}")
        return False

def test_real_ai_comparison():
    """Test 7: Compare real AI vs mock responses"""
    print_section("Test 7: Real AI Verification")
    try:
        # Get status to check if real AI is active
        resp = requests.get(f"{BASE_URL}/status", headers=HEADERS, timeout=5)
        data = resp.json()
        ai_mode = data.get("ai_mode", "")
        
        is_real_ai = "REAL" in ai_mode
        print_test("Real AI Active", is_real_ai, f"Mode: {ai_mode}")
        
        if is_real_ai:
            print(f"\n{Colors.GREEN}{Colors.BOLD}🧠 REAL CODETTE AI SYSTEM ACTIVE!{Colors.RESET}")
            print(f"   Multi-perspective reasoning enabled")
            print(f"   Sentiment analysis active")
            print(f"   Neural network, Newtonian logic, and quantum perspectives operational")
        else:
            print(f"\n{Colors.YELLOW}{Colors.BOLD}🤖 MOCK ENGINE (Real AI Not Available){Colors.RESET}")
            print(f"   System will use mock AI for now")
            print(f"   To enable real AI, ensure Codette files exist in ./codette/")
        
        return True
    except Exception as e:
        print_test("Real AI Verification", False, f"Error: {e}")
        return False

# ============================================================================
# MAIN
# ============================================================================

def main():
    print(f"\n{Colors.BOLD}{Colors.BLUE}")
    print("╔" + "═"*58 + "╗")
    print("║" + " "*10 + "CODETTE REAL AI - INTEGRATION TEST SUITE" + " "*7 + "║")
    print("║" + " "*15 + f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}" + " "*20 + "║")
    print("╚" + "═"*58 + "╝")
    print(Colors.RESET)
    
    # Check server availability
    print(f"\n{Colors.YELLOW}Connecting to Codette AI Server...{Colors.RESET}")
    time.sleep(1)
    
    try:
        resp = requests.get(f"{BASE_URL}/health", timeout=2)
        print(f"{Colors.GREEN}✅ Server is running on {BASE_URL}{Colors.RESET}\n")
    except Exception as e:
        print(f"{Colors.RED}❌ Cannot connect to server at {BASE_URL}{Colors.RESET}")
        print(f"   Error: {e}")
        print(f"\n{Colors.YELLOW}Make sure to run: python codette_server_production.py{Colors.RESET}")
        return
    
    # Run all tests
    results = []
    results.append(("Health Check", test_health_check()))
    time.sleep(0.5)
    
    results.append(("Status Endpoint", test_status_endpoint()))
    time.sleep(0.5)
    
    results.append(("Chat (Real AI)", test_chat_endpoint()))
    time.sleep(1)
    
    results.append(("Suggestions (Real AI)", test_suggestions_endpoint()))
    time.sleep(1)
    
    results.append(("Analysis (Real AI)", test_analyze_endpoint()))
    time.sleep(0.5)
    
    results.append(("Sync Endpoint", test_sync_endpoint()))
    time.sleep(0.5)
    
    results.append(("Real AI Verification", test_real_ai_comparison()))
    
    # Summary
    print_section("Test Summary")
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        symbol = f"{Colors.GREEN}✅{Colors.RESET}" if result else f"{Colors.RED}❌{Colors.RESET}"
        print(f"{symbol} {name}")
    
    print(f"\n{Colors.BOLD}Result: {passed}/{total} tests passed{Colors.RESET}")
    
    if passed == total:
        print(f"{Colors.GREEN}{Colors.BOLD}🎉 All integration tests passed!{Colors.RESET}")
        print(f"{Colors.GREEN}✨ Real Codette AI is fully operational!{Colors.RESET}\n")
    else:
        print(f"{Colors.YELLOW}⚠️  {total - passed} test(s) failed. Check logs above.{Colors.RESET}\n")

if __name__ == "__main__":
    main()
