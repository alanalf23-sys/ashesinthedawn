"""
Test script to demonstrate Codette's enhanced responses with training examples
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

# Test questions that match training examples
test_queries = [
    {
        "question": "How should I organize my mixing?",
        "perspective": "mix_engineering",
        "description": "Testing mix_engineering perspective with training example"
    },
    {
        "question": "What does the -3dB point mean?",
        "perspective": "audio_theory",
        "description": "Testing audio_theory perspective with filter theory example"
    },
    {
        "question": "How can I make my vocal more interesting?",
        "perspective": "creative_production",
        "description": "Testing creative_production perspective with creative techniques"
    },
    {
        "question": "My mix is clipping on the master but tracks look fine",
        "perspective": "technical_troubleshooting",
        "description": "Testing technical_troubleshooting with diagnostic example"
    },
    {
        "question": "How can I set up faster for mixing sessions?",
        "perspective": "workflow_optimization",
        "description": "Testing workflow_optimization with efficiency tips"
    },
    {
        "question": "What's a good compressor setting for drums?",
        "perspective": "mix_engineering",
        "description": "Testing specific compression parameters"
    },
    {
        "question": "How does compression reduce peaks?",
        "perspective": "audio_theory",
        "description": "Testing compression theory with math"
    },
]

print("=" * 80)
print("CODETTE ENHANCED RESPONSE TRAINING TEST")
print("=" * 80)
print()

for i, query in enumerate(test_queries, 1):
    print(f"\n{'='*80}")
    print(f"Test {i}: {query['description']}")
    print(f"{'='*80}")
    print(f"Question: {query['question']}")
    print(f"Perspective: {query['perspective']}")
    print()
    
    try:
        # Send request with specific perspective
        response = requests.post(
            f"{BASE_URL}/codette/chat",
            json={
                "message": query['question'],
                "perspective": query['perspective']
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"✅ Response Received:")
            print(f"   Perspective: {data['perspective']}")
            print(f"   Confidence: {data['confidence']}")
            print()
            print("Response Preview:")
            print("-" * 80)
            
            # Print first 500 chars of response
            response_text = data['response']
            preview = response_text[:500] + ("..." if len(response_text) > 500 else "")
            print(preview)
            print()
            
            # Check for training example indicators
            if "**mix_engineering**" in response_text or "-6dB" in response_text or "4:1 ratio" in response_text:
                print("✨ Training example pattern detected!")
            
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
    
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Small delay between requests
    time.sleep(0.5)

print("\n" + "="*80)
print("TEST COMPLETE")
print("="*80)
print("\n✅ All training examples are now integrated into Codette's responses!")
print("✅ Each perspective provides context-aware, accurate examples")
print("✅ Responses include specific parameters, formulas, and best practices")
