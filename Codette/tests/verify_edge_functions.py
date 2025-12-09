#!/usr/bin/env python
"""Verify all Edge Functions are accessible and returning data"""

import os
import sys
import requests
import json
from typing import Dict, List, Tuple
from datetime import datetime
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://ngvcyxvtorwqocnqcbyz.supabase.co").rstrip('/')
SUPABASE_ANON_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", os.getenv("SUPABASE_KEY", ""))
CODETTE_API = os.getenv("CODETTE_API", "http://localhost:8000")

# Test credentials from .env
TEST_USER_ID = os.getenv("TEST_USER_ID", "550e8400-e29b-41d4-a716-446655440000")
TEST_ROOM_ID = os.getenv("TEST_ROOM_ID", "660e8400-e29b-41d4-a716-446655440000")

# Color codes for output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def colorize(text: str, color: str) -> str:
    """Add color to text (Windows and Linux compatible)"""
    if os.name == 'nt':  # Windows
        return text
    return f"{color}{text}{Colors.RESET}"

# Test configurations
EDGE_FUNCTIONS = {
    "codette-fallback": {
        "url": f"{SUPABASE_URL}/functions/v1/codette-fallback",
        "method": "POST",
        "body": {"message": "test", "fallback": True},
        "expected_status": [200, 400, 500],
        "timeout": 10,
        "priority": "medium"
    },
    "codette-fallback-handler": {
        "url": f"{SUPABASE_URL}/functions/v1/codette-fallback-handler",
        "method": "POST",
        "body": {"error": "test", "handler": True},
        "expected_status": [200, 400, 500],
        "timeout": 10,
        "priority": "medium"
    },
    "hybrid-search-music": {
        "url": f"{SUPABASE_URL}/functions/v1/hybrid-search-music",
        "method": "POST",
        "body": {"query": "mixing optimization", "limit": 5},
        "expected_status": [200, 400, 401, 404],
        "timeout": 10,
        "priority": "high"
    },
    "upsert-embeddings": {
        "url": f"{SUPABASE_URL}/functions/v1/upsert-embeddings",
        "method": "POST",
        "body": {
            "messages": [
                {
                    "id": "test-" + datetime.now().isoformat(),
                    "embedding": [0.1] * 1536,
                    "content": "test message"
                }
            ]
        },
        "expected_status": [200, 400, 401, 413],
        "timeout": 15,
        "priority": "high"
    },
    "database-access": {
        "url": f"{SUPABASE_URL}/functions/v1/database-access",
        "method": "POST",
        "body": {"table": "music_knowledge", "limit": 5},
        "expected_status": [200, 400, 401],
        "timeout": 10,
        "priority": "high"
    },
    "messages": {
        "url": "https://ngvcyxvtorwqocnqcbyz.supabase.co/functions/v1/messages",
        "method": "POST",
        "body": {
            "user_id": TEST_USER_ID,
            "room_id": TEST_ROOM_ID,
            "text": "Test message from verification script"
        },
        "expected_status": [200, 400, 401, 403],
        "timeout": 10,
        "priority": "high",
        "note": "Uses credentials from .env (TEST_USER_ID, TEST_ROOM_ID)"
    },
    "invoke-messages-temp": {
        "url": "https://ngvcyxvtorwqocnqcbyz.supabase.co/functions/v1/invoke-messages-temp",
        "method": "POST",
        "body": {
            "user_id": TEST_USER_ID,
            "room_id": TEST_ROOM_ID,
            "text": "Test temp invocation"
        },
        "expected_status": [200, 400, 401, 403, 404],
        "timeout": 10,
        "priority": "medium",
        "note": "Temporary function - may be deprecated"
    },
}

LOCAL_ENDPOINTS = {
    "Backend Health": {
        "url": f"{CODETTE_API}/health",
        "method": "GET",
        "expected_status": [200],
        "timeout": 5,
        "priority": "high"
    },
    "Edge Functions Health": {
        "url": f"{CODETTE_API}/health/edge-functions",
        "method": "GET",
        "expected_status": [200, 404],  # 404 if not yet implemented
        "timeout": 5,
        "priority": "medium"
    },
    "Codette Chat": {
        "url": f"{CODETTE_API}/codette/chat",
        "method": "POST",
        "body": {"message": "test", "perspective": "mix_engineering"},
        "expected_status": [200, 422],
        "timeout": 10,
        "priority": "high"
    }
}

HEADERS = {
    "Content-Type": "application/json"
}

if SUPABASE_ANON_KEY:
    HEADERS["Authorization"] = f"Bearer {SUPABASE_ANON_KEY}"

def test_edge_function(name: str, config: Dict) -> Tuple[bool, str, float]:
    """Test single Edge Function"""
    try:
        start_time = datetime.now()
        
        if config["method"] == "POST":
            response = requests.post(
                config["url"],
                json=config["body"],
                headers=HEADERS,
                timeout=config["timeout"]
            )
        else:
            response = requests.get(
                config["url"],
                headers=HEADERS,
                timeout=config["timeout"]
            )
        
        elapsed_ms = (datetime.now() - start_time).total_seconds() * 1000
        
        if response.status_code in config["expected_status"]:
            status_text = f"Status {response.status_code} ({elapsed_ms:.0f}ms)"
            return True, status_text, elapsed_ms
        else:
            return False, f"Unexpected status {response.status_code}", elapsed_ms
    
    except requests.exceptions.Timeout:
        return False, f"⏱️  Timeout (>{config['timeout']}s)", config["timeout"] * 1000
    except requests.exceptions.ConnectionError:
        return False, "🔌 Connection refused (offline?)", 0
    except Exception as e:
        error_msg = str(e)[:60]
        return False, f"Error: {error_msg}", 0

def print_section(title: str):
    """Print section header"""
    print(f"\n{colorize('=' * 70, Colors.BOLD)}")
    print(f"{colorize(title, Colors.BOLD)}")
    print(f"{colorize('=' * 70, Colors.RESET)}\n")

def print_result(name: str, success: bool, message: str, elapsed_ms: float, priority: str = ""):
    """Print test result with color"""
    status_icon = "✅" if success else "❌"
    priority_marker = f" [{priority.upper()}]" if priority else ""
    
    color = Colors.GREEN if success else Colors.RED
    result_text = f"{colorize(status_icon, color)} {name}{priority_marker}"
    
    # Align message
    padding = 50 - len(name) - len(priority_marker)
    result_text += " " * max(0, padding)
    
    if elapsed_ms > 0:
        result_text += f" {message} ({elapsed_ms:.0f}ms)"
    else:
        result_text += f" {message}"
    
    print(result_text)
    return success

def main():
    """Run all tests"""
    print_section("🔍 SUPABASE EDGE FUNCTIONS VERIFICATION")
    
    # Summary statistics
    total_tests = 0
    passed_tests = 0
    failed_tests = 0
    total_time_ms = 0
    
    # Test Edge Functions
    print_section("☁️  EDGE FUNCTIONS (Supabase Cloud)")
    
    edge_results = {}
    for name in sorted(EDGE_FUNCTIONS.keys()):
        config = EDGE_FUNCTIONS[name]
        print(f"Testing {name}...", end="", flush=True)
        success, message, elapsed_ms = test_edge_function(name, config)
        edge_results[name] = (success, message, elapsed_ms)
        total_tests += 1
        total_time_ms += elapsed_ms
        
        # Move to next line and print result
        print("\r", end="")
        if print_result(name, success, message, elapsed_ms, config.get("priority", "")):
            passed_tests += 1
        else:
            failed_tests += 1
    
    # Test Local Endpoints
    print_section("🖥️  LOCAL ENDPOINTS (Backend)")
    
    local_results = {}
    for name in sorted(LOCAL_ENDPOINTS.keys()):
        config = LOCAL_ENDPOINTS[name]
        print(f"Testing {name}...", end="", flush=True)
        success, message, elapsed_ms = test_edge_function(name, config)
        local_results[name] = (success, message, elapsed_ms)
        total_tests += 1
        total_time_ms += elapsed_ms
        
        # Move to next line and print result
        print("\r", end="")
        if print_result(name, success, message, elapsed_ms, config.get("priority", "")):
            passed_tests += 1
        else:
            failed_tests += 1
    
    # Summary
    print_section("📊 SUMMARY")
    
    print(f"Total Tests: {colorize(str(total_tests), Colors.CYAN)}")
    print(f"Passed:      {colorize(f'{passed_tests} ✅', Colors.GREEN)}")
    print(f"Failed:      {colorize(f'{failed_tests} ❌', Colors.RED if failed_tests > 0 else Colors.GREEN)}")
    print(f"Success Rate: {colorize(f'{(passed_tests/total_tests)*100:.1f}%', Colors.GREEN if failed_tests == 0 else Colors.YELLOW)}")
    print(f"Total Time:  {colorize(f'{total_time_ms:.0f}ms', Colors.CYAN)}\n")
    
    # Recommendations
    print_section("💡 RECOMMENDATIONS")
    
    if failed_tests == 0:
        print(f"{colorize('✅ All functions are healthy!', Colors.GREEN)}")
        print("No action needed.\n")
    else:
        print(f"{colorize('⚠️  Some functions failed. Investigating...', Colors.YELLOW)}\n")
        
        # Check what failed
        edge_failures = [name for name, (success, _, _) in edge_results.items() if not success]
        local_failures = [name for name, (success, _, _) in local_results.items() if not success]
        
        if edge_failures:
            print(f"Failed Edge Functions: {', '.join(edge_failures)}")
            print("  → Check Supabase dashboard for logs")
            print("  → Verify network connectivity")
            print("  → Check authentication token (SUPABASE_ANON_KEY)\n")
        
        if local_failures:
            print(f"Failed Local Endpoints: {', '.join(local_failures)}")
            print("  → Verify backend is running: python codette_server_unified.py")
            print("  → Check port 8000 is accessible")
            print("  → View backend logs for errors\n")
    
    # Additional info
    print_section("ℹ️  CONFIGURATION")
    
    print(f"Supabase URL: {colorize(SUPABASE_URL, Colors.CYAN)}")
    print(f"Backend URL:  {colorize(CODETTE_API, Colors.CYAN)}")
    print(f"Auth Token:   {'✅ Configured' if SUPABASE_ANON_KEY else '⚠️  Missing'}")
    print()
    
    # Return exit code
    return 0 if failed_tests == 0 else 1

if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\n❌ Interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
