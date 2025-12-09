#!/usr/bin/env python
"""
Diagnostic script to test Supabase connection and RPC functions
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
env_file = Path(__file__).parent / '.env'
if env_file.exists():
    load_dotenv(env_file)

try:
    import supabase
    print("✅ Supabase SDK imported successfully")
except ImportError:
    print("❌ Supabase SDK not installed")
    sys.exit(1)

# Get credentials
supabase_url = os.getenv('VITE_SUPABASE_URL')
supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY')

print(f"\n📋 Configuration Check:")
print(f"  URL: {supabase_url}")
print(f"  Key present: {'✅' if supabase_key else '❌'}")

if not supabase_url or not supabase_key:
    print("❌ Missing Supabase credentials")
    sys.exit(1)

# Try to connect
try:
    client = supabase.create_client(supabase_url, supabase_key)
    print("✅ Supabase client created successfully")
except Exception as e:
    print(f"❌ Failed to create client: {e}")
    sys.exit(1)

# Test 1: Check if music_knowledge table exists
print("\n📊 Table Check:")
try:
    response = client.from_('music_knowledge').select('COUNT', count='exact').execute()
    print(f"✅ music_knowledge table exists ({response.count} rows)")
except Exception as e:
    print(f"❌ Failed to query music_knowledge table: {e}")

# Test 2: Try to call RPC function
print("\n🔧 RPC Function Check:")
try:
    response = client.rpc(
        'get_music_suggestions',
        {
            'p_prompt': 'mixing',
            'p_context': 'mixing'
        }
    ).execute()
    
    if response and hasattr(response, 'data') and response.data:
        print(f"✅ RPC function executed successfully")
        print(f"   Response type: {type(response.data)}")
        
        if isinstance(response.data, dict) and 'suggestions' in response.data:
            suggestions = response.data['suggestions']
            print(f"   Suggestions count: {len(suggestions) if isinstance(suggestions, list) else 'N/A'}")
            if isinstance(suggestions, list) and len(suggestions) > 0:
                print(f"   First suggestion: {suggestions[0].get('title', 'N/A')}")
        else:
            print(f"   Data structure: {response.data}")
    else:
        print(f"❌ RPC returned empty response: {response}")
except Exception as e:
    print(f"❌ RPC function call failed: {e}")
    import traceback
    traceback.print_exc()

# Test 3: Direct table query
print("\n📚 Direct Query Check:")
try:
    response = client.from_('music_knowledge').select('*').limit(1).execute()
    print(f"✅ Direct query successful")
    print(f"   Rows returned: {len(response.data)}")
    if response.data:
        print(f"   Columns: {list(response.data[0].keys())}")
except Exception as e:
    print(f"❌ Direct query failed: {e}")

print("\n✅ Diagnostics complete!")
