#!/usr/bin/env python
"""
OpenAI Assistant Configuration Update Script
============================================

This script updates the Codette AI Assistant with optimized instructions
and configuration for best performance and cost efficiency.

Usage:
    python update_assistant_config.py

Requirements:
    - OPENAI_API_KEY environment variable set
    - OpenAI Python library installed (pip install openai)
"""

import os
from pathlib import Path
from openai import OpenAI

# Load environment variables
try:
    from dotenv import load_dotenv
    env_file = Path(__file__).parent / '.env'
    if env_file.exists():
        load_dotenv(env_file)
except ImportError:
    pass

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ASSISTANT_ID = os.getenv("OPENAI_ASSISTANT_ID", "asst_qOBjSkFUAGVJgglhcnauiUZJ")

# Optimized Assistant Instructions
ASSISTANT_INSTRUCTIONS = """You are Codette, an expert DAW (Digital Audio Workstation) mixing and production assistant integrated into CoreLogic Studio.

## Core Expertise
- Audio mixing and mastering techniques
- EQ, compression, and dynamics processing
- Spatial effects (reverb, delay, modulation)
- Track routing and gain staging
- Genre-specific production techniques
- Real-time mixing analysis and suggestions

## Response Guidelines
1. **Be Concise**: Provide specific, actionable advice without unnecessary preamble
2. **Use Technical Terms**: Users are producers/engineers familiar with audio terminology
3. **Cite Specific Values**: Give exact dB levels, frequency ranges, ratios, and timing values
4. **Context-Aware**: When DAW context is provided, tailor advice to the specific track/project
5. **Prioritize Practical**: Focus on what will make the most audible improvement first

## Response Format
When giving mixing advice, structure as:
- **Issue/Goal**: What we're addressing
- **Approach**: Specific technique and parameters
- **Why**: Brief technical reasoning
- **Next Steps**: If applicable

## Function Calling
You have access to the `generate_intelligent_mixing_suggestions` function. Use it when:
- User asks for specific track processing advice
- Context includes track type and genre information
- Real-time analysis would provide better recommendations than general knowledge

## Key Production Principles (Reference Only - Don't Repeat Unless Asked)
- Gain staging: Peaks at -12dB to -6dB for tracking, -6dB for mix bus
- High-pass everything except bass/kick (typically 80-100Hz)
- EQ before compression (surgical cuts) and after (tonal shaping)
- Compression ratios: 2-4:1 for vocals, 4-8:1 for drums, 10:1+ for limiting
- Reverb pre-delay: 10-30ms for clarity in vocals
- Stereo width: Keep bass/kick centered, width for mids/highs
- Target loudness: -14 LUFS for streaming, -8 to -10 LUFS for club/EDM

## Common User Scenarios
- "How should I mix [instrument]?" ? Give EQ/compression starting points + context questions
- "My mix sounds [problem]" ? Diagnose frequency masking, dynamics, or spatial issues
- "What's the best [effect] for [genre]?" ? Genre-specific techniques with parameters
- Empty/vague questions ? Ask for DAW context (track type, genre, BPM, specific issue)

## Tone
Professional yet approachable. Assume user competence but explain "why" for learning.
"""

# Assistant Configuration
ASSISTANT_CONFIG = {
    "name": "Codette - DAW Mixing Assistant",
    "description": "Expert DAW mixing and production assistant for CoreLogic Studio. Provides real-time mixing advice, EQ/compression recommendations, and genre-specific production techniques.",
    "model": "gpt-4o-2024-08-06",  # Latest model with function calling
    "instructions": ASSISTANT_INSTRUCTIONS,
    "tools": [
        {"type": "code_interpreter"},  # For audio calculations
    ],
    "temperature": 0.7,  # Balanced between creativity and consistency
    "top_p": 0.9,
}


def update_assistant(api_key: str, assistant_id: str, config: dict):
    """Update OpenAI Assistant configuration"""
    
    if not api_key:
        print("? Error: OPENAI_API_KEY not set")
        print("   Set it in .env file or environment variables")
        return False
    
    try:
        client = OpenAI(api_key=api_key)
        
        print(f"?? Connecting to OpenAI API...")
        print(f"?? Updating Assistant: {assistant_id}")
        print()
        
        # Update the assistant
        assistant = client.beta.assistants.update(
            assistant_id=assistant_id,
            **config
        )
        
        print("? Assistant Updated Successfully!")
        print()
        print("?? Configuration:")
        print(f"   • Name: {assistant.name}")
        print(f"   • Model: {assistant.model}")
        print(f"   • Temperature: {config['temperature']}")
        print(f"   • Top P: {config['top_p']}")
        print(f"   • Tools: {', '.join(t['type'] for t in assistant.tools)}")
        print()
        print(f"?? Instructions Updated ({len(assistant.instructions)} chars)")
        print("   Preview (first 200 chars):")
        print(f"   {assistant.instructions[:200]}...")
        print()
        print("?? Next Steps:")
        print("   1. Restart your server: python codette_server_unified.py")
        print("   2. Test the assistant with a mixing question")
        print("   3. Check logs for '[OpenAI Assistant]' entries")
        print()
        print("?? Cost Optimization Tips:")
        print("   • Thread reuse is enabled (saves context costs)")
        print("   • Instructions are now more concise (fewer tokens)")
        print("   • Function calling reduces back-and-forth messages")
        print("   • Consider using temperature=0.5 for even more consistency")
        print()
        
        return True
        
    except Exception as e:
        print(f"? Error updating assistant: {e}")
        print()
        print("?? Troubleshooting:")
        print("   • Check your OPENAI_API_KEY is valid")
        print("   • Verify Assistant ID is correct")
        print(f"   • Current Assistant ID: {assistant_id}")
        print("   • Check OpenAI API status: https://status.openai.com")
        return False


def verify_assistant(api_key: str, assistant_id: str):
    """Verify assistant exists and show current config"""
    
    if not api_key:
        print("? Error: OPENAI_API_KEY not set")
        return False
    
    try:
        client = OpenAI(api_key=api_key)
        assistant = client.beta.assistants.retrieve(assistant_id)
        
        print("?? Current Assistant Configuration:")
        print(f"   • ID: {assistant.id}")
        print(f"   • Name: {assistant.name}")
        print(f"   • Model: {assistant.model}")
        print(f"   • Created: {assistant.created_at}")
        print(f"   • Instructions: {len(assistant.instructions)} characters")
        print()
        return True
        
    except Exception as e:
        print(f"? Error retrieving assistant: {e}")
        return False


if __name__ == "__main__":
    print("=" * 70)
    print("???  Codette AI Assistant Configuration Update")
    print("=" * 70)
    print()
    
    # Verify environment
    if not OPENAI_API_KEY:
        print("? OPENAI_API_KEY not found in environment")
        print("   Please set it in .env file or environment variables")
        exit(1)
    
    print(f"? API Key: {OPENAI_API_KEY[:20]}...{OPENAI_API_KEY[-4:]}")
    print(f"?? Assistant ID: {ASSISTANT_ID}")
    print()
    
    # Show current config
    print("?? Step 1: Verifying Current Configuration")
    print("-" * 70)
    verify_assistant(OPENAI_API_KEY, ASSISTANT_ID)
    
    # Ask for confirmation
    print("??  This will update the assistant's instructions and configuration.")
    response = input("   Continue? (y/n): ").strip().lower()
    
    if response != 'y':
        print("? Update cancelled")
        exit(0)
    
    print()
    print("?? Step 2: Updating Configuration")
    print("-" * 70)
    
    # Update assistant
    success = update_assistant(OPENAI_API_KEY, ASSISTANT_ID, ASSISTANT_CONFIG)
    
    if success:
        print("=" * 70)
        print("? CONFIGURATION UPDATE COMPLETE")
        print("=" * 70)
        exit(0)
    else:
        print("=" * 70)
        print("? CONFIGURATION UPDATE FAILED")
        print("=" * 70)
        exit(1)
