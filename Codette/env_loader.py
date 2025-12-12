"""
Codette Environment Loader
Ensures .env file is loaded from Codette directory specifically
"""

import os
from pathlib import Path
from typing import Optional

def load_codette_env(env_file: str = ".env") -> bool:
    """
    Load environment variables from Codette/.env file specifically
    
    Args:
        env_file: Name of env file (default: .env)
        
    Returns:
        True if loaded successfully, False otherwise
    """
    # Determine Codette directory
    codette_dir = Path(__file__).parent
    env_path = codette_dir / env_file
    
    if not env_path.exists():
        print(f"Warning: {env_path} not found")
        return False
    
    # Load environment variables
    try:
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                
                # Skip comments and empty lines
                if not line or line.startswith('#'):
                    continue
                
                # Parse KEY=VALUE
                if '=' in line:
                    key, value = line.split('=', 1)
                    key = key.strip()
                    value = value.strip()
                    
                    # Remove quotes if present
                    if value.startswith('"') and value.endswith('"'):
                        value = value[1:-1]
                    elif value.startswith("'") and value.endswith("'"):
                        value = value[1:-1]
                    
                    # Set environment variable (don't override existing)
                    if key not in os.environ:
                        os.environ[key] = value
        
        print(f"? Loaded environment from: {env_path}")
        return True
    except Exception as e:
        print(f"? Error loading {env_path}: {e}")
        return False


def get_env(key: str, default: Optional[str] = None) -> Optional[str]:
    """
    Get environment variable with fallback
    
    Args:
        key: Environment variable name
        default: Default value if not found
        
    Returns:
        Environment variable value or default
    """
    return os.environ.get(key, default)


def print_env_status():
    """Print status of key Codette environment variables"""
    keys = [
        'CODETTE_MODEL_ID',
        'CODETTE_PORT',
        'CODETTE_HOST',
        'VITE_SUPABASE_URL',
        'OPENAI_API_KEY',
        'OPENAI_FALLBACK_ENABLED',
    ]
    
    print("\n" + "="*70)
    print("Codette Environment Variables Status")
    print("="*70)
    
    for key in keys:
        value = os.environ.get(key)
        if value:
            # Mask sensitive values
            if 'KEY' in key or 'PASSWORD' in key or 'TOKEN' in key:
                masked = value[:10] + "..." if len(value) > 10 else "***"
                print(f"  ? {key}: {masked}")
            else:
                print(f"  ? {key}: {value}")
        else:
            print(f"  ? {key}: NOT SET")
    
    print("="*70 + "\n")


# Auto-load on import
if __name__ != "__main__":
    # When imported as module, automatically load .env
    load_codette_env()
else:
    # When run directly, show status
    load_codette_env()
    print_env_status()
