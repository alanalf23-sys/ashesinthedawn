"""
Test Suite for Codette AI Mixing Questions
Real-world DAW scenarios and mixing questions to verify Codette's responses
"""

import requests
import json
import time
from typing import Dict, Any, List

# Server configuration
BASE_URL = "http://localhost:8000"
CHAT_ENDPOINT = f"{BASE_URL}/codette/chat"
SUGGEST_ENDPOINT = f"{BASE_URL}/api/codette/suggest"

def print_section(title: str):
    """Print formatted section header"""
    print("\n" + "="*70)
    print(f"   {title}")
    print("="*70)

def test_chat(message: str, daw_context: Dict[str, Any] = None) -> Dict[str, Any]:
    """Test chat endpoint with message and optional DAW context"""
    payload = {
        "message": message,
        "perspective": "mix_engineering",
        "daw_context": daw_context
    }
    
    print(f"\n?? Query: {message}")
    if daw_context:
        print(f"?? Context: {daw_context.get('selected_track', {}).get('name', 'N/A')}")
    
    try:
        response = requests.post(CHAT_ENDPOINT, json=payload, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        print(f"\n?? Response ({data.get('source', 'unknown')}):")
        print(data.get('response', 'No response'))
        print(f"\n? Confidence: {data.get('confidence', 0):.2%}")
        
        if 'mixing_intent' in data:
            intent = data['mixing_intent']
            print(f"?? Intent: {intent.get('category')} ({intent.get('confidence', 0):.2%})")
        
        return data
    except Exception as e:
        print(f"? Error: {e}")
        return {}

def test_suggestions(context: Dict[str, Any]) -> Dict[str, Any]:
    """Test suggestions endpoint"""
    print(f"\n?? Requesting suggestions for: {context.get('type', 'general')}")
    
    try:
        payload = {"context": context, "limit": 3}
        response = requests.post(SUGGEST_ENDPOINT, json=payload, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        print(f"\n?? Suggestions ({len(data.get('suggestions', []))}):")
        for i, sugg in enumerate(data.get('suggestions', []), 1):
            print(f"\n{i}. {sugg.get('title', 'No title')}")
            print(f"   {sugg.get('description', 'No description')}")
            print(f"   ? Confidence: {sugg.get('confidence', 0):.2%}")
        
        return data
    except Exception as e:
        print(f"? Error: {e}")
        return {}

# ============================================================================
# TEST CASES
# ============================================================================

def run_eq_tests():
    """Test EQ-related questions"""
    print_section("EQ & FREQUENCY TESTS")
    
    # Test 1: Basic EQ question
    test_chat("How do I EQ vocals to reduce muddiness?")
    
    # Test 2: EQ with track context
    daw_context = {
        "selected_track": {
            "name": "Lead Vocal",
            "type": "audio",
            "volume": -6,
            "pan": 0
        },
        "tracks": [{"name": "Lead Vocal", "type": "audio"}],
        "bpm": 120
    }
    test_chat("What EQ settings should I use for this vocal track?", daw_context)
    
    # Test 3: Frequency-specific question
    test_chat("Should I boost or cut at 3kHz for presence?")

def run_compression_tests():
    """Test dynamics/compression questions"""
    print_section("DYNAMICS & COMPRESSION TESTS")
    
    # Test 1: Basic compression
    test_chat("Explain compression ratio and how to use it")
    
    # Test 2: Compression with context
    daw_context = {
        "selected_track": {
            "name": "Drums",
            "type": "audio",
            "volume": -3,
            "peak_level": -2.1
        },
        "genre": "rock"
    }
    test_chat("How should I compress these drums?", daw_context)
    
    # Test 3: Parallel compression
    test_chat("Explain parallel compression and when to use it")

def run_mixing_tests():
    """Test general mixing questions"""
    print_section("MIXING TECHNIQUE TESTS")
    
    # Test 1: Gain staging
    test_chat("What is proper gain staging?")
    
    # Test 2: Panning strategy
    test_chat("How should I pan instruments in a pop mix?")
    
    # Test 3: Bus routing
    daw_context = {
        "tracks": [
            {"name": "Kick", "type": "audio"},
            {"name": "Snare", "type": "audio"},
            {"name": "Hihat", "type": "audio"},
            {"name": "Bass", "type": "audio"},
            {"name": "Guitar", "type": "audio"}
        ],
        "bpm": 140
    }
    test_chat("Should I create buses for these tracks?", daw_context)

def run_effects_tests():
    """Test effects processing questions"""
    print_section("EFFECTS PROCESSING TESTS")
    
    # Test 1: Reverb
    test_chat("What's the difference between plate and hall reverb?")
    
    # Test 2: Delay sync
    daw_context = {"bpm": 128}
    test_chat("What delay time should I use for a quarter note?", daw_context)
    
    # Test 3: Effect chain order
    test_chat("What order should I put EQ, compression, and reverb?")

def run_mastering_tests():
    """Test mastering-related questions"""
    print_section("MASTERING TESTS")
    
    # Test 1: Loudness target
    test_chat("What LUFS should I target for Spotify?")
    
    # Test 2: Headroom
    test_chat("How much headroom should I leave before mastering?")
    
    # Test 3: Master chain
    test_chat("What effects should I use on the master bus?")

def run_suggestion_tests():
    """Test suggestion endpoint"""
    print_section("SUGGESTION ENGINE TESTS")
    
    # Test 1: Mixing suggestions
    test_suggestions({"type": "mixing", "genre": "electronic"})
    
    # Test 2: Gain staging suggestions
    test_suggestions({"type": "gain-staging"})
    
    # Test 3: Mastering suggestions
    test_suggestions({"type": "mastering", "genre": "pop"})

def run_contextual_tests():
    """Test context-aware responses"""
    print_section("CONTEXTUAL AWARENESS TESTS")
    
    # Test 1: Multiple track context
    daw_context = {
        "tracks": [
            {"name": "Kick", "type": "audio", "volume": -6},
            {"name": "Bass", "type": "audio", "volume": -8},
            {"name": "Vocals", "type": "audio", "volume": -4}
        ],
        "selected_track": {"name": "Vocals", "type": "audio"},
        "bpm": 120,
        "genre": "pop"
    }
    test_chat("How can I make the vocals sit better in this mix?", daw_context)
    
    # Test 2: Genre-specific
    daw_context = {"genre": "hip-hop", "bpm": 88}
    test_chat("How should I process bass in this genre?", daw_context)

def run_all_tests():
    """Run all test suites"""
    print("\n" + "?"*70)
    print("   CODETTE AI MIXING TESTS - COMPREHENSIVE SUITE")
    print("?"*70)
    
    try:
        # Check server health
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        response.raise_for_status()
        print("? Server is running")
    except Exception as e:
        print(f"? Server not available: {e}")
        print(f"   Please start server: python codette_server_unified.py")
        return
    
    # Run test suites
    run_eq_tests()
    run_compression_tests()
    run_mixing_tests()
    run_effects_tests()
    run_mastering_tests()
    run_suggestion_tests()
    run_contextual_tests()
    
    print_section("TEST SUITE COMPLETE")
    print("? All tests executed")
    print("\nReview responses above to verify:")
    print("  - Correct intent detection")
    print("  - Relevant DAW-specific answers")
    print("  - Proper use of context information")
    print("  - Appropriate confidence levels")
    print("  - Professional mixing terminology")

if __name__ == "__main__":
    run_all_tests()
