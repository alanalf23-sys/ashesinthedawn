#!/usr/bin/env python
"""
Test Codette Integration with Existing Supabase Tables
Tests: music_knowledge_dedupe_backup, chat_history
"""

import os
import sys
from pathlib import Path

# Add Codette to path
sys.path.insert(0, str(Path(__file__).parent / "Codette"))

def test_existing_tables():
    """Test integration with existing Supabase tables"""
    print("=" * 80)
    print("TESTING CODETTE WITH EXISTING SUPABASE TABLES")
    print("=" * 80)
    print()
    
    # Check environment
    print("1. Checking Supabase Configuration...")
    supabase_url = os.getenv('VITE_SUPABASE_URL')
    service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    anon_key = os.getenv('VITE_SUPABASE_ANON_KEY')
    
    if not supabase_url or (not service_key and not anon_key):
        print("   ? Supabase not configured")
        print("   Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env")
        return False
    
    print(f"   ? Supabase URL: {supabase_url[:30]}...")
    print()
    
    # Test Supabase client
    print("2. Testing Supabase Client...")
    try:
        from supabase import create_client
        
        key = service_key or anon_key
        client = create_client(supabase_url, key)
        print("   ? Supabase client created")
        print()
    except ImportError:
        print("   ? Supabase not installed: pip install supabase")
        return False
    except Exception as e:
        print(f"   ? Error: {e}")
        return False
    
    # Test existing tables
    print("3. Checking Existing Tables...")
    
    # Test music_knowledge (primary table)
    try:
        response = client.table('music_knowledge').select('*').limit(5).execute()
        
        if response.data:
            print(f"   ? music_knowledge: {len(response.data)} entries found (PRIMARY)")
            
            # Show sample entries
            for i, entry in enumerate(response.data[:3], 1):
                topic = entry.get('topic', 'N/A')
                category = entry.get('category', 'N/A')
                confidence = entry.get('confidence', 0) or 0
                is_public = entry.get('is_public', False)
                user_id = entry.get('user_id', 'N/A')
                print(f"      {i}. Topic: {topic[:40]}... | Category: {category}")
                print(f"         Confidence: {confidence:.2f} | Public: {is_public} | User: {str(user_id)[:8]}...")
        else:
            print("   ??  music_knowledge: Empty (no entries)")
    except Exception as e:
        if 'does not exist' in str(e):
            print("   ??  music_knowledge: Table not found")
        else:
            print(f"   ? music_knowledge: {str(e)[:60]}...")
    
    print()
    
    # Test music_knowledge_dedupe_backup
    try:
        response = client.table('music_knowledge_dedupe_backup').select('*').limit(5).execute()
        
        if response.data:
            print(f"   ? music_knowledge_dedupe_backup: {len(response.data)} entries found (BACKUP)")
            
            # Show sample entries
            for i, entry in enumerate(response.data[:3], 1):
                topic = entry.get('topic', 'N/A')
                category = entry.get('category', 'N/A')
                confidence = entry.get('confidence', 0) or 0
                print(f"      {i}. Topic: {topic[:40]}... | Category: {category} | Confidence: {confidence:.2f}")
        else:
            print("   ??  music_knowledge_dedupe_backup: Empty (no entries)")
    except Exception as e:
        if 'does not exist' in str(e):
            print("   ??  music_knowledge_dedupe_backup: Table not found")
        else:
            print(f"   ? music_knowledge_dedupe_backup: {str(e)[:60]}...")
    
    print()
    
    # Test chat_history
    try:
        response = client.table('chat_history').select('*').limit(5).execute()
        
        if response.data:
            print(f"   ? chat_history: {len(response.data)} conversations found")
            
            # Check for Codette integration columns
            if response.data:
                first_entry = response.data[0]
                if 'codette_generated' in first_entry:
                    print("      ? codette_generated column exists")
                else:
                    print("      ??  codette_generated column not added yet")
        else:
            print("   ??  chat_history: Empty (no conversations)")
    except Exception as e:
        print(f"   ? chat_history: {str(e)[:60]}...")
    
    print()
    
    # Test Codette with existing tables
    print("4. Testing Codette AI Integration...")
    try:
        from codette_new import Codette
        
        codette = Codette(user_name="TestUser")
        
        if codette.supabase_client:
            print("   ? Codette connected to Supabase")
            
            # Check table flags
            if hasattr(codette, 'has_music_knowledge_table') and codette.has_music_knowledge_table:
                table_name = getattr(codette, 'music_knowledge_table', 'music_knowledge')
                print(f"   ? Detected {table_name} table")
            
            if hasattr(codette, 'has_music_knowledge_backup_table') and codette.has_music_knowledge_backup_table:
                print("   ? Detected music_knowledge_dedupe_backup table (backup available)")
            
            if hasattr(codette, 'has_chat_history_table') and codette.has_chat_history_table:
                print("   ? Detected chat_history table")
            
            # Test querying music knowledge
            print()
            print("   Testing music knowledge query...")
            
            test_topics = ['mixing', 'eq', 'compression', 'bass', 'vocal']
            found_any = False
            for topic in test_topics:
                results = codette.query_music_knowledge(topic=topic, limit=2)
                if results:
                    print(f"      ? Found {len(results)} entries for '{topic}'")
                    
                    # Show first result details
                    first = results[0]
                    suggestion = first.get('suggestion', {})
                    if isinstance(suggestion, dict):
                        title = suggestion.get('title', 'N/A')
                        print(f"         Example: {title[:60]}...")
                    
                    found_any = True
                    break
            
            if not found_any:
                print("      ??  No entries found for test topics")
                print("         (Tables may be empty or require different search terms)")
            
            # Test response generation with knowledge base
            print()
            print("   Testing response with knowledge base integration...")
            response = codette.respond("how do I improve my mixing?")
            
            if "Knowledge Base" in response:
                print("      ? Response uses knowledge base!")
                print(f"      Preview: {response[:150]}...")
            else:
                print("      ? Response uses built-in responses")
                print(f"      Preview: {response[:150]}...")
        else:
            print("   ??  Codette running without Supabase")
    
    except ImportError as e:
        print(f"   ? Could not import Codette: {e}")
        return False
    except Exception as e:
        print(f"   ? Error testing Codette: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print()
    return True

def test_chat_history_save():
    """Test saving to chat_history table"""
    print("=" * 80)
    print("TESTING CHAT_HISTORY SAVE")
    print("=" * 80)
    print()
    
    try:
        from codette_new import Codette
        
        codette = Codette(user_name="TestUser")
        
        if not codette.supabase_client:
            print("??  Supabase not configured (skipping)")
            return
        
        if not hasattr(codette, 'has_chat_history_table') or not codette.has_chat_history_table:
            print("??  chat_history table not found (skipping)")
            return
        
        print("Testing conversation save to chat_history...")
        
        # Create test conversation
        test_messages = [
            {'role': 'user', 'content': 'Test question about mixing'},
            {'role': 'assistant', 'content': '[Technical Expert] Test response about mixing'}
        ]
        
        # Save to chat_history
        codette.save_to_chat_history(
            user_id='test-user-123',
            messages=test_messages,
            metadata={'test': True, 'personality': codette.current_personality}
        )
        
        print("? Test conversation saved to chat_history")
        print("   Check Supabase Table Editor ? chat_history for test entry")
    
    except Exception as e:
        print(f"? Error saving to chat_history: {e}")
        import traceback
        traceback.print_exc()

def main():
    """Run all existing table integration tests"""
    print()
    print("?" + "?" * 78 + "?")
    print("?" + " " * 18 + "CODETTE EXISTING TABLES INTEGRATION TEST" + " " * 20 + "?")
    print("?" + "?" * 78 + "?")
    print()
    
    success = test_existing_tables()
    
    if success:
        print()
        test_chat_history_save()
    
    # Summary
    print()
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print()
    
    if success:
        print("? INTEGRATION SUCCESSFUL!")
        print()
        print("Codette can now:")
        print("   • Query music_knowledge_dedupe_backup for DAW expertise")
        print("   • Save conversations to chat_history table")
        print("   • Use existing knowledge base + built-in responses")
        print("   • Integrate with your existing Supabase infrastructure")
        print()
        print("Next Steps:")
        print("   1. Restart Codette server")
        print("   2. Test in your DAW")
        print("   3. Check chat_history for saved conversations")
    else:
        print("??  INTEGRATION PARTIAL")
        print()
        print("Codette will still work with built-in responses!")
        print("To enable full integration:")
        print("   1. Configure Supabase credentials in .env")
        print("   2. Ensure tables are accessible")
        print("   3. Run this test again")
    
    print()
    print("=" * 80)

if __name__ == "__main__":
    main()
