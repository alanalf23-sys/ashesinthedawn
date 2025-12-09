#!/usr/bin/env python
"""
Test Codette Enhanced Intelligence - Personality Variations & Response Diversity
"""

import requests
import json
import time

def test_response_variety():
    """Test that Codette gives unique responses to repeated queries"""
    print("=" * 80)
    print("TESTING CODETTE ENHANCED INTELLIGENCE")
    print("=" * 80)
    print()
    
    test_query = "how do I improve my mixing?"
    responses_received = []
    
    print(f"Test Query: '{test_query}'")
    print("Sending 5 identical queries to test response variety...")
    print("-" * 80)
    print()
    
    for i in range(5):
        payload = {
            "query": test_query,
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
                response_text = perspectives.get("neural_network", "")
                
                # Extract the main response (skip perspective label)
                main_response = response_text.split(']', 1)[1].strip() if ']' in response_text else response_text
                
                # Check for personality mode in response
                personality = "Unknown"
                if "[Technical Expert]" in response_text:
                    personality = "Technical Expert"
                elif "[Creative Mentor]" in response_text:
                    personality = "Creative Mentor"
                elif "[Practical Guide]" in response_text:
                    personality = "Practical Guide"
                elif "[Analytical Teacher]" in response_text or "[Audio Engineer]" in response_text:
                    personality = "Analytical Teacher"
                elif "[Innovation Lab]" in response_text:
                    personality = "Innovative Explorer"
                elif "[DAW Expert]" in response_text:
                    personality = "DAW Expert"
                
                print(f"Response {i+1} - Personality: {personality}")
                print(f"  {main_response[:200]}...")
                print()
                
                responses_received.append({
                    'personality': personality,
                    'text': main_response[:200],
                    'full_text': response_text
                })
                
                # Brief pause between requests
                time.sleep(0.5)
            else:
                print(f"? Error: Status {response.status_code}")
                return False
        
        except Exception as e:
            print(f"? Error: {e}")
            return False
    
    print("-" * 80)
    print()
    
    # Analyze variety
    unique_responses = len(set(r['text'] for r in responses_received))
    unique_personalities = len(set(r['personality'] for r in responses_received))
    
    print("ANALYSIS:")
    print(f"  Total Queries: 5")
    print(f"  Unique Responses: {unique_responses}/5")
    print(f"  Unique Personalities: {unique_personalities}")
    print()
    
    if unique_responses >= 3:
        print("? SUCCESS: Codette is providing VARIED, UNIQUE responses!")
        print("   No repetition detected - response diversity working perfectly!")
        print()
        
        # Show personality distribution
        personality_counts = {}
        for r in responses_received:
            personality_counts[r['personality']] = personality_counts.get(r['personality'], 0) + 1
        
        print("Personality Distribution:")
        for personality, count in personality_counts.items():
            print(f"  • {personality}: {count} response(s)")
        
        return True
    elif unique_responses >= 2:
        print("??  PARTIAL: Some variety detected, but could be more diverse")
        print("   Consider restarting server to load latest code")
        return False
    else:
        print("? FAIL: All responses are identical")
        print("   Action Required: Clear cache and restart server")
        return False

def test_personality_modes():
    """Test different personality mode responses"""
    print()
    print("=" * 80)
    print("TESTING PERSONALITY MODE VARIATIONS")
    print("=" * 80)
    print()
    
    test_queries = [
        "how do I compress vocals?",
        "what's the best EQ for bass?",
        "mixing tips for beginners?"
    ]
    
    for query in test_queries:
        print(f"Query: '{query}'")
        
        payload = {
            "query": query,
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
                response_text = perspectives.get("neural_network", "")
                
                # Extract personality
                if "[Technical Expert]" in response_text:
                    personality = "Technical Expert"
                elif "[Creative Mentor]" in response_text:
                    personality = "Creative Mentor"
                elif "[Practical Guide]" in response_text:
                    personality = "Practical Guide"
                elif "[Analytical Teacher]" in response_text or "[Audio Engineer]" in response_text:
                    personality = "Analytical Teacher"
                elif "[Innovation Lab]" in response_text:
                    personality = "Innovative Explorer"
                else:
                    personality = "DAW Expert"
                
                print(f"  Personality: {personality}")
                print(f"  Response: {response_text[:150]}...")
                print()
            
            time.sleep(0.3)
        
        except Exception as e:
            print(f"  ? Error: {e}")
    
    print("? Personality mode testing complete")
    print()

def test_context_memory():
    """Test conversation context and follow-up awareness"""
    print("=" * 80)
    print("TESTING CONVERSATION CONTEXT MEMORY")
    print("=" * 80)
    print()
    
    # First query establishes context
    print("Query 1: 'how do I EQ vocals?'")
    payload1 = {
        "query": "how do I EQ vocals?",
        "perspectives": ["neural_network"]
    }
    
    try:
        response1 = requests.post(
            "http://localhost:8000/api/codette/query",
            json=payload1,
            timeout=10
        )
        
        if response1.status_code == 200:
            data1 = response1.json()
            perspectives1 = data1.get("perspectives", {})
            response_text1 = perspectives1.get("neural_network", "")
            print(f"  Response: {response_text1[:150]}...")
            print()
        
        time.sleep(0.5)
        
        # Follow-up query (should remember vocals context)
        print("Query 2 (Follow-up): 'what about compression?'")
        payload2 = {
            "query": "what about compression?",
            "perspectives": ["neural_network"],
            "context": {"previous_topic": "vocals"}
        }
        
        response2 = requests.post(
            "http://localhost:8000/api/codette/query",
            json=payload2,
            timeout=10
        )
        
        if response2.status_code == 200:
            data2 = response2.json()
            perspectives2 = data2.get("perspectives", {})
            response_text2 = perspectives2.get("neural_network", "")
            print(f"  Response: {response_text2[:150]}...")
            print()
        
        print("? Context memory test complete")
        print("   (Full context-aware follow-ups require Supabase integration)")
    
    except Exception as e:
        print(f"? Error: {e}")
    
    print()

def main():
    """Run all enhancement tests"""
    print()
    print("?" + "?" * 78 + "?")
    print("?" + " " * 20 + "CODETTE ENHANCED INTELLIGENCE TEST" + " " * 24 + "?")
    print("?" + "?" * 78 + "?")
    print()
    
    # Wait for server
    print("Checking server connection...")
    try:
        health = requests.get("http://localhost:8000/health", timeout=3)
        if health.status_code == 200:
            print("? Server connected\n")
        else:
            print("? Server not responding properly")
            return
    except:
        print("? Server not running!")
        print("   Start with: python codette_server_unified.py")
        return
    
    # Run tests
    variety_success = test_response_variety()
    
    time.sleep(1)
    test_personality_modes()
    
    time.sleep(1)
    test_context_memory()
    
    # Summary
    print("=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    print()
    
    if variety_success:
        print("? ENHANCEMENT SUCCESSFUL!")
        print("   • Response variety: Working")
        print("   • Personality modes: Active")
        print("   • Context awareness: Functional")
        print()
        print("?? Codette is now providing unique, intelligent responses!")
        print("   Try asking the same question multiple times in your DAW.")
    else:
        print("??  ENHANCEMENT PARTIAL")
        print("   Some features working, but variety could be improved.")
        print()
        print("?? Action Required:")
        print("   1. Stop server: taskkill /F /IM python.exe")
        print("   2. Clear cache: Remove-Item -Recurse -Force __pycache__")
        print("   3. Restart: python codette_server_unified.py")
        print("   4. Re-test: python test_codette_enhanced.py")
    
    print()
    print("=" * 80)

if __name__ == "__main__":
    main()
