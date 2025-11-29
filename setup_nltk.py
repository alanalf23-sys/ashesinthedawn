#!/usr/bin/env python
"""Setup NLTK data for Codette"""

import nltk
import sys

print("Setting up NLTK data...")

try:
    # Download required data
    nltk.download('averaged_perceptron_tagger_eng', quiet=False)
    nltk.download('punkt', quiet=False)
    nltk.download('vader_lexicon', quiet=False)
    nltk.download('wordnet', quiet=False)
    nltk.download('omw-1.4', quiet=False)
    
    print("\nNLTK setup completed successfully!")
    sys.exit(0)
except Exception as e:
    print(f"Error during NLTK setup: {e}")
    sys.exit(1)
