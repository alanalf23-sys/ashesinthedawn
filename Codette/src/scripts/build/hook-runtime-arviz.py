"""
Runtime hook to ensure arviz static files are properly initialized
"""
import os
import sys
import pathlib
from pathlib import Path

def _setup_arviz_static():
    """Setup arviz static files in the correct location."""
    # Get the base directory where the executable is located
    if getattr(sys, 'frozen', False):
        base_dir = Path(sys._MEIPASS)
    else:
        base_dir = Path(os.path.dirname(os.path.abspath(__file__)))
        
    # Ensure the static directory exists in the correct location
    static_dir = base_dir / 'arviz' / 'static'
    if static_dir.exists():
        os.environ['ARVIZ_STATIC_DIR'] = str(static_dir)
        print(f"Set ARVIZ_STATIC_DIR to {static_dir}")
    else:
        print(f"Warning: Could not find arviz static directory at {static_dir}")
        
_setup_arviz_static()
