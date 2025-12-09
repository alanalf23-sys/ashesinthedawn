#!/usr/bin/env python
"""Verify if public.messages table exists in Supabase"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Try to import Supabase client
try:
    from supabase import create_client
except ImportError:
    print("❌ supabase-py not installed. Installing...")
    os.system("pip install supabase -q")
    from supabase import create_client

# Color codes
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def check_messages_table():
    """Check if public.messages table exists"""
    
    supabase_url = os.getenv("SUPABASE_URL")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not service_role_key:
        print(f"{Colors.RED}❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env{Colors.RESET}")
        return False
    
    try:
        print(f"{Colors.CYAN}Connecting to Supabase...{Colors.RESET}")
        client = create_client(supabase_url, service_role_key)
        
        # Try to query the information_schema to check if table exists
        print(f"{Colors.CYAN}Checking for public.messages table...{Colors.RESET}")
        
        response = client.from_("messages").select("*", count="exact").limit(1).execute()
        
        print(f"{Colors.GREEN}✅ public.messages table EXISTS{Colors.RESET}")
        print(f"{Colors.CYAN}Table is accessible and ready for use{Colors.RESET}")
        return True
        
    except Exception as e:
        error_str = str(e)
        
        # Check for specific error messages
        if "42P01" in error_str or "does not exist" in error_str.lower():
            print(f"{Colors.RED}❌ public.messages table DOES NOT EXIST{Colors.RESET}")
            print(f"{Colors.YELLOW}Error: {e}{Colors.RESET}")
            print(f"\n{Colors.BOLD}Next Steps:{Colors.RESET}")
            print(f"1. Run: python create_messages_table.py")
            print(f"2. Or create manually in Supabase SQL Editor:")
            print(f"   {Colors.CYAN}CREATE TABLE public.messages ({Colors.RESET}")
            print(f"   {Colors.CYAN}  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,{Colors.RESET}")
            print(f"   {Colors.CYAN}  user_id uuid NOT NULL,{Colors.RESET}")
            print(f"   {Colors.CYAN}  room_id uuid NOT NULL,{Colors.RESET}")
            print(f"   {Colors.CYAN}  text text NOT NULL,{Colors.RESET}")
            print(f"   {Colors.CYAN}  created_at timestamp DEFAULT now(){Colors.RESET}")
            print(f"   {Colors.CYAN});{Colors.RESET}")
            return False
        else:
            print(f"{Colors.RED}❌ Error connecting to Supabase{Colors.RESET}")
            print(f"{Colors.YELLOW}Error: {e}{Colors.RESET}")
            return False

def main():
    print(f"\n{Colors.BOLD}=== Supabase Messages Table Verification ==={Colors.RESET}\n")
    
    exists = check_messages_table()
    
    if exists:
        print(f"\n{Colors.GREEN}✅ All checks passed!{Colors.RESET}")
        print(f"{Colors.CYAN}messages Edge Function can use this table{Colors.RESET}\n")
        sys.exit(0)
    else:
        print(f"\n{Colors.RED}⚠️  Table needs to be created{Colors.RESET}\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
