#!/usr/bin/env python
"""
Local Codette Model Loader
Loads and manages the local Codette RC-XI trained model from disk
"""

import os
import sys
import logging
import torch
from pathlib import Path
from typing import Optional, Dict, Any, Tuple
from transformers import AutoTokenizer, AutoModelForCausalLM

logger = logging.getLogger(__name__)


class LocalCodetteLoader:
    """Load and manage local Codette RC-XI model"""
    
    def __init__(self):
        """Initialize loader state"""
        self.model = None
        self.tokenizer = None
        self.model_id = None
        self.model_path = None
        self.device = None
        self.is_loaded = False
        self.use_gpu = False
        self.load_time_ms = 0
        
    def get_model_path(self) -> Optional[str]:
        """Get model path from environment or config"""
        # Priority 1: CODETTE_MODEL_ID environment variable
        model_id = os.getenv("CODETTE_MODEL_ID")
        if model_id and os.path.isdir(model_id):
            logger.info(f"[LocalModel] Found CODETTE_MODEL_ID: {model_id}")
            return model_id
        
        # Priority 2: Fallback paths
        fallback_paths = [
            "J:\\ashesinthedawn\\codette_rc_xi_trained",
            Path.home() / ".cache" / "codette_rc_xi_trained",
            Path(__file__).parent / "models" / "codette_rc_xi_trained",
        ]
        
        for path_str in fallback_paths:
            path = Path(path_str)
            if path.exists() and path.is_dir():
                logger.info(f"[LocalModel] Found fallback model path: {path}")
                return str(path)
        
        logger.warning("[LocalModel] No model path found in CODETTE_MODEL_ID or fallback locations")
        return None
    
    def load(self) -> bool:
        """
        Load local Codette model
        
        Returns:
            True if model loaded successfully, False otherwise
        """
        try:
            import time
            start_time = time.time()
            
            # Get model path
            model_path = self.get_model_path()
            if not model_path:
                logger.error("[LocalModel] Cannot load: no valid model path found")
                return False
            
            self.model_path = model_path
            self.model_id = os.path.basename(model_path) or "codette_rc_xi_trained"
            
            logger.info(f"[LocalModel] Loading model from: {model_path}")
            
            # Detect GPU
            self.use_gpu = torch.cuda.is_available()
            self.device = "cuda" if self.use_gpu else "cpu"
            logger.info(f"[LocalModel] Using device: {self.device}")
            
            # Load tokenizer
            logger.info("[LocalModel] Loading tokenizer...")
            self.tokenizer = AutoTokenizer.from_pretrained(model_path)
            
            # Set pad token if not set
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            
            logger.info(f"[LocalModel] Tokenizer loaded (vocab size: {len(self.tokenizer)})")
            
            # Load model
            logger.info("[LocalModel] Loading model weights...")
            self.model = AutoModelForCausalLM.from_pretrained(
                model_path,
                pad_token_id=self.tokenizer.eos_token_id,
                repetition_penalty=1.2,
                torch_dtype=torch.float16 if self.use_gpu else torch.float32,
                device_map="auto" if self.use_gpu else None
            )
            
            # Move to device if CPU
            if not self.use_gpu:
                self.model = self.model.to(self.device)
            
            # Set to evaluation mode
            self.model.eval()
            
            self.is_loaded = True
            self.load_time_ms = int((time.time() - start_time) * 1000)
            
            logger.info(f"[LocalModel] [OK] Model loaded successfully in {self.load_time_ms}ms")
            logger.info(f"[LocalModel] Model: {self.model_id}")
            logger.info(f"[LocalModel] Parameters: {sum(p.numel() for p in self.model.parameters()):,}")
            
            return True
            
        except Exception as e:
            logger.error(f"[LocalModel] [X] Failed to load model: {e}")
            logger.error(f"[LocalModel] Exception type: {type(e).__name__}")
            import traceback
            logger.debug(f"[LocalModel] Traceback: {traceback.format_exc()}")
            return False
    
    def is_available(self) -> bool:
        """Check if model is loaded and available"""
        return self.is_loaded and self.model is not None and self.tokenizer is not None
    
    def generate(
        self,
        prompt: str,
        max_length: int = 200,
        temperature: float = 0.7,
        top_p: float = 0.9,
        num_beams: int = 1
    ) -> str:
        """
        Generate text using local model
        
        Args:
            prompt: Input text prompt
            max_length: Maximum length of generated text
            temperature: Sampling temperature (0-1)
            top_p: Nucleus sampling parameter
            num_beams: Number of beams for beam search (1 = greedy)
            
        Returns:
            Generated text
        """
        if not self.is_available():
            raise RuntimeError("Model not loaded. Call load() first.")
        
        try:
            import time
            start_time = time.time()
            
            # Tokenize input
            inputs = self.tokenizer(prompt, return_tensors="pt").to(self.device)
            
            # Generate
            with torch.no_grad():
                output_ids = self.model.generate(
                    **inputs,
                    max_length=max_length,
                    temperature=temperature,
                    top_p=top_p,
                    num_beams=num_beams,
                    do_sample=True,
                    early_stopping=True,
                    pad_token_id=self.tokenizer.eos_token_id
                )
            
            # Decode
            generated_text = self.tokenizer.decode(output_ids[0], skip_special_tokens=True)
            
            # Remove the prompt from the output
            if generated_text.startswith(prompt):
                generated_text = generated_text[len(prompt):].strip()
            
            elapsed_ms = int((time.time() - start_time) * 1000)
            logger.debug(f"[LocalModel] Generated {len(generated_text)} chars in {elapsed_ms}ms")
            
            return generated_text
            
        except Exception as e:
            logger.error(f"[LocalModel] Generation error: {e}")
            raise
    
    def get_info(self) -> Dict[str, Any]:
        """Get model information"""
        if not self.is_available():
            return {
                "loaded": False,
                "error": "Model not loaded"
            }
        
        return {
            "loaded": True,
            "model_id": self.model_id,
            "model_path": str(self.model_path),
            "device": self.device,
            "use_gpu": self.use_gpu,
            "load_time_ms": self.load_time_ms,
            "vocab_size": len(self.tokenizer),
            "model_parameters": sum(p.numel() for p in self.model.parameters()),
            "model_type": self.model.config.model_type if hasattr(self.model, 'config') else "unknown"
        }


# Global instance
_local_model_instance: Optional[LocalCodetteLoader] = None


def get_local_model() -> LocalCodetteLoader:
    """Get or create global local model instance"""
    global _local_model_instance
    if _local_model_instance is None:
        _local_model_instance = LocalCodetteLoader()
    return _local_model_instance


def load_local_model() -> bool:
    """Load local model globally"""
    model = get_local_model()
    return model.load()


def is_local_model_available() -> bool:
    """Check if local model is available"""
    model = get_local_model()
    return model.is_available()


def generate_with_local_model(
    prompt: str,
    max_length: int = 200,
    temperature: float = 0.7,
    top_p: float = 0.9
) -> str:
    """Generate text using local model"""
    model = get_local_model()
    if not model.is_available():
        raise RuntimeError("Local model not loaded")
    return model.generate(prompt, max_length, temperature, top_p)


if __name__ == "__main__":
    # Test the loader
    logging.basicConfig(level=logging.INFO)
    
    print("Testing Local Codette Model Loader...")
    print("=" * 60)
    
    # Create loader
    loader = LocalCodetteLoader()
    
    # Load model
    print("\n1. Loading model...")
    if loader.load():
        print("   ? Model loaded successfully")
    else:
        print("   ? Failed to load model")
        sys.exit(1)
    
    # Get info
    print("\n2. Model information:")
    info = loader.get_info()
    for key, value in info.items():
        if isinstance(value, int) and value > 1000000:
            print(f"   {key}: {value:,}")
        else:
            print(f"   {key}: {value}")
    
    # Test generation
    print("\n3. Testing generation...")
    test_prompt = "What is gain staging? "
    try:
        output = loader.generate(test_prompt, max_length=100)
        print(f"   Prompt: {test_prompt}")
        print(f"   Response: {output}")
    except Exception as e:
        print(f"   ? Generation error: {e}")
    
    print("\n" + "=" * 60)
    print("Test complete!")
