#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Endpoint Tester - Identifies invalid HTTP requests
Tests all endpoints in codette_server_unified.py
"""

import requests
import json
import time
from typing import Dict, List, Any

BASE_URL = "http://localhost:8000"

# Simple text markers (no special characters)
def green(text):
    return f"\033[92m{text}\033[0m"

def red(text):
    return f"\033[91m{text}\033[0m"

def yellow(text):
    return f"\033[93m{text}\033[0m"

def test_endpoint(method: str, path: str, data: Dict = None, params: Dict = None) -> Dict[str, Any]:
    """Test a single endpoint"""
    url = f"{BASE_URL}{path}"
    
    try:
        if method == "GET":
            response = requests.get(url, params=params, timeout=5)
        elif method == "POST":
            response = requests.post(url, json=data, params=params, timeout=5)
        elif method == "PUT":
            response = requests.put(url, json=data, params=params, timeout=5)
        elif method == "DELETE":
            response = requests.delete(url, timeout=5)
        else:
            return {"error": f"Unknown method: {method}"}
        
        return {
            "status": response.status_code,
            "success": 200 <= response.status_code < 300,
            "response": response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text[:200]
        }
    except requests.exceptions.Timeout:
        return {"error": "Timeout"}
    except requests.exceptions.ConnectionError:
        return {"error": "Connection refused - is server running?"}
    except Exception as e:
        return {"error": str(e)}

def main():
    print("="*70)
    print("CODETTE SERVER ENDPOINT TESTER")
    print("="*70)
    print(f"\nTesting server at: {BASE_URL}")
    print("Checking for invalid HTTP requests...")
    print("="*70)
    
    # Test cases organized by category
    test_cases = [
        # Basic health checks
        ("GET", "/", None, None, "Root endpoint"),
        ("GET", "/health", None, None, "Health check"),
        ("GET", "/api/health", None, None, "API health"),
        ("GET", "/api/health/detailed", None, None, "Detailed health"),
        
        # Chat endpoints
        ("POST", "/codette/chat", {"message": "Hello"}, None, "Chat (minimal)"),
        ("POST", "/codette/chat", {"message": "Hello", "perspective": "mix_engineering"}, None, "Chat (with perspective)"),
        ("POST", "/api/codette/chat", {"message": "Hello"}, None, "API Chat"),
        
        # Status endpoints
        ("GET", "/codette/status", None, None, "Codette status"),
        ("GET", "/api/codette/status", None, None, "API Codette status"),
        ("GET", "/metrics", None, None, "Metrics"),
        
        # Suggestions
        ("POST", "/codette/suggest", {"context": {"type": "mixing"}, "limit": 5}, None, "Suggestions"),
        ("POST", "/api/codette/suggest", {"context": {"type": "mixing"}}, None, "API Suggestions"),
        
        # Transport control
        ("POST", "/transport/play", None, None, "Transport play"),
        ("POST", "/transport/stop", None, None, "Transport stop"),
        ("POST", "/transport/pause", None, None, "Transport pause"),
        ("GET", "/transport/status", None, None, "Transport status"),
        
        # Analysis endpoints
        ("GET", "/api/analysis/delay-sync", None, {"bpm": 120}, "Delay sync"),
        ("POST", "/api/analysis/detect-genre", {"bpm": 128, "tracks": []}, None, "Genre detection"),
        
        # Common error cases
        ("POST", "/codette/chat", None, None, "Chat (missing body)"),
        ("POST", "/codette/chat", {}, None, "Chat (empty body)"),
        ("GET", "/codette/chat", None, None, "Chat (wrong method)"),
        ("POST", "/codette/nonexistent", {}, None, "Nonexistent endpoint"),
    ]
    
    results = {
        "passed": [],
        "failed": [],
        "errors": []
    }
    
    for method, path, data, params, description in test_cases:
        print(f"\n[{method}] {path}")
        print(f"    Description: {description}")
        
        result = test_endpoint(method, path, data, params)
        
        if "error" in result:
            print(f"    X ERROR: {result['error']}")
            results["errors"].append({
                "method": method,
                "path": path,
                "description": description,
                "error": result["error"]
            })
        elif result["success"]:
            print(green(f"    OK {result['status']} - SUCCESS"))
            results["passed"].append({
                "method": method,
                "path": path,
                "description": description,
                "status": result["status"]
            })
        else:
            print(yellow(f"    WARN {result['status']} - FAILED"))
            if isinstance(result.get("response"), dict):
                print(f"    Response: {json.dumps(result['response'], indent=2)[:200]}")
            results["failed"].append({
                "method": method,
                "path": path,
                "description": description,
                "status": result["status"],
                "response": result.get("response")
            })
        
        time.sleep(0.1)  # Rate limiting
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    print(green(f"Passed: {len(results['passed'])}"))
    print(yellow(f"Failed: {len(results['failed'])}"))
    print(red(f"Errors: {len(results['errors'])}"))
    
    if results["failed"]:
        print(f"\nFAILED TESTS:")
        for test in results["failed"]:
            print(f"  - [{test['method']}] {test['path']} - {test['status']}")
            print(f"    {test['description']}")
    
    if results["errors"]:
        print(f"\nERROR TESTS:")
        for test in results["errors"]:
            print(f"  - [{test['method']}] {test['path']}")
            print(f"    {test['error']}")
    
    # Check for common invalid request patterns
    print("\n" + "="*70)
    print("INVALID REQUEST ANALYSIS")
    print("="*70)
    
    validation_errors = [t for t in results["failed"] if t["status"] == 422]
    not_found_errors = [t for t in results["failed"] if t["status"] == 404]
    method_errors = [t for t in results["failed"] if t["status"] == 405]
    
    if validation_errors:
        print(f"\nWARN Validation Errors (422): {len(validation_errors)}")
        print("These indicate missing or invalid request data:")
        for t in validation_errors:
            print(f"  - {t['path']} - {t['description']}")
    
    if not_found_errors:
        print(f"\nWARN Not Found Errors (404): {len(not_found_errors)}")
        print("These endpoints don't exist:")
        for t in not_found_errors:
            print(f"  - {t['path']}")
    
    if method_errors:
        print(f"\nWARN Method Not Allowed (405): {len(method_errors)}")
        print("These are using the wrong HTTP method:")
        for t in method_errors:
            print(f"  - [{t['method']}] {t['path']}")
    
    print("\n" + "="*70)
    print("RECOMMENDATIONS")
    print("="*70)
    
    if len(results["errors"]) > 0:
        print(red("X Server is not responding - check if it's running"))
        print(f"  Run: python codette_server_unified.py")
    elif len(results["failed"]) == 0:
        print(green("OK All endpoints working correctly!"))
    else:
        print(yellow("WARN Some endpoints need attention:"))
        if validation_errors:
            print("  1. Fix validation errors by providing required fields")
        if not_found_errors:
            print("  2. Remove calls to nonexistent endpoints from frontend")
        if method_errors:
            print("  3. Fix HTTP methods (GET vs POST)")
    
    # Get recent errors from server
    print("\n" + "="*70)
    print("RECENT SERVER ERRORS")
    print("="*70)
    try:
        response = requests.get(f"{BASE_URL}/api/debug/recent-requests", timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get("recent_errors"):
                print(f"\nLast {len(data['recent_errors'])} errors from server:")
                for err in data["recent_errors"]:
                    print(f"  - [{err['method']}] {err['path']} - {err['status']} at {err['timestamp']}")
            else:
                print(green("OK No recent errors recorded"))
    except Exception:
        print("Could not fetch recent errors from server")
    
    print("\n" + "="*70)

if __name__ == "__main__":
    main()
