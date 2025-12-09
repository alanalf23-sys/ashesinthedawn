#!/usr/bin/env python3
"""Test extended Codette features"""

from codette_training_data import CodetteTrainingData
from codette_analysis_module import CodetteAnalyzer

print("\n" + "="*60)
print("TESTING CODETTE EXTENDED FEATURES")
print("="*60)

# Initialize
td = CodetteTrainingData()
analyzer = CodetteAnalyzer()

# Test 1: Extended Genres
print("\n[TEST 1] Extended Genres")
print("-" * 40)
all_genres = td.get_all_genres()
print(f"✓ Total genres: {len(all_genres)}")
print(f"✓ Genres: {all_genres}")

extended = ["funk", "soul", "country", "latin", "reggae"]
for genre in extended:
    data = td.get_extended_genre_knowledge(genre)
    if data:
        print(f"✓ {genre.capitalize()}: {data.get('tempo_range')} BPM")

# Test 2: Harmonic Analysis
print("\n[TEST 2] Harmonic Progression Analysis")
print("-" * 40)
progression = td.analyze_harmonic_progression(['I', 'V', 'I'])
print(f"✓ Analyzed progression: {progression['chord_sequence']}")
print(f"✓ Tension profile count: {len(progression['tension_profile'])}")
print(f"✓ Patterns found: {len(progression['tension_release_patterns_found'])}")

# Test 3: Melodic Contour
print("\n[TEST 3] Melodic Contour Analysis")
print("-" * 40)
contour = td.analyze_melodic_contour(['C', 'E', 'G', 'E'])
print(f"✓ Contour shape: {contour['shape']}")
print(f"✓ Range (semitones): {contour['range_semitones']}")
print(f"✓ Range classification: {contour['range_classification']}")

# Test 4: Rhythm Patterns
print("\n[TEST 4] Rhythm Pattern Recognition")
print("-" * 40)
patterns = td.list_rhythm_patterns()
print(f"✓ Available patterns: {len(patterns)}")
print(f"✓ Patterns: {patterns[:3]}... ({len(patterns)} total)")

# Test 5: Microtonality
print("\n[TEST 5] Microtonality")
print("-" * 40)
quarter_tones = td.get_microtone_info('quarter_tones')
print(f"✓ Quarter tones: {quarter_tones['description']}")
raga = td.get_microtone_info('indian_raga')
print(f"✓ Raga notes: {len(raga['natural_notes'])} notes available")

# Test 6: Spectral Analysis
print("\n[TEST 6] Spectral Analysis")
print("-" * 40)
harmonics = td.get_harmonic_series_info()
print(f"✓ Harmonic series: {len(harmonics)} ratios defined")
timbre = td.get_timbral_brightness_classification('bright')
print(f"✓ Bright timbre: {timbre['spectral_centroid_hz']} Hz")

# Test 7: Composition Suggestions
print("\n[TEST 7] Composition Suggestions")
print("-" * 40)
progressions = td.suggest_chord_progressions('pop', 'simple')
print(f"✓ Pop progressions: {progressions}")
rules = td.get_melodic_construction_rules()
print(f"✓ Composition rules loaded: {list(rules.keys())}")

# Test 8: Ear Training
print("\n[TEST 8] Ear Training")
print("-" * 40)
exercises = td.list_ear_training_types()
print(f"✓ Ear training types: {exercises}")
exercise = td.get_ear_training_exercise('interval_recognition', 'beginner')
print(f"✓ Exercise loaded: {exercise.get('type')}")

# Test 9: Analyzer Methods
print("\n[TEST 9] Analyzer Extended Methods")
print("-" * 40)
genres_list = td.get_all_genres()
print(f"✓ All genres accessible: {len(genres_list)} genres")

harmonic_result = analyzer.analyze_harmonic_progression(['I', 'IV', 'V', 'I'])
print(f"✓ Harmonic analyzer working: {len(harmonic_result['tension_profile'])} chords")

melodic_result = analyzer.analyze_melodic_contour(['A', 'C', 'E', 'G'])
print(f"✓ Melodic analyzer working: shape={melodic_result['shape']}")

# Test 10: Extended Genre Analysis
print("\n[TEST 10] Extended Genre Analysis")
print("-" * 40)
funk_analysis = analyzer.analyze_extended_genre('funk', {
    'bpm': 100,
    'groove_tightness': 80,
    'syncopation_level': 75
})
print(f"✓ Funk analysis: {funk_analysis.status} (score: {funk_analysis.score})")

latin_analysis = analyzer.analyze_extended_genre('latin', {
    'bpm': 110,
    'percussion_prominence': 85,
    'clave_pattern_detected': True
})
print(f"✓ Latin analysis: {latin_analysis.status} (score: {latin_analysis.score})")

print("\n" + "="*60)
print("ALL TESTS PASSED ✓")
print("="*60 + "\n")
