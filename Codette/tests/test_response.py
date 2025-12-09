import requests
import json

r = requests.post('http://localhost:8000/codette/chat', json={'message':'test'})
data = r.json()
print(f"Perspective: {data.get('perspective')}")
print(f"Confidence: {data.get('confidence')}")
print(f"First 100 chars of response:\n{data.get('response')[:100]}")
