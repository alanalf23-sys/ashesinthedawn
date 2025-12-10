#!/usr/bin/env python3
"""
Script to add the missing ear_training function to codette_server_unified.py
This function was being called but not defined, causing a NameError.
"""

import sys

# The function to add
ear_training_function = '''
async def ear_training(exercise_type: str = "interval", difficulty: str = "beginner") -> Dict[str, Any]:
    """
    Generate ear training exercises for music production
    
    Args:
        exercise_type: Type of exercise (interval, chord, rhythm)
        difficulty: Difficulty level (beginner, intermediate, advanced)
        
    Returns:
        Quiz items with exercise data
    """
    try:
        # Interval exercises
        intervals = {
            "beginner": [
                {"name": "Perfect Unison", "semitones": 0, "example": "C to C"},
                {"name": "Perfect Fifth", "semitones": 7, "example": "C to G"},
                {"name": "Perfect Octave", "semitones": 12, "example": "C to C (octave)"},
            ],
            "intermediate": [
                {"name": "Major Third", "semitones": 4, "example": "C to E"},
                {"name": "Minor Third", "semitones": 3, "example": "C to Eb"},
                {"name": "Perfect Fourth", "semitones": 5, "example": "C to F"},
                {"name": "Major Sixth", "semitones": 9, "example": "C to A"},
            ],
            "advanced": [
                {"name": "Minor Second", "semitones": 1, "example": "C to Db"},
                {"name": "Major Second", "semitones": 2, "example": "C to D"},
                {"name": "Tritone", "semitones": 6, "example": "C to F#"},
                {"name": "Minor Seventh", "semitones": 10, "example": "C to Bb"},
                {"name": "Major Seventh", "semitones": 11, "example": "C to B"},
            ]
        }
        
        # Chord exercises
        chords = {
            "beginner": [
                {"name": "Major Triad", "notes": ["C", "E", "G"], "quality": "major"},
                {"name": "Minor Triad", "notes": ["C", "Eb", "G"], "quality": "minor"},
            ],
            "intermediate": [
                {"name": "Dominant 7th", "notes": ["C", "E", "G", "Bb"], "quality": "dominant"},
                {"name": "Minor 7th", "notes": ["C", "Eb", "G", "Bb"], "quality": "minor7"},
            ],
            "advanced": [
                {"name": "Major 9th", "notes": ["C", "E", "G", "B", "D"], "quality": "major9"},
                {"name": "Altered Dominant", "notes": ["C", "E", "Gb", "Bb"], "quality": "altered"},
            ]
        }
        
        # Rhythm exercises
        rhythms = {
            "beginner": [
                {"name": "Quarter Notes", "pattern": "1-2-3-4", "subdivision": 4},
                {"name": "Eighth Notes", "pattern": "1&2&3&4&", "subdivision": 8},
            ],
            "intermediate": [
                {"name": "Syncopation", "pattern": "1-&-3-&-", "subdivision": 8},
                {"name": "Triplets", "pattern": "1-trip-let-2-trip-let", "subdivision": 12},
            ],
            "advanced": [
                {"name": "Polyrhythm 3:2", "pattern": "3 over 2", "subdivision": 6},
                {"name": "Complex Syncopation", "pattern": "1-&a-3&-", "subdivision": 16},
            ]
        }
        
        # Select appropriate exercise set
        if exercise_type == "interval":
            items = intervals.get(difficulty, intervals["beginner"])
        elif exercise_type == "chord":
            items = chords.get(difficulty, chords["beginner"])
        elif exercise_type == "rhythm":
            items = rhythms.get(difficulty, rhythms["beginner"])
        else:
            items = intervals.get(difficulty, intervals["beginner"])
        
        # Add IDs and completed status
        for i, item in enumerate(items):
            item["id"] = f"{exercise_type}_{difficulty}_{i}"
            item["completed"] = False
        
        # Generate instructions based on exercise type
        instructions = {
            "interval": "Listen to each interval and identify the distance between notes. Use reference songs to help!",
            "chord": "Listen to each chord and identify its quality. Focus on the overall sound and mood.",
            "rhythm": "Tap or clap each rhythm pattern. Keep steady tempo and focus on accuracy."
        }.get(exercise_type, "Listen and identify each musical element.")
        
        return {
            "success": True,
            "exercise_type": exercise_type,
            "difficulty": difficulty,
            "quiz_items": items,
            "instructions": instructions,
            "total_exercises": len(items),
            "timestamp": get_timestamp()
        }
        
    except Exception as e:
        logger.error(f"[Ear Training] Error: {e}")
        return {
            "success": False,
            "error": str(e),
            "exercise_type": exercise_type,
            "difficulty": difficulty,
            "quiz_items": [],
            "instructions": "",
            "total_exercises": 0
        }


'''

def main():
    # Read the file
    with open('codette_server_unified.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find where to insert (after instrument_info function)
    insert_marker = "async def production_checklist(stage: str) -> Dict[str, Any]:"
    
    if insert_marker not in content:
        print("ERROR: Could not find insertion point")
        return 1
    
    # Insert the function before production_checklist
    parts = content.split(insert_marker)
    new_content = parts[0] + ear_training_function + insert_marker + parts[1]
    
    # Write back
    with open('codette_server_unified.py', 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("✅ Successfully added ear_training function!")
    print("   Location: Before production_checklist() function")
    print("   Lines added: ~85")
    return 0

if __name__ == '__main__':
    sys.exit(main())
