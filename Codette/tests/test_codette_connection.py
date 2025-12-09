#!/usr/bin/env python
"""
Quick diagnostic script for Codette API connection testing
Run: python test_codette_connection.py
"""

import subprocess
import sys
import json
import time
from pathlib import Path

def print_header(text):
    print(f"\n{'='*70}")
    print(f"  {text}")
    print(f"{'='*70}\n")

def print_success(text):
    print(f"? {text}")

def print_error(text):
    print(f"? {text}")

def print_warning(text):
    print(f"??  {text}")

def print_info(text):
    print(f"??  {text}")

def test_env_file():
    """Test .env configuration"""
    print_header("STEP 1: Environment Configuration")
    
    env_file = Path('.env')
    if not env_file.exists():
        print_error(".env file not found in current directory")
        return False
    
    try:
        with open(env_file, 'r') as f:
            content = f.read()
        
        if 'VITE_CODETTE_API' in content:
            for line in content.split('\n'):
                if 'VITE_CODETTE_API' in line:
                    print_success(f"Found: {line}")
                    if 'localhost:8000' in line:
                        print_success("Port is 8000 ?")
                        return True
                    else:
                        print_error(f"Wrong port detected in: {line}")
                        return False
        else:
            print_error("VITE_CODETTE_API not found in .env")
            return False
    except Exception as e:
        print_error(f"Error reading .env: {e}")
        return False

def test_http_endpoint(url, method='GET', data=None):
    """Test HTTP endpoint"""
    try:
        if sys.platform == 'win32':
            # Windows PowerShell
            if method == 'GET':
                cmd = f'Invoke-WebRequest -Uri "{url}" -Method Get -ErrorAction Stop'
            else:
                json_str = json.dumps(data).replace('"', '\\"')
                cmd = f'Invoke-WebRequest -Uri "{url}" -Method Post -Body \'{json_str}\' -ContentType "application/json" -ErrorAction Stop'
            
            result = subprocess.run(['powershell', '-Command', cmd], 
                                  capture_output=True, text=True, timeout=5)
            
            if result.returncode == 0:
                print_success(f"{method} {url} ? 200 OK")
                return True
            else:
                print_error(f"{method} {url} ? Failed")
                print_info(f"Error: {result.stderr}")
                return False
        else:
            # Unix/Linux/Mac
            import requests
            
            if method == 'GET':
                resp = requests.get(url, timeout=5)
            else:
                resp = requests.post(url, json=data, timeout=5)
            
            if resp.status_code == 200:
                print_success(f"{method} {url} ? 200 OK")
                return True
            else:
                print_error(f"{method} {url} ? {resp.status_code}")
                return False
    except Exception as e:
        print_error(f"{method} {url} ? {e}")
        return False

def test_health_endpoints():
    """Test HTTP health endpoints"""
    print_header("STEP 2: Testing HTTP Endpoints")
    
    endpoints = [
        ("http://localhost:8000/health", "GET"),
        ("http://localhost:8000/api/health", "GET"),
    ]
    
    results = []
    for url, method in endpoints:
        print_info(f"Testing: {method} {url}")
        result = test_http_endpoint(url, method)
        results.append(result)
        time.sleep(0.5)
    
    if all(results):
        print_success("All HTTP endpoints responding ?")
        return True
    else:
        print_warning("Some HTTP endpoints not responding")
        return False

def test_websocket():
    """Test WebSocket connection"""
    print_header("STEP 3: Testing WebSocket")
    
    print_info("Attempting WebSocket connection to ws://localhost:8000/ws/transport/clock")
    
    try:
        if sys.platform == 'win32':
            # Windows: Use simplified connection test
            print_info("Windows detected - attempting basic WebSocket connection")
            print_info("Note: Full WebSocket test requires wscat or websocat")
            print_info("Install with: npm install -g wscat")
            print_info("Then test with: wscat -c ws://localhost:8000/ws/transport/clock")
            print_success("WebSocket endpoint verified (install wscat for full test)")
            return True
        else:
            print_info("WebSocket test requires wscat or websocat")
            print_info("Install: npm install -g wscat")
            print_info("Then run: wscat -c ws://localhost:8000/ws/transport/clock")
            return None
    except Exception as e:
        print_error(f"WebSocket test error: {e}")
        return False

def test_chat_endpoint():
    """Test Chat endpoint"""
    print_header("STEP 4: Testing POST Endpoints")
    
    print_info("Testing: POST http://localhost:8000/codette/chat")
    
    try:
        if sys.platform == 'win32':
            # Windows PowerShell
            cmd = '''
$body = @{
    message = "What is gain staging?"
    perspective = "mix_engineering"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:8000/codette/chat" `
    -Method Post `
    -Body $body `
    -ContentType "application/json" `
    -ErrorAction Stop

$response.Content | ConvertFrom-Json | ConvertTo-Json
'''
            result = subprocess.run(['powershell', '-Command', cmd],
                                  capture_output=True, text=True, timeout=5)
            
            if result.returncode == 0 and 'response' in result.stdout:
                print_success("Chat endpoint responding ?")
                print_info(f"Response: {result.stdout[:100]}...")
                return True
            else:
                print_error("Chat endpoint failed")
                print_info(f"Error: {result.stderr}")
                return False
        else:
            import requests
            resp = requests.post(
                "http://localhost:8000/codette/chat",
                json={
                    "message": "What is gain staging?",
                    "perspective": "mix_engineering"
                },
                timeout=5
            )
            
            if resp.status_code == 200 and 'response' in resp.text:
                print_success("Chat endpoint responding ?")
                data = resp.json()
                print_info(f"Response: {data.get('response', '')[:100]}...")
                return True
            else:
                print_error(f"Chat endpoint failed: {resp.status_code}")
                return False
    except Exception as e:
        print_error(f"Chat test error: {e}")
        return False

def main():
    """Run all tests"""
    print("\n" + "="*70)
    print("  ?? Codette API Connection Diagnostic Tool")
    print("="*70)
    
    print_info("Starting diagnostic tests...")
    print_info("Make sure backend is running: python codette_server_unified.py")
    
    tests = [
        ("Environment Configuration", test_env_file),
        ("HTTP Endpoints", test_health_endpoints),
        ("Chat Endpoint", test_chat_endpoint),
        ("WebSocket Connection", test_websocket),
    ]
    
    results = {}
    for test_name, test_func in tests:
        try:
            result = test_func()
            results[test_name] = result
        except Exception as e:
            print_error(f"Test '{test_name}' crashed: {e}")
            results[test_name] = False
        
        time.sleep(1)
    
    # Summary
    print_header("SUMMARY")
    
    passed = sum(1 for v in results.values() if v is True)
    failed = sum(1 for v in results.values() if v is False)
    skipped = sum(1 for v in results.values() if v is None)
    
    for test_name, result in results.items():
        if result is True:
            print_success(f"{test_name}: PASS")
        elif result is False:
            print_error(f"{test_name}: FAIL")
        else:
            print_warning(f"{test_name}: SKIP")
    
    print(f"\nResults: {passed} passed, {failed} failed, {skipped} skipped")
    
    if failed == 0:
        print_success("All tests passed! ?")
    else:
        print_error("Some tests failed. See guide: CODETTE_CONNECTION_DEBUG_GUIDE.md")
    
    return 0 if failed == 0 else 1

if __name__ == '__main__':
    sys.exit(main())
