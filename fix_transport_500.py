#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Final Fix for Transport Endpoints 500 Errors
The transport endpoints are returning 500 errors because TransportManager
is being initialized before TransportState model is imported.
"""

import re
from pathlib import Path

def fix_transport_manager():
    """Fix TransportManager initialization order"""
    
    server_file = Path("codette_server_unified.py")
    print("="*70)
    print("FIXING TRANSPORT MANAGER 500 ERRORS")
    print("="*70)
    
    content = server_file.read_text(encoding='utf-8')
    
    # Check if the issue exists
    if "class TransportManager" not in content:
        print("\n[INFO] TransportManager class not found - may already be fixed")
        return False
    
    print("\n[INFO] Found TransportManager class")
    
    # Find the TransportManager class definition
    tm_pattern = r'(# ============================================================================\n# TRANSPORT MANAGER CLASS.*?# END TRANSPORT MANAGER CLASS\n# ============================================================================\n)'
    
    tm_match = re.search(tm_pattern, content, re.DOTALL)
    if not tm_match:
        print("[WARNING] Could not find TransportManager section markers")
        return False
    
    tm_code = tm_match.group(1)
    print("[INFO] Extracted TransportManager code")
    
    # Remove the TransportManager class from its current location
    content = content.replace(tm_code, '')
    print("[INFO] Removed from current location")
    
    # Create improved TransportManager code with TransportState defined inside get_state()
    improved_tm = """
# ============================================================================
# TRANSPORT MANAGER & STATE (Fixed initialization order)
# ============================================================================

class TransportState(BaseModel):
    \"\"\"Transport state model\"\"\"
    playing: bool
    time_seconds: float
    sample_pos: int
    bpm: float
    beat_pos: float
    loop_enabled: bool
    loop_start_seconds: float
    loop_end_seconds: float

class TransportManager:
    \"\"\"Manages playback transport state\"\"\"
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
        \"\"\"Get current transport state\"\"\"
        if self.playing and self.start_time:
            import time
            elapsed = time.time() - self.start_time
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
        \"\"\"Start playback\"\"\"
        if not self.playing:
            import time
            self.playing = True
            self.start_time = time.time() - self.time_seconds
            logger.info("[TransportManager] Playback started")
        return self.get_state()
    
    def stop(self) -> TransportState:
        \"\"\"Stop playback and reset\"\"\"
        self.playing = False
        self.time_seconds = 0.0
        self.sample_pos = 0
        self.start_time = None
        logger.info("[TransportManager] Playback stopped")
        return self.get_state()
    
    def pause(self) -> TransportState:
        \"\"\"Pause playback\"\"\"
        if self.playing:
            import time
            self.time_seconds = time.time() - self.start_time
            self.playing = False
            logger.info("[TransportManager] Playback paused")
        return self.get_state()
    
    def resume(self) -> TransportState:
        \"\"\"Resume playback\"\"\"
        if not self.playing:
            import time
            self.playing = True
            self.start_time = time.time() - self.time_seconds
            logger.info("[TransportManager] Playback resumed")
        return self.get_state()

# Initialize transport manager globally
transport_manager = TransportManager()

# ============================================================================
# END TRANSPORT MANAGER & STATE
# ============================================================================
"""
    
    # Find a safe place to insert - after BaseModel import but before app creation
    # Look for the pattern of imports ending
    insert_pattern = r'(from pydantic import BaseModel[^\n]*\n)'
    
    if re.search(insert_pattern, content):
        content = re.sub(
            insert_pattern,
            r'\1\n' + improved_tm,
            content,
            count=1
        )
        print("[INFO] Inserted improved TransportManager after Pydantic imports")
    else:
        print("[WARNING] Could not find safe insertion point")
        return False
    
    # Write back
    server_file.write_text(content, encoding='utf-8')
    print("[INFO] File updated successfully")
    
    return True

def fix_transport_endpoints():
    """Fix transport endpoint error handling"""
    
    server_file = Path("codette_server_unified.py")
    content = server_file.read_text(encoding='utf-8')
    
    print("\n[INFO] Adding better error handling to transport endpoints...")
    
    # Pattern to find transport endpoints
    patterns = [
        (r'(@app\.post\("/transport/play"\)[^}]+)(raise HTTPException)',
         r'\1logger.error(f"Transport play error: {e}")\n        \2'),
        (r'(@app\.post\("/transport/stop"\)[^}]+)(raise HTTPException)',
         r'\1logger.error(f"Transport stop error: {e}")\n        \2'),
        (r'(@app\.post\("/transport/pause"\)[^}]+)(raise HTTPException)',
         r'\1logger.error(f"Transport pause error: {e}")\n        \2'),
    ]
    
    changes = 0
    for pattern, replacement in patterns:
        if re.search(pattern, content, re.DOTALL):
            content = re.sub(pattern, replacement, content, flags=re.DOTALL)
            changes += 1
    
    if changes > 0:
        server_file.write_text(content, encoding='utf-8')
        print(f"[INFO] Enhanced error handling in {changes} transport endpoints")
        return True
    
    return False

def main():
    print("\n")
    
    # Fix 1: TransportManager initialization
    print("FIX 1: TransportManager Initialization Order")
    print("-" * 70)
    tm_fixed = fix_transport_manager()
    
    if tm_fixed:
        print("[SUCCESS] TransportManager fixed")
    else:
        print("[INFO] TransportManager already correct or not found")
    
    # Fix 2: Transport endpoint error handling
    print("\n\nFIX 2: Transport Endpoint Error Handling")
    print("-" * 70)
    endpoints_fixed = fix_transport_endpoints()
    
    if endpoints_fixed:
        print("[SUCCESS] Transport endpoints enhanced")
    else:
        print("[INFO] Transport endpoints already correct")
    
    # Summary
    print("\n" + "="*70)
    print("FINAL FIX SUMMARY")
    print("="*70)
    
    if tm_fixed or endpoints_fixed:
        print("\n[SUCCESS] Applied fixes successfully")
        print("\nThe following issues should now be resolved:")
        print("  1. TransportManager initialization order")
        print("  2. TransportState model availability")
        print("  3. Better error logging in transport endpoints")
        print("\n[NEXT STEPS]")
        print("  1. Restart the server: python codette_server_unified.py")
        print("  2. Run tests: python test_endpoints.py")
        print("  3. Expected results:")
        print("     - /transport/play should return 200")
        print("     - /transport/stop should return 200")
        print("     - /transport/pause should return 200")
    else:
        print("\n[INFO] No changes needed - code appears correct")
    
    print("\n" + "="*70)

if __name__ == "__main__":
    main()
