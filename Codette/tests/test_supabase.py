#!/usr/bin/env python3
"""Test Supabase connection and check for music suggestions data"""

import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

supabase_url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL", "")
supabase_key = os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY", "")

print("=" * 60)
print("SUPABASE CONNECTION TEST")
print("=" * 60)

if not supabase_url or not supabase_key:
    print("❌ ERROR: Missing Supabase credentials in .env")
    print(f"   SUPABASE_URL: {'✓' if supabase_url else '✗'}")
    print(f"   SUPABASE_ANON_KEY: {'✓' if supabase_key else '✗'}")
    exit(1)

print(f"✓ Found credentials")
print(f"  URL: {supabase_url[:50]}...")

# Try to import and create client
try:
    import supabase
    print("✓ supabase module imported")
except ImportError:
    print("❌ supabase module not found, installing...")
    import subprocess
    subprocess.run(["pip", "install", "supabase"], check=True)
    import supabase

try:
    client = supabase.create_client(supabase_url, supabase_key)
    print("✓ Supabase client created")
except Exception as e:
    print(f"❌ Failed to create client: {e}")
    exit(1)

# Test 1: Check if RPC function exists by calling it
print("\n" + "=" * 60)
print("TEST 1: Call get_music_suggestions RPC")
print("=" * 60)

try:
    response = client.rpc(
        'get_music_suggestions',
        {
            'p_prompt': 'mixing',
            'p_context': 'mixing'
        }
    ).execute()
    
    print(f"✓ RPC call successful (status: 200)")
    print(f"  Response type: {type(response.data)}")
    print(f"  Response data: {json.dumps(response.data, indent=2)[:500]}")
    
    if response.data:
        print(f"✓ Got {len(response.data) if isinstance(response.data, list) else 1} results")
    else:
        print(f"⚠ RPC returned empty/null result")
        
except Exception as e:
    error_msg = str(e)
    print(f"❌ RPC call failed: {error_msg}")
    
    if "not found" in error_msg.lower() or "does not exist" in error_msg.lower():
        print("   → The RPC function 'get_music_suggestions' does not exist")
    if "timeout" in error_msg.lower():
        print("   → Connection timeout - network issue")
    if "unauthorized" in error_msg.lower():
        print("   → Authentication failed - check credentials")

# Test 2: Check if music_knowledge table exists and has data
print("\n" + "=" * 60)
print("TEST 2: Query music_knowledge table")
print("=" * 60)

try:
    response = client.table("music_knowledge").select("*").limit(5).execute()
    print(f"✓ Table query successful")
    print(f"  Returned {len(response.data)} rows")
    
    if response.data:
        print(f"  First row: {json.dumps(response.data[0], indent=2)}")
    else:
        print("  ⚠ Table exists but is empty")
        
except Exception as e:
    error_msg = str(e)
    print(f"❌ Table query failed: {error_msg}")
    
    if "not found" in error_msg.lower() or "does not exist" in error_msg.lower():
        print("   → Table 'music_knowledge' does not exist")

# Test 3: List all tables
print("\n" + "=" * 60)
print("TEST 3: List available tables")
print("=" * 60)

try:
    # Try to query information_schema
    response = client.table("information_schema.tables").select("table_name").execute()
    tables = [row["table_name"] for row in response.data if not row["table_name"].startswith("pg_")]
    print(f"✓ Found {len(tables)} tables:")
    for table in sorted(tables)[:20]:
        print(f"  - {table}")
    
    if len(tables) > 20:
        print(f"  ... and {len(tables) - 20} more")
        
except Exception as e:
    print(f"⚠ Could not list tables: {e}")
    print("  This is normal for some Supabase configurations")

# Test 4: Check other common table names
print("\n" + "=" * 60)
print("TEST 4: Check for common music/suggestions tables")
print("=" * 60)

table_names = [
    "music_knowledge",
    "suggestions",
    "music_suggestions",
    "ai_suggestions",
    "codette_suggestions",
    "tips",
    "advice",
    "knowledge_base"
]

for table_name in table_names:
    try:
        response = client.table(table_name).select("count()", {count: "exact"}).execute()
        count = response.count if hasattr(response, 'count') else len(response.data)
        print(f"✓ {table_name}: exists")
        
    except Exception as e:
        if "not found" in str(e).lower() or "does not exist" in str(e).lower():
            print(f"✗ {table_name}: not found")
        else:
            print(f"? {table_name}: error - {str(e)[:50]}")

print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)
print("If the RPC and table tests failed, you need to:")
print("1. Create the music_knowledge table in Supabase")
print("2. Create the get_music_suggestions RPC function")
print("3. Populate the table with suggestion data")
print("=" * 60)
