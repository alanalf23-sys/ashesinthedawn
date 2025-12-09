#!/usr/bin/env python3
"""
Test RPC function calls from the Codette backend
Tests both anon and authenticated access to verify permissions
"""

import os
import json
import sys
from dotenv import load_dotenv

load_dotenv()

# Get credentials
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

print("=" * 80)
print("RPC FUNCTION PERMISSION TEST SUITE")
print("=" * 80)
print(f"\nURL: {SUPABASE_URL[:50]}...")
print(f"Anon Key: {'✓' if SUPABASE_ANON_KEY else '✗'}")
print(f"Service Role Key: {'✓' if SUPABASE_SERVICE_ROLE_KEY else '✗'}")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    print("\n❌ Missing credentials!")
    sys.exit(1)

try:
    import supabase
except ImportError:
    print("\n⚠️ Installing supabase...")
    import subprocess
    subprocess.run([sys.executable, "-m", "pip", "install", "supabase"], check=True)
    import supabase

# Test counters
tests_passed = 0
tests_failed = 0

def test_rpc(client_type, client, function_name, params, expected_return_type=None):
    """Test a single RPC call"""
    global tests_passed, tests_failed
    
    print(f"\n{'─' * 80}")
    print(f"TEST: {function_name}")
    print(f"Client: {client_type}")
    print(f"Parameters: {json.dumps(params, indent=2)}")
    
    try:
        response = client.rpc(function_name, params).execute()
        
        if response and response.data is not None:
            print(f"✅ SUCCESS - Got response (type: {type(response.data).__name__})")
            
            # Display data sample
            if isinstance(response.data, list) and response.data:
                print(f"   Rows returned: {len(response.data)}")
                print(f"   First row (sample):")
                first_row = response.data[0]
                for key in list(first_row.keys())[:5]:  # Show first 5 fields
                    value = first_row[key]
                    if isinstance(value, str) and len(value) > 100:
                        print(f"     {key}: {value[:100]}...")
                    else:
                        print(f"     {key}: {value}")
            elif isinstance(response.data, dict):
                print(f"   Response (sample):")
                for key in list(response.data.keys())[:5]:
                    value = response.data[key]
                    if isinstance(value, str) and len(value) > 100:
                        print(f"     {key}: {value[:100]}...")
                    else:
                        print(f"     {key}: {value}")
            
            tests_passed += 1
            return True
        else:
            print(f"⚠️ WARNING - Got empty response")
            tests_passed += 1
            return True
            
    except Exception as e:
        error_msg = str(e)
        print(f"❌ FAILED - {type(e).__name__}")
        print(f"   Message: {error_msg[:200]}")
        
        # Analyze error
        if "permission denied" in error_msg.lower():
            print(f"   → Permission denied! Function lacks EXECUTE grant for this role")
        elif "does not exist" in error_msg.lower():
            print(f"   → Function does not exist in Supabase")
        elif "timeout" in error_msg.lower():
            print(f"   → Connection timeout")
        elif "unauthorized" in error_msg.lower():
            print(f"   → Authentication failed")
        
        tests_failed += 1
        return False

print("\n" + "=" * 80)
print("PART 1: ANON ROLE (Using VITE_SUPABASE_ANON_KEY)")
print("=" * 80)

try:
    anon_client = supabase.create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    print("✅ Anon client created")
    
    # Test 1.1: get_music_suggestions(text, text) - Suggestions endpoint
    test_rpc(
        "ANON",
        anon_client,
        "get_music_suggestions",
        {
            "p_prompt": "mixing",
            "p_context": "mixing"
        }
    )
    
    # Test 1.2: get_music_suggestions(text, integer) - Chat semantic search
    test_rpc(
        "ANON",
        anon_client,
        "get_music_suggestions",
        {
            "query": "reverb",
            "limit_count": 3
        }
    )
    
    # Test 1.3: get_codette_context(text, text) - Context retrieval
    test_rpc(
        "ANON",
        anon_client,
        "get_codette_context",
        {
            "input_prompt": "how do I use reverb",
            "optionally_filename": None
        }
    )
    
except Exception as e:
    print(f"❌ Failed to create anon client: {e}")
    tests_failed += 3

if SUPABASE_SERVICE_ROLE_KEY:
    print("\n" + "=" * 80)
    print("PART 2: SERVICE ROLE (Using SUPABASE_SERVICE_ROLE_KEY)")
    print("=" * 80)
    print("Note: Service role has elevated permissions and should always work")
    
    try:
        service_client = supabase.create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        print("✅ Service role client created")
        
        # Test 2.1: get_music_suggestions(text, text)
        test_rpc(
            "SERVICE_ROLE",
            service_client,
            "get_music_suggestions",
            {
                "p_prompt": "mastering",
                "p_context": "mastering"
            }
        )
        
        # Test 2.2: get_music_suggestions(text, integer)
        test_rpc(
            "SERVICE_ROLE",
            service_client,
            "get_music_suggestions",
            {
                "query": "eq",
                "limit_count": 5
            }
        )
        
        # Test 2.3: get_codette_context(text, text)
        test_rpc(
            "SERVICE_ROLE",
            service_client,
            "get_codette_context",
            {
                "input_prompt": "eq settings",
                "optionally_filename": None
            }
        )
        
    except Exception as e:
        print(f"❌ Failed to create service role client: {e}")
        tests_failed += 3
else:
    print("\n⚠️ SERVICE_ROLE_KEY not configured - skipping service role tests")

# Summary
print("\n" + "=" * 80)
print("TEST SUMMARY")
print("=" * 80)
print(f"Passed: {tests_passed}")
print(f"Failed: {tests_failed}")
print(f"Total:  {tests_passed + tests_failed}")

if tests_failed == 0:
    print("\n✅ ALL TESTS PASSED - RPC functions are working!")
    print("   Anon role can execute get_music_suggestions and get_codette_context")
    print("   Your backend will be able to use database suggestions ✓")
    sys.exit(0)
elif tests_passed > 0:
    print("\n⚠️ PARTIAL SUCCESS")
    print(f"   {tests_passed} tests passed, {tests_failed} tests failed")
    print("   Some functions may not have proper permissions")
    sys.exit(1)
else:
    print("\n❌ ALL TESTS FAILED")
    print("   RPC functions do not exist or permissions are not set")
    print("   Run the migration SQL in Supabase to fix this")
    sys.exit(1)
