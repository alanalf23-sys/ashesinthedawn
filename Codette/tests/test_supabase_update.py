#!/usr/bin/env python
"""Test direct Supabase update to debug RLS issue"""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

try:
    import supabase
    
    url = os.getenv('VITE_SUPABASE_URL')
    anon_key = os.getenv('VITE_SUPABASE_ANON_KEY')
    service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    print("=" * 70)
    print("Testing Supabase UPDATE Operations")
    print("=" * 70)
    
    # Test 1: Try with anon key
    print("\n[Test 1] Attempting UPDATE with ANON key...")
    client_anon = supabase.create_client(url, anon_key)
    
    # Get first row to update
    rows = client_anon.table('music_knowledge').select('id,topic').limit(1).execute()
    if rows.data:
        test_id = rows.data[0]['id']
        test_topic = rows.data[0]['topic']
        print(f"  Target row: {test_id} ({test_topic})")
        
        # Try update
        try:
            test_embedding = [0.1] * 384  # Simple test embedding
            response = client_anon.table('music_knowledge').update({
                'embedding': test_embedding,
                'updated_at': '2025-12-01T15:00:00Z'
            }).eq('id', test_id).execute()
            
            print(f"  Response data length: {len(response.data)}")
            print(f"  Response: {response}")
            
            # Verify update
            check = client_anon.table('music_knowledge').select('id,embedding').eq('id', test_id).execute()
            if check.data and check.data[0]['embedding']:
                print(f"  ✅ UPDATE successful with anon key!")
                print(f"  Embedding stored: {len(check.data[0]['embedding'])} dimensions")
            else:
                print(f"  ⚠️  UPDATE returned success but no data persisted")
                print(f"  Embedding field: {check.data[0]['embedding'] if check.data else 'N/A'}")
                
        except Exception as e:
            print(f"  ❌ UPDATE failed: {e}")
    
    # Test 2: Try with service key if available
    if service_key:
        print("\n[Test 2] Attempting UPDATE with SERVICE key...")
        client_admin = supabase.create_client(url, service_key)
        
        rows = client_admin.table('music_knowledge').select('id,topic').limit(1).execute()
        if rows.data:
            test_id = rows.data[0]['id']
            test_topic = rows.data[0]['topic']
            print(f"  Target row: {test_id} ({test_topic})")
            
            try:
                test_embedding = [0.2] * 384
                response = client_admin.table('music_knowledge').update({
                    'embedding': test_embedding,
                    'updated_at': '2025-12-01T15:00:00Z'
                }).eq('id', test_id).execute()
                
                print(f"  Response: {response}")
                
                check = client_admin.table('music_knowledge').select('id,embedding').eq('id', test_id).execute()
                if check.data and check.data[0]['embedding']:
                    print(f"  ✅ UPDATE successful with service key!")
                else:
                    print(f"  ⚠️  UPDATE returned success but no data persisted")
                    
            except Exception as e:
                print(f"  ❌ UPDATE failed: {e}")
    else:
        print("\n[Test 2] SKIPPED - SUPABASE_SERVICE_ROLE_KEY not in environment")
    
    print("\n" + "=" * 70)
    print("To fix RLS issues:")
    print("1. Add SUPABASE_SERVICE_ROLE_KEY to .env")
    print("2. Or check RLS policies: Dashboard → Authentication → RLS")
    print("3. Ensure 'anon' role has UPDATE on 'embedding' column")
    print("=" * 70)
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
