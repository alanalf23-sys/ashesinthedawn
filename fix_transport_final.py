#!/usr/bin/env python3
"""
FINAL COMPREHENSIVE FIX for Transport 500 Errors
===================================================
This script fixes the TransportManager/TransportState ordering issue
that's causing 500 errors on transport endpoints.

The problem: TransportState BaseModel needs to be defined BEFORE
TransportManager tries to use it in type hints and return types.
"""

import re
from pathlib import Path

def main():
    print("="*70)
    print("FINAL TRANSPORT FIX - Fixing TransportState ordering")
    print("="*70)
    
    server_file = Path("codette_server_unified.py")
    
    # Read file
    content = server_file.read_text(encoding='utf-8')
    print("\n[INFO] File read successfully")
    
    # Find where BaseModel is imported (near line 22)
    basemodel_import = "from pydantic import BaseModel"
    
    if basemodel_import not in content:
        print("[ERROR] Could not find Pydantic BaseModel import!")
        return False
    
    print("[INFO] Found BaseModel import")
    
    # Define the complete TransportState + TransportManager code
    complete_transport_code = '''

# ============================================================================
# TRANSPORT CLOCK MODELS & MANAGER (Fixed ordering)
# ============================================================================

class TransportState(BaseModel):
    """Transport state model"""
    playing: bool
    time_seconds: float
    sample_pos: int
    bpm: float
    beat_pos: float
    loop_enabled: bool
    loop_start_seconds: float
    loop_end_seconds: float


class TransportManager:
    """Manages playback transport state"""
    def __init__(self):
        self.playing = False
        self.time_seconds = 0.0
        self.sample_pos = 0
        self.bpm = 120.0
        self.sample_rate = 44100
        self.start_time = None
        self.loop_enabled = False
        self.loop_start_seconds = 0.0
        self.loop_end_seconds = 10.0
        self.beat_pos = 0.0
        logger.info("[TransportManager] Initialized")
    
    def get_state(self) -> TransportState:
        """Get current transport state"""
        if self.playing and self.start_time:
            import time as time_module
            elapsed = time_module.time() - self.start_time
            self.time_seconds = elapsed
            self.sample_pos = int(self.time_seconds * self.sample_rate)
        
        # Calculate beat position
        beat_duration = 60.0 / self.bpm if self.bpm > 0 else 1.0
        self.beat_pos = (self.time_seconds % (beat_duration * 4)) / beat_duration
        
        return TransportState(
            playing=self.playing,
            time_seconds=self.time_seconds,
            sample_pos=self.sample_pos,
            bpm=self.bpm,
            beat_pos=self.beat_pos,
            loop_enabled=self.loop_enabled,
            loop_start_seconds=self.loop_start_seconds,
            loop_end_seconds=self.loop_end_seconds
        )
    
    def play(self) -> TransportState:
        """Start playback"""
        if not self.playing:
            import time as time_module
            self.playing = True
            self.start_time = time_module.time() - self.time_seconds
            logger.info("[TransportManager] Playback started")
        return self.get_state()
    
    def stop(self) -> TransportState:
        """Stop playback and reset"""
        self.playing = False
        self.time_seconds = 0.0
        self.sample_pos = 0
        self.start_time = None
        logger.info("[TransportManager] Playback stopped")
        return self.get_state()
    
    def pause(self) -> TransportState:
        """Pause playback"""
        if self.playing:
            import time as time_module
            self.time_seconds = time_module.time() - self.start_time
            self.playing = False
            logger.info("[TransportManager] Playback paused")
        return self.get_state()


# Initialize transport manager globally
transport_manager = TransportManager()

# ============================================================================
# END TRANSPORT CLOCK
# ============================================================================
'''
    
    # Remove any existing TransportState/TransportManager definitions
    patterns_to_remove = [
        r'class TransportState\(.*?\):.*?(?=class |# ===|$)',
        r'class TransportManager:.*?(?=class |# ===|$)',
        r'transport_manager\s*=\s*TransportManager\(\)',
        r'# ={70,}\n# TRANSPORT.*?\n# ={70,}.*?(?=# ={70,}|$)',
    ]
    
    for pattern in patterns_to_remove:
        content = re.sub(pattern, '', content, flags=re.DOTALL)
    
    print("[INFO] Removed old transport definitions")
    
    # Find a safe place to insert - right after the BaseModel import section
    # Look for the logging setup section (around line 57-65)
    logging_section_pattern = r'(# ={70,}\n# LOGGING SETUP\n# ={70,})'
    
    match = re.search(logging_section_pattern, content)
    
    if match:
        # Insert BEFORE logging setup
        insertion_point = match.start()
        content = content[:insertion_point] + complete_transport_code + '\n' + content[insertion_point:]
        print("[INFO] Inserted transport code before logging setup")
    else:
        print("[WARNING] Could not find logging setup, inserting after imports")
        # Fallback: insert after all imports
        import_end_pattern = r'(import uvicorn\n)'
        import_match = re.search(import_end_pattern, content)
        if import_match:
            insertion_point = import_match.end()
            content = content[:insertion_point] + complete_transport_code + '\n' + content[insertion_point:]
            print("[INFO] Inserted transport code after imports")
        else:
            print("[ERROR] Could not find safe insertion point!")
            return False
    
    # Write back
    server_file.write_text(content, encoding='utf-8')
    print("[INFO] File written successfully")
    
    # Verify
    print("\n[VERIFY] Checking file syntax...")
    import subprocess
    result = subprocess.run(['python', '-m', 'py_compile', 'codette_server_unified.py'],
                          capture_output=True, text=True)
    
    if result.returncode == 0:
        print("[SUCCESS] ? File compiles successfully!")
    else:
        print(f"[ERROR] Compilation failed:\n{result.stderr}")
        return False
    
    print("\n" + "="*70)
    print("FIX COMPLETE")
    print("="*70)
    print("\n[NEXT STEPS]")
    print("1. Start the server: python codette_server_unified.py")
    print("2. Test transport endpoints:")
    print("   curl -X POST http://localhost:8000/transport/play")
    print("   curl -X POST http://localhost:8000/transport/stop")
    print("   curl http://localhost:8000/transport/status")
    print("\nExpected: All endpoints should return 200 OK")
    print("="*70)
    
    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
