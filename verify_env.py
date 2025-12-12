"""
Verify Codette .env file is being read correctly
Run this to test the environment variable loading
"""

import sys
from pathlib import Path

# Add Codette to path
codette_path = Path(__file__).parent / "Codette"
sys.path.insert(0, str(codette_path))

print("\n" + "="*70)
print("Codette Environment Verification")
print("="*70 + "\n")

# Test 1: Check .env file exists
env_file = codette_path / ".env"
print(f"1. Checking .env file location...")
print(f"   Expected: {env_file}")
if env_file.exists():
    print(f"   ? File EXISTS")
else:
    print(f"   ? File NOT FOUND")
    sys.exit(1)

# Test 2: Load using env_loader
print(f"\n2. Loading environment variables...")
try:
    from env_loader import load_codette_env, print_env_status
    success = load_codette_env()
    if success:
        print(f"   ? Environment loaded successfully")
    else:
        print(f"   ? Failed to load environment")
except Exception as e:
    print(f"   ? Error: {e}")
    sys.exit(1)

# Test 3: Print environment status
print(f"\n3. Environment Variables Status:")
print_env_status()

# Test 4: Specific checks
print(f"4. Specific Variable Checks:")
import os

checks = {
    "CODETTE_PORT": ("8000", "Backend port"),
    "CODETTE_MODEL_ID": (None, "Model path"),
    "VITE_SUPABASE_URL": ("https://", "Supabase URL prefix"),
}

all_passed = True
for key, (expected, desc) in checks.items():
    value = os.environ.get(key)
    if value:
        if expected and expected in value:
            print(f"   ? {key} ({desc}): Correct")
        elif not expected:
            print(f"   ? {key} ({desc}): Set")
        else:
            print(f"   ??  {key} ({desc}): Unexpected value")
            all_passed = False
    else:
        print(f"   ? {key} ({desc}): NOT SET")
        all_passed = False

# Final result
print("\n" + "="*70)
if all_passed:
    print("? ALL CHECKS PASSED - Environment configured correctly!")
else:
    print("??  SOME CHECKS FAILED - Review .env configuration")
print("="*70 + "\n")

print("\n" + "="*70)
print("To ensure .env stays private:")
print("="*70)
print("1. ? .env is in .gitignore")
print("2. ? Never commit .env to git")
print("3. ? Copy .env.example to .env for new setups")
print("4. ? Keep sensitive keys in .env only")
print("="*70 + "\n")
