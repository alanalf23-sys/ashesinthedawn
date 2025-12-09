#!/usr/bin/env python
"""Quick endpoint verification script"""

import requests
import json

BASE_URL = "http://localhost:8000"

ENDPOINTS = {
    "GET /codette/status": ("GET", "/codette/status", {}),
    "GET /codette/chat": ("GET", "/codette/chat", {}),
    "POST /codette/suggest": ("POST", "/codette/suggest", {"context": {"type": "mixing"}, "limit": 5}),
    "GET /api/analysis/delay-sync": ("GET", "/api/analysis/delay-sync", {}),
    "GET /metrics": ("GET", "/metrics", {}),
    "GET /api/analysis/instruments-list": ("GET", "/api/analysis/instruments-list", {}),
    "POST /transport/solo/test-track": ("POST", "/transport/solo/test-track", {"solo": True}),
    "GET /api/analysis/ear-training": ("GET", "/api/analysis/ear-training", {}),
    "POST /api/analyze/session": ("POST", "/api/analyze/session", {}),
}

print("\n" + "="*60)
print("? ENDPOINT VERIFICATION TEST")
print("="*60)

passed = 0
failed = 0

for name, (method, path, data) in ENDPOINTS.items():
    try:
        url = BASE_URL + path
        if method == "GET":
            r = requests.get(url, timeout=2)
        else:
            r = requests.post(url, json=data, timeout=2)
        
        if r.status_code == 200:
            status = "? 200 OK"
            passed += 1
        else:
            status = f"? {r.status_code}"
            failed += 1
        
        print(f"{name:<40} {status}")
    except Exception as e:
        print(f"{name:<40} ? ERROR: {str(e)[:30]}")
        failed += 1

print("="*60)
print(f"RESULTS: {passed} passed, {failed} failed")
print("="*60 + "\n")
