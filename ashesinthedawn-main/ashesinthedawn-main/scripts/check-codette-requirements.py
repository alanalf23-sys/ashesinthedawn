#!/usr/bin/env python
"""
Codette Requirements Checker
Verifies all required packages are installed and installs missing ones.
"""

import subprocess
import sys

# Core requirements for Codette
CORE_REQUIREMENTS = {
    'numpy': '>=1.23.0',
    'scipy': '>=1.9.0',
    'matplotlib': '>=3.5.0',
    'scikit-learn': '>=1.1.0',
    'flask': '>=2.3.0',
    'flask-cors': '>=4.0.0',
    'aiohttp': '>=3.9.0',
    'pandas': '>=1.5.0',
    'cryptography': '>=41.0.0',
    'pycryptodome': '>=3.18.0',
    'pyyaml': '>=6.0.0',
    'python-dotenv': '>=1.0.0',
    'colorama': '>=0.4.5',
    'psutil': '>=5.9.0',
}

# Optional but recommended packages
OPTIONAL_REQUIREMENTS = {
    'transformers': '>=4.21.0',
    'torch': '>=1.12.0',
    'faiss-cpu': '>=1.7.4',
    'networkx': '>=2.8.0',
    'vaderSentiment': '>=3.3.2',
    'nltk': '>=3.8.0',
    'cryptography': '>=41.0.0',
}


def check_package(package_name, package_import_name=None):
    """Check if a package is installed."""
    if package_import_name is None:
        package_import_name = package_name.replace('-', '_')
    
    try:
        __import__(package_import_name)
        return True
    except ImportError:
        return False


def install_packages(packages_list, optional=False):
    """Install a list of packages using pip."""
    if not packages_list:
        return True
    
    mode = "optional" if optional else "core"
    print(f"\n📦 Installing {mode} packages: {', '.join(packages_list)}")
    
    try:
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", *packages_list],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.STDOUT
        )
        print(f"✓ {len(packages_list)} {mode} packages installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Error installing packages: {e}")
        return False


def main():
    """Main check and install function."""
    print("=" * 70)
    print("  CODETTE REQUIREMENTS CHECKER")
    print("=" * 70)
    
    missing_core = []
    missing_optional = []
    
    # Check core requirements
    print("\n🔍 Checking core requirements...")
    for package_name in CORE_REQUIREMENTS.keys():
        import_name = package_name.replace('-', '_')
        if check_package(package_name, import_name):
            print(f"  ✓ {package_name}")
        else:
            print(f"  ✗ {package_name}")
            missing_core.append(f"{package_name}{CORE_REQUIREMENTS[package_name]}")
    
    # Check optional requirements
    print("\n🔍 Checking optional requirements...")
    for package_name in OPTIONAL_REQUIREMENTS.keys():
        import_name = package_name.replace('-', '_')
        if check_package(package_name, import_name):
            print(f"  ✓ {package_name}")
        else:
            print(f"  ◇ {package_name} (optional)")
            missing_optional.append(f"{package_name}{OPTIONAL_REQUIREMENTS[package_name]}")
    
    # Install missing packages
    success = True
    if missing_core:
        success = install_packages(missing_core, optional=False) and success
    
    if missing_optional:
        response = input("\n❓ Install optional packages? (y/n): ").strip().lower()
        if response == 'y':
            success = install_packages(missing_optional, optional=True) and success
    
    # Final status
    print("\n" + "=" * 70)
    if success and not missing_core:
        print("✅ All core requirements satisfied!")
        print("✅ Codette backend ready to run!")
        print("\nTo start Codette backend:")
        print("  > cd I:\\Codette")
        print("  > python run_server.py")
    elif success and missing_core:
        print("✅ All requirements installed successfully!")
    else:
        print("⚠️  Some packages could not be installed.")
        print("   Please install them manually or check your Python environment.")
    print("=" * 70)
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
