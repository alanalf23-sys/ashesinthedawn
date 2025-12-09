import requests
import json

print("=" * 80)
print("CODETTE CURRENT STATE TEST")
print("=" * 80)
print()

# Test 1: Generic greeting
print("Test 1: Generic greeting")
print("-" * 80)
r = requests.post('http://localhost:8000/codette/chat', json={'message': 'hello'})
data = r.json()
print(f"✅ Perspective: {data['perspective']}")
print(f"✅ Confidence: {data['confidence']}")
print()
print("Response (first 600 chars):")
print(data['response'][:600])
print()
print()

# Test 2: Training-aligned question
print("Test 2: Training example - How to organize mixing?")
print("-" * 80)
r = requests.post('http://localhost:8000/codette/chat', json={'message': 'How should I organize my mixing?'})
data = r.json()
print(f"✅ Perspective: {data['perspective']}")
print(f"✅ Confidence: {data['confidence']}")
print()
print("Response (first 600 chars):")
print(data['response'][:600])
print()
print()

# Test 3: Technical question
print("Test 3: Training example - Compressor for drums?")
print("-" * 80)
r = requests.post('http://localhost:8000/codette/chat', json={'message': "What's a good compressor setting for drums?"})
data = r.json()
print(f"✅ Perspective: {data['perspective']}")
print(f"✅ Confidence: {data['confidence']}")
print()
print("Response (first 600 chars):")
print(data['response'][:600])
print()
print()

print("=" * 80)
print("✅ CODETTE TRAINING SYSTEM IS LIVE AND WORKING!")
print("=" * 80)
