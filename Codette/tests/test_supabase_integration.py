#!/usr/bin/env python
"""
Test Codette with Supabase Integration
Verifies database connection and conversation storage
"""

import os
import sys
from pathlib import Path

# Add Codette to path
sys.path.insert(0, str(Path(__file__).parent / "Codette"))

def test_supabase_connection():
    """Test Supabase connection and schema"""
    print("=" * 80)
    print("TESTING CODETTE SUPABASE INTEGRATION")
    print("=" * 80)
    print()
    
    # Check environment variables
    print("1. Checking Environment Variables...")
    supabase_url = os.getenv('VITE_SUPABASE_URL')
    service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    anon_key = os.getenv('VITE_SUPABASE_ANON_KEY')
    
    if supabase_url:
        print(f"   ? VITE_SUPABASE_URL: {supabase_url[:30]}...")
    else:
        print("   ? VITE_SUPABASE_URL not set")
        return False
    
    if service_key:
        print(f"   ? SUPABASE_SERVICE_ROLE_KEY: {service_key[:20]}...")
    elif anon_key:
        print(f"   ??  Using VITE_SUPABASE_ANON_KEY (limited by RLS)")
    else:
        print("   ? No Supabase key configured")
        return False
    
    print()
    
    # Test Supabase client
    print("2. Testing Supabase Client...")
    try:
        from supabase import create_client
        
        key = service_key or anon_key
        client = create_client(supabase_url, key)
        
        print("   ? Supabase client created successfully")
        print()
    except ImportError:
        print("   ? Supabase not installed")
        print("   Install with: pip install supabase")
        return False
    except Exception as e:
        print(f"   ? Error creating client: {e}")
        return False
    
    # Test table access
    print("3. Testing Table Access...")
    
    tables_to_check = [
        'codette_conversations',
        'codette_knowledge_base',
        'codette_user_preferences',
        'chat_history'  # Your existing table
    ]
    
    accessible_tables = []
    
    for table in tables_to_check:
        try:
            response = client.table(table).select('*').limit(1).execute()
            print(f"   ? {table}: Accessible")
            accessible_tables.append(table)
        except Exception as e:
            if 'does not exist' in str(e):
                print(f"   ??  {table}: Not created yet (run migration)")
            else:
                print(f"   ? {table}: Access denied ({str(e)[:50]}...)")
    
    print()
    
    # Test Codette initialization
    print("4. Testing Codette AI with Supabase...")
    try:
        from codette_new import Codette
        
        codette = Codette(user_name="TestUser")
        
        if codette.supabase_client:
            print("   ? Codette initialized with Supabase connection")
            
            # Test conversation save
            try:
                test_prompt = "Test query for Supabase"
                test_response = codette.respond(test_prompt)
                
                # Save to database
                codette.save_conversation_to_db(
                    prompt=test_prompt,
                    response=test_response,
                    metadata={'test': True}
                )
                
                print("   ? Test conversation saved to database")
                
                # Retrieve conversation history
                history = codette.get_conversation_history(limit=5)
                print(f"   ? Retrieved {len(history)} conversations from history")
                
            except Exception as save_error:
                print(f"   ??  Conversation save failed: {save_error}")
                print("      (This is normal if migration hasn't run yet)")
        else:
            print("   ??  Codette running without Supabase (check credentials)")
    
    except ImportError as import_error:
        print(f"   ? Could not import Codette: {import_error}")
        return False
    except Exception as e:
        print(f"   ? Error testing Codette: {e}")
        return False
    
    print()
    
    # Summary
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print()
    
    if len(accessible_tables) >= 1:
        print("? Supabase integration working!")
        print()
        print("Accessible tables:")
        for table in accessible_tables:
            print(f"   • {table}")
        print()
        
        if 'codette_conversations' not in accessible_tables:
            print("??  Codette tables not found")
            print("   Action: Run migration in Supabase Dashboard:")
            print("   1. Go to SQL Editor")
            print("   2. Copy contents of: supabase/migrations/create_codette_schema.sql")
            print("   3. Click 'Run'")
        
        return True
    else:
        print("? Supabase access issues detected")
        print()
        print("Troubleshooting:")
        print("   1. Check credentials in .env file")
        print("   2. Verify Supabase project is active")
        print("   3. Run migration to create tables")
        return False

def test_chat_history_integration():
    """Test integration with existing chat_history table"""
    print()
    print("=" * 80)
    print("TESTING CHAT_HISTORY INTEGRATION")
    print("=" * 80)
    print()
    
    try:
        from supabase import create_client
        
        supabase_url = os.getenv('VITE_SUPABASE_URL')
        service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('VITE_SUPABASE_ANON_KEY')
        
        if not supabase_url or not service_key:
            print("??  Skipping (Supabase not configured)")
            return
        
        client = create_client(supabase_url, service_key)
        
        # Check if chat_history exists
        try:
            response = client.table('chat_history').select('*').limit(1).execute()
            print("? chat_history table found")
            
            # Check for Codette integration columns
            if response.data and len(response.data) > 0:
                first_row = response.data[0]
                
                if 'codette_generated' in first_row:
                    print("   ? codette_generated column exists")
                else:
                    print("   ??  codette_generated column not added yet")
                    print("      (Run migration to add integration columns)")
                
                if 'codette_personality' in first_row:
                    print("   ? codette_personality column exists")
                else:
                    print("   ??  codette_personality column not added yet")
            
            print()
            print("? Integration ready!")
            print("   Codette can now link to existing chat_history entries")
        
        except Exception as e:
            if 'does not exist' in str(e):
                print("??  chat_history table not found (that's okay)")
                print("   Codette will use codette_conversations table instead")
            else:
                print(f"??  Error checking chat_history: {e}")
    
    except Exception as e:
        print(f"??  Could not test integration: {e}")

def main():
    """Run all Supabase tests"""
    print()
    print("?" + "?" * 78 + "?")
    print("?" + " " * 22 + "CODETTE SUPABASE INTEGRATION TEST" + " " * 23 + "?")
    print("?" + "?" * 78 + "?")
    print()
    
    success = test_supabase_connection()
    
    if success:
        test_chat_history_integration()
    
    print()
    print("=" * 80)
    print("NEXT STEPS")
    print("=" * 80)
    print()
    
    if success:
        print("? Supabase integration is working!")
        print()
        print("To enable full features:")
        print("   1. Run migration (if tables not found)")
        print("   2. Restart Codette server")
        print("   3. Test in your DAW")
        print()
        print("Codette will now:")
        print("   • Save all conversations to Supabase")
        print("   • Remember context between sessions")
        print("   • Learn from successful interactions")
        print("   • Retrieve curated knowledge from database")
    else:
        print("??  Supabase integration not fully working")
        print()
        print("Codette will still work without Supabase!")
        print("   • All personality modes functional")
        print("   • Response variety working")
        print("   • In-session memory active")
        print()
        print("To enable Supabase:")
        print("   1. Add credentials to .env file")
        print("   2. Run migration in Supabase Dashboard")
        print("   3. Restart server")
        print("   4. Run this test again")
    
    print()
    print("=" * 80)

if __name__ == "__main__":
    main()
