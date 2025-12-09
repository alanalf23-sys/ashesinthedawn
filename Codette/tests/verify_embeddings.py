#!/usr/bin/env python
"""Verify embeddings stored in Supabase"""

import os
import json
from pathlib import Path
from dotenv import load_dotenv

# Load environment
load_dotenv()

try:
    import supabase
    
    url = os.getenv('VITE_SUPABASE_URL')
    key = os.getenv('VITE_SUPABASE_ANON_KEY')
    
    print("✅ Connecting to Supabase...")
    client = supabase.create_client(url, key)
    
    print("\n📊 Querying music_knowledge table...")
    response = client.table('music_knowledge').select('id,topic,embedding').limit(5).execute()
    
    print("\n✅ Successfully queried Supabase\n")
    print("📊 Sample embeddings (first 5 rows):")
    print("=" * 70)
    
    for i, row in enumerate(response.data, 1):
        print(f"{i}. ID: {row['id']}")
        print(f"   Topic: {row['topic']}")
        if row['embedding']:
            emb = row['embedding']
            if isinstance(emb, list):
                print(f"   ✅ Embedding stored: {len(emb)} dimensions")
                print(f"   First 5 dims: {emb[:5]}")
            else:
                print(f"   ⚠️  Embedding type: {type(emb)}")
        else:
            print("   ❌ No embedding")
        print()
    
    # Count total embeddings
    print("\n📈 Summary:")
    total = client.table('music_knowledge').select('id,embedding').execute()
    with_embeddings = sum(1 for row in total.data if row['embedding'])
    print(f"   Total rows: {len(total.data)}")
    print(f"   With embeddings: {with_embeddings}")
    if total.data:
        coverage = (with_embeddings * 100) // len(total.data)
        print(f"   Coverage: {with_embeddings}/{len(total.data)} ({coverage}%)")
    
    if with_embeddings == len(total.data):
        print("\n🎉 SUCCESS: All rows have embeddings!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
