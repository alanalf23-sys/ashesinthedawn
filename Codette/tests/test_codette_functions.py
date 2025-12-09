#!/usr/bin/env python3
"""
Comprehensive Codette Backend Verification Suite
Tests all critical endpoints to ensure 100% operational status.

Command: python test_codette_functions.py
Expected: 10/10 tests passing
"""

import requests
import json
import sys
from typing import Dict, Any, Tuple

BASE_URL = "http://localhost:8000"
TESTS_PASSED = 0
TESTS_FAILED = 0


def test_endpoint(
    test_name: str,
    method: str,
    endpoint: str,
    data: Dict[str, Any] = None,
    expected_status: int = 200,
) -> Tuple[bool, str]:
    """Test a single endpoint and return result."""
    global TESTS_PASSED, TESTS_FAILED

    url = f"{BASE_URL}{endpoint}"
    try:
        if method == "GET":
            response = requests.get(url, timeout=10)
        elif method == "POST":
            response = requests.post(
                url, json=data, timeout=10, headers={"Content-Type": "application/json"}
            )
        else:
            return False, f"Unknown method: {method}"

        if response.status_code == expected_status:
            TESTS_PASSED += 1
            return True, f"✅ {test_name}: {response.status_code}"
        else:
            TESTS_FAILED += 1
            return (
                False,
                f"❌ {test_name}: Expected {expected_status}, got {response.status_code}",
            )
    except Exception as e:
        TESTS_FAILED += 1
        return False, f"❌ {test_name}: {str(e)}"


def main():
    """Run all Codette backend tests."""
    global TESTS_PASSED, TESTS_FAILED

    print("=" * 70)
    print("CODETTE BACKEND VERIFICATION SUITE")
    print("=" * 70)
    print(f"\nTesting: {BASE_URL}\n")

    tests = [
        # Test 1: Health Check
        (
            "Test 1: Health Check",
            "GET",
            "/health",
            None,
            200,
        ),
        # Test 2: Chat Endpoint
        (
            "Test 2: Chat Interaction",
            "POST",
            "/codette/chat",
            {
                "user_message": "Hello Codette, how are you?",
                "conversation_id": "test_123",
                "context": "general",
            },
            200,
        ),
        # Test 3: Suggestions Endpoint
        (
            "Test 3: Music Suggestions",
            "POST",
            "/codette/suggest",
            {
                "context": {"type": "production", "mood": "energetic"},
                "limit": 5,
            },
            200,
        ),
        # Test 4: Genre Detection
        (
            "Test 4: Genre Detection",
            "POST",
            "/codette/analyze_genre",
            {
                "audio_features": {
                    "tempo": 120,
                    "energy": 0.8,
                    "danceability": 0.7,
                    "valence": 0.6,
                }
            },
            200,
        ),
        # Test 5: Delay Sync
        (
            "Test 5: Delay Sync Calculation",
            "POST",
            "/codette/sync_delay",
            {"bpm": 120, "delay_type": "eighth_note"},
            200,
        ),
        # Test 6: DAW Controls
        (
            "Test 6: DAW Control",
            "POST",
            "/codette/daw_control",
            {
                "command": "play",
                "track_id": "audio_1",
                "parameters": {"volume": -6},
            },
            200,
        ),
        # Test 7: Audio Analysis
        (
            "Test 7: Audio Analysis",
            "POST",
            "/codette/analyze_audio",
            {
                "audio_data": {"duration": 3.5, "sample_rate": 44100},
                "analysis_type": "spectrum",
            },
            200,
        ),
        # Test 8: Gain Staging
        (
            "Test 8: Gain Staging",
            "POST",
            "/codette/gain_staging",
            {"target_level": -3, "current_level": -12},
            200,
        ),
        # Test 9: Production Checklist
        (
            "Test 9: Production Checklist",
            "POST",
            "/codette/production_checklist",
            {"project_state": {"master_volume": -3, "tracks": 8}},
            200,
        ),
        # Test 10: Instrument Info
        (
            "Test 10: Instrument Information",
            "POST",
            "/codette/instrument_info",
            {"instrument": "synthesizer", "query": "what effects work best?"},
            200,
        ),
    ]

    # Run all tests
    for test in tests:
        test_name, method, endpoint, data, expected_status = test
        success, message = test_endpoint(test_name, method, endpoint, data, expected_status)
        print(message)

    # Print summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    total = TESTS_PASSED + TESTS_FAILED
    pass_rate = (TESTS_PASSED / total * 100) if total > 0 else 0
    print(f"✅ PASSED: {TESTS_PASSED}")
    print(f"❌ FAILED: {TESTS_FAILED}")
    print(f"📊 PASS RATE: {pass_rate:.1f}%")
    print("=" * 70)

    return 0 if TESTS_FAILED == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
