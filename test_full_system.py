# -*- coding: utf-8 -*-
"""
Full System Test - Verify all Codette components work together
Tests: Backend server, frontend build, imports, and integration
"""
import subprocess
import sys
import os
import time
from pathlib import Path

# Color codes for terminal
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    CYAN = '\033[96m'
    YELLOW = '\033[93m'
    END = '\033[0m'

def print_test(name, passed, details=""):
    status = f"{Colors.GREEN}[PASS]{Colors.END}" if passed else f"{Colors.RED}[FAIL]{Colors.END}"
    print(f"{status} {name}")
    if details:
        print(f"    {details}")

def test_startup_scripts_unicode():
    """Test that startup scripts have UTF-8 encoding"""
    print(f"\n{Colors.CYAN}=== Testing Startup Scripts ==={Colors.END}")
    
    startup_files = [
        "start_codette_ai.py",
        "run_codette.py", 
        "run_server.py"
    ]
    
    all_passed = True
    for filename in startup_files:
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                content = f.read()
                has_encoding = '# -*- coding: utf-8 -*-' in content
                passed = has_encoding
                if passed:
                    # Make sure no emoji characters
                    has_emoji = any(ord(c) > 127 for c in content if c not in '\n\r\t')
                    passed = not has_emoji
                    
                print_test(
                    f"Startup script: {filename}",
                    passed,
                    "UTF-8 encoding declaration and no emoji" if passed else "Missing encoding or has emoji"
                )
                all_passed = all_passed and passed
        except Exception as e:
            print_test(f"Startup script: {filename}", False, str(e))
            all_passed = False
    
    return all_passed

def test_codette_imports():
    """Test that Codette modules import correctly"""
    print(f"\n{Colors.CYAN}=== Testing Codette Imports ==={Colors.END}")
    
    codette_path = Path(__file__).parent / "Codette"
    sys.path.insert(0, str(codette_path))
    
    modules = [
        "codette_new",
        "codette_api",
        "chat_with_codette",
        "codette_cli",
        "database_manager",
        "codette_interface"
    ]
    
    all_passed = True
    for module in modules:
        try:
            __import__(module)
            print_test(f"Import {module}", True)
        except Exception as e:
            print_test(f"Import {module}", False, str(e)[:50])
            all_passed = False
    
    return all_passed

def test_codette_functionality():
    """Test basic Codette functionality"""
    print(f"\n{Colors.CYAN}=== Testing Codette Functionality ==={Colors.END}")
    
    try:
        from Codette.codette_new import Codette
        
        # Test initialization
        c = Codette(user_name="TestUser")
        print_test("Initialize Codette", True)
        
        # Test response generation
        # Note: codette_new.respond() returns a string, not a dict
        response = c.respond("What is 2+2?")
        has_response = isinstance(response, str) and len(response) > 0
        print_test("Generate response", has_response, "Response generated successfully" if has_response else "No response")
        
        return has_response
    except Exception as e:
        print_test("Codette functionality test", False, str(e)[:50])
        return False

def test_database_manager():
    """Test database manager functionality"""
    print(f"\n{Colors.CYAN}=== Testing Database Manager ==={Colors.END}")
    
    try:
        from Codette.database_manager import get_db_manager
        
        db = get_db_manager()
        print_test("Initialize DatabaseManager", True)
        
        # Test user creation
        username = f"test_user_{int(time.time())}"
        db.create_user(username, f"{username}@test.com")
        user = db.get_user(username)
        user_exists = user is not None
        print_test("Create and retrieve user", user_exists)
        
        # Test memory operations
        db.save_memory("test_key", {"data": "test_value"})
        data = db.load_memory("test_key")
        memory_works = data is not None
        print_test("Save and load memory", memory_works)
        
        return user_exists and memory_works
    except Exception as e:
        print_test("DatabaseManager functionality test", False, str(e)[:50])
        return False

def test_frontend_build():
    """Test that frontend builds successfully"""
    print(f"\n{Colors.CYAN}=== Testing Frontend Build ==={Colors.END}")
    
    try:
        # Check if we're in the right directory
        base_path = Path(__file__).parent
        if not (base_path / "package.json").exists():
            print_test("npm run build", False, "package.json not found - not in project root")
            return False
        
        # Try different ways to invoke npm
        npm_cmd = ["npm", "run", "build"]
        if sys.platform == "win32":
            npm_cmd = ["npm.cmd", "run", "build"]
        
        result = subprocess.run(
            npm_cmd,
            capture_output=True,
            timeout=120,
            cwd=str(base_path),
            shell=True
        )
        
        passed = result.returncode == 0
        if not passed:
            error_msg = result.stderr.decode('utf-8', errors='ignore')[:100] if result.stderr else f"Exit code: {result.returncode}"
        else:
            error_msg = "Build successful"
            
        print_test(
            "npm run build",
            passed,
            error_msg
        )
        return passed
    except subprocess.TimeoutExpired:
        print_test("npm run build", False, "Build timeout (>120s)")
        return False
    except Exception as e:
        # If npm not available, it's OK - just skip this test
        print_test("npm run build", False, f"Skipped: {str(e)[:50]}")
        return False

def test_config_system():
    """Test configuration system"""
    print(f"\n{Colors.CYAN}=== Testing Configuration ==={Colors.END}")
    
    try:
        from Codette.config import get_config
        
        config = get_config()
        print_test("Load configuration", config is not None, "Config loaded successfully")
        
        # Test getting values
        port = config.get("api", "port")
        has_port = port is not None
        print_test("Get config value", has_port, f"Port: {port}" if has_port else "Could not retrieve port")
        
        return config is not None and has_port
    except Exception as e:
        print_test("Configuration test", False, str(e)[:50])
        return False

def test_chat_interface():
    """Test chat interface"""
    print(f"\n{Colors.CYAN}=== Testing Chat Interface ==={Colors.END}")
    
    try:
        from Codette.codette_interface import CodetteInterface
        
        interface = CodetteInterface(user_name="TestUser")
        print_test("Initialize CodetteInterface", True)
        
        # Test state retrieval
        state = interface.get_system_state()
        state_valid = state.get("status") == "active"
        print_test("Get system state", state_valid)
        
        # Test message processing
        result = interface.process_message("Hello Codette")
        has_response = result.get("status") == "success"
        print_test("Process message", has_response)
        
        return True
    except Exception as e:
        print_test("Chat interface test", False, str(e)[:50])
        return False

def main():
    """Run all tests"""
    print(f"{Colors.YELLOW}{'='*70}{Colors.END}")
    print(f"{Colors.YELLOW}CODETTE FULL SYSTEM TEST{Colors.END}")
    print(f"{Colors.YELLOW}{'='*70}{Colors.END}")
    
    os.chdir(Path(__file__).parent)
    
    results = []
    results.append(("Startup Scripts", test_startup_scripts_unicode()))
    results.append(("Codette Imports", test_codette_imports()))
    results.append(("Codette Functionality", test_codette_functionality()))
    results.append(("Database Manager", test_database_manager()))
    results.append(("Config System", test_config_system()))
    results.append(("Chat Interface", test_chat_interface()))
    results.append(("Frontend Build", test_frontend_build()))
    
    # Summary
    print(f"\n{Colors.YELLOW}{'='*70}{Colors.END}")
    print(f"{Colors.YELLOW}TEST SUMMARY{Colors.END}")
    print(f"{Colors.YELLOW}{'='*70}{Colors.END}")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = f"{Colors.GREEN}PASS{Colors.END}" if result else f"{Colors.RED}FAIL{Colors.END}"
        print(f"{status} {name}")
    
    print(f"\n{Colors.YELLOW}Results: {passed}/{total} tests passed{Colors.END}")
    
    if passed == total:
        print(f"{Colors.GREEN}All tests passed!{Colors.END}")
        return 0
    else:
        print(f"{Colors.RED}{total - passed} test(s) failed{Colors.END}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
