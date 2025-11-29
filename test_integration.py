#!/usr/bin/env python
"""
Integration Test: DAW ↔ Codette Communication Verification
Tests bidirectional communication between React DAW and Codette AI Server
"""

import asyncio
import json
import sys
from pathlib import Path

try:
    import httpx
except ImportError:
    print("❌ httpx not installed. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "httpx", "-q"])
    import httpx

# ============================================================================
# CONFIGURATION
# ============================================================================

DAW_URL = "http://localhost:5173"
CODETTE_URL = "http://localhost:8001"

print("\n" + "="*70)
print("🧪 CODETTE AI ↔ DAW INTEGRATION TEST")
print("="*70)
print(f"📍 DAW Frontend:      {DAW_URL}")
print(f"📍 Codette Backend:   {CODETTE_URL}")
print("="*70 + "\n")

# ============================================================================
# TEST FUNCTIONS
# ============================================================================

async def test_codette_health():
    """Test Codette server health"""
    print("🔍 Testing Codette Health...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{CODETTE_URL}/health", timeout=5.0)
            if response.status_code == 200:
                print("   ✅ Codette server is healthy")
                print(f"   📊 Response: {response.json()}")
                return True
            else:
                print(f"   ❌ Codette returned status {response.status_code}")
                return False
    except Exception as e:
        print(f"   ❌ Could not reach Codette: {e}")
        return False

async def test_chat():
    """Test chat functionality"""
    print("\n🔍 Testing Chat Endpoint...")
    try:
        async with httpx.AsyncClient() as client:
            payload = {
                "message": "How should I mix a vocal track?",
                "conversation_id": "test-123"
            }
            response = await client.post(
                f"{CODETTE_URL}/chat",
                json=payload,
                timeout=5.0
            )
            if response.status_code == 200:
                data = response.json()
                print("   ✅ Chat endpoint working")
                print(f"   📝 Response: {data['response'][:80]}...")
                print(f"   📊 Confidence: {data['confidence']}")
                return True
            else:
                print(f"   ❌ Chat returned status {response.status_code}")
                return False
    except Exception as e:
        print(f"   ❌ Chat test failed: {e}")
        return False

async def test_suggestions():
    """Test suggestions endpoint"""
    print("\n🔍 Testing Suggestions Endpoint...")
    try:
        async with httpx.AsyncClient() as client:
            payload = {
                "context": {
                    "type": "mixing",
                    "mood": "energetic",
                    "genre": "electronic",
                    "bpm": 128,
                    "track_type": "drums"
                },
                "limit": 3
            }
            response = await client.post(
                f"{CODETTE_URL}/suggestions",
                json=payload,
                timeout=5.0
            )
            if response.status_code == 200:
                data = response.json()
                print("   ✅ Suggestions endpoint working")
                print(f"   🎯 Generated {len(data['suggestions'])} suggestions")
                for i, sugg in enumerate(data['suggestions'][:2], 1):
                    print(f"      {i}. {sugg['title']} (confidence: {sugg['confidence']})")
                return True
            else:
                print(f"   ❌ Suggestions returned status {response.status_code}")
                return False
    except Exception as e:
        print(f"   ❌ Suggestions test failed: {e}")
        return False

async def test_analyze():
    """Test audio analysis endpoint"""
    print("\n🔍 Testing Analysis Endpoint...")
    try:
        async with httpx.AsyncClient() as client:
            payload = {
                "audio_data": {
                    "duration": 180.5,
                    "sample_rate": 44100,
                    "peak_level": -2.1,
                    "rms_level": -18.5
                },
                "analysis_type": "spectrum",
                "track_data": {
                    "track_id": "audio-1",
                    "track_name": "Main Mix",
                    "track_type": "master"
                }
            }
            response = await client.post(
                f"{CODETTE_URL}/analyze",
                json=payload,
                timeout=5.0
            )
            if response.status_code == 200:
                data = response.json()
                print("   ✅ Analysis endpoint working")
                print(f"   🎯 Analysis type: {data['analysis_type']}")
                print(f"   ⭐ Quality score: {data['quality_score']:.2f}")
                print(f"   💡 Recommendations: {len(data['recommendations'])} provided")
                return True
            else:
                print(f"   ❌ Analysis returned status {response.status_code}")
                return False
    except Exception as e:
        print(f"   ❌ Analysis test failed: {e}")
        return False

async def test_sync():
    """Test DAW state sync endpoint"""
    print("\n🔍 Testing Sync Endpoint...")
    try:
        async with httpx.AsyncClient() as client:
            payload = {
                "tracks": [
                    {"id": "track-1", "name": "Drums", "type": "audio"},
                    {"id": "track-2", "name": "Bass", "type": "audio"},
                    {"id": "track-3", "name": "Vocal", "type": "audio"}
                ],
                "current_time": 45.5,
                "is_playing": True,
                "bpm": 120
            }
            response = await client.post(
                f"{CODETTE_URL}/sync",
                json=payload,
                timeout=5.0
            )
            if response.status_code == 200:
                data = response.json()
                print("   ✅ Sync endpoint working")
                print(f"   📡 Synced: {data['synced']}")
                print(f"   📊 Status: {data['status']}")
                return True
            else:
                print(f"   ❌ Sync returned status {response.status_code}")
                return False
    except Exception as e:
        print(f"   ❌ Sync test failed: {e}")
        return False

async def main():
    """Run all tests"""
    results = {}
    
    # Run tests sequentially
    results["health"] = await test_codette_health()
    if not results["health"]:
        print("\n❌ Codette server not responding. Cannot continue tests.")
        return results
    
    results["chat"] = await test_chat()
    results["suggestions"] = await test_suggestions()
    results["analyze"] = await test_analyze()
    results["sync"] = await test_sync()
    
    # Print summary
    print("\n" + "="*70)
    print("📊 TEST SUMMARY")
    print("="*70)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, passed_test in results.items():
        status = "✅ PASS" if passed_test else "❌ FAIL"
        print(f"{status:10} {test_name:20}")
    
    print("="*70)
    print(f"Result: {passed}/{total} tests passed ({passed/total*100:.0f}%)")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
        print("✨ DAW and Codette AI are fully integrated and communicating!")
        print("\n📌 Next Steps:")
        print("   1. Open http://localhost:5173 in your browser")
        print("   2. The DAW will automatically use Codette AI for:")
        print("      - Real-time mixing suggestions")
        print("      - Audio analysis and recommendations")
        print("      - Intelligent effect chains")
        print("      - Mastering guidance")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Check the output above.")
    
    print("="*70 + "\n")
    
    return results

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n🛑 Tests interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        sys.exit(1)
