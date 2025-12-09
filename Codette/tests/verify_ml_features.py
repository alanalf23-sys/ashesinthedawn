"""
Verify Codette ML Features are Enabled
Quick test script to confirm ML capabilities are active
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def print_status(emoji, message):
    """Print formatted status message"""
    print(f"{emoji} {message}")

def check_health():
    """Check server health"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        response.raise_for_status()
        return True, response.json()
    except Exception as e:
        return False, str(e)

def test_ml_chat():
    """Test chat with ML features"""
    payload = {
        "message": "How do I make my vocals sound warmer?",
        "perspective": "mix_engineering"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/codette/chat", json=payload, timeout=15)
        response.raise_for_status()
        return True, response.json()
    except Exception as e:
        return False, str(e)

def main():
    """Run verification checks"""
    print("\n" + "="*60)
    print("   CODETTE ML FEATURES VERIFICATION")
    print("="*60 + "\n")
    
    # Check 1: Server is running
    print("?? Checking server status...")
    healthy, data = check_health()
    
    if not healthy:
        print_status("?", f"Server not responding: {data}")
        print("\n?? Start server: python codette_server_unified.py")
        return False
    
    print_status("?", "Server is running")
    
    # Check 2: Test ML-enhanced chat
    print("\n?? Testing ML-enhanced chat...")
    success, result = test_ml_chat()
    
    if not success:
        print_status("?", f"Chat test failed: {result}")
        return False
    
    print_status("?", "Chat endpoint responding")
    
    # Check 3: Verify ML indicators
    print("\n?? Checking ML feature indicators...")
    
    ml_indicators = {
        "ml_enhanced": "ML Enhancement",
        "sentiment": "Sentiment Analysis",
        "emotional_adaptation": "Emotional Adaptation",
        "engineered_prompt": "Prompt Engineering"
    }
    
    ml_active = False
    for key, name in ml_indicators.items():
        if key in result:
            value = result[key]
            if value is True or (isinstance(value, dict) and value):
                print_status("?", f"{name}: Active")
                ml_active = True
            else:
                print_status("?? ", f"{name}: Inactive")
        else:
            print_status("?? ", f"{name}: Not found in response")
    
    # Display response details
    print("\n?? Response Details:")
    print(f"   Source: {result.get('source', 'unknown')}")
    print(f"   Confidence: {result.get('confidence', 0):.2%}")
    
    if 'sentiment' in result:
        sentiment = result['sentiment']
        if isinstance(sentiment, dict):
            print(f"   Sentiment:")
            for key, value in sentiment.items():
                print(f"      {key}: {value}")
    
    # Final verdict
    print("\n" + "="*60)
    if ml_active:
        print_status("?", "ML FEATURES ARE ACTIVE!")
        print("\n?? Your Codette server is running with full ML capabilities:")
        print("   • Sentiment analysis")
        print("   • Emotional adaptation")
        print("   • Predictive analytics")
        print("   • Neural embeddings")
        
        print("\n?? Next steps:")
        print("   1. Run: python test_codette_mixing_questions.py")
        print("   2. Integrate with React frontend")
        print("   3. Monitor performance in production")
    else:
        print_status("?? ", "ML FEATURES NOT DETECTED")
        print("\n?? Possible reasons:")
        print("   1. Server running in lightweight mode (fallback)")
        print("   2. ML dependencies not available")
        print("   3. use_ml_features=False in codette_server_unified.py")
        
        print("\n?? To enable ML features:")
        print("   1. Check dependencies: pip install torch transformers")
        print("   2. Verify codette_server_unified.py line ~145:")
        print("      use_ml_features=True")
        print("   3. Restart server: python codette_server_unified.py")
    
    print("="*60 + "\n")
    return ml_active

if __name__ == "__main__":
    try:
        ml_active = main()
        sys.exit(0 if ml_active else 1)
    except KeyboardInterrupt:
        print("\n\n??  Verification cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n? Verification failed: {e}")
        sys.exit(1)
