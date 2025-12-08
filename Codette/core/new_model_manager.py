import logging
import os
import torch
from typing import Optional, Tuple, List
from transformers import AutoModelForCausalLM, AutoTokenizer

logger = logging.getLogger(__name__)

class ModelManager:
    def __init__(self):
        """Initialize the model manager."""
        self.current_model = None
        self.current_tokenizer = None
        self.current_model_name = None
        self._last_attempted: List[str] = []
        # Try to load default models on init but don't raise on failure
        try:
            self.load_model()
        except Exception as e:
            logger.warning(f"ModelManager initialization: failed to auto-load default models: {e}")

    def _get_candidate_models(self, preferred: Optional[str] = None) -> List[str]:
        """Return ordered list of candidate model ids/paths to try."""
        candidates = []
        # If caller supplied a preferred model try it first
        if preferred:
            candidates.append(preferred)

        # Include workspace-specific models (local or remote ids)
        # These represent 'our models' used by the project; local folders or hub refs
        workspace_models = [
            "Raiff1982/codette-brawn",      # user fine-tuned model (HF namespace)
            "./models/codette-brawn",       # local fallback folder
            "codette-hybrid",               # placeholder for package-style import
            "Codette/codette_hybrid",       # local repo path style
        ]
        candidates.extend(workspace_models)

        # Public model fallbacks
        public_fallbacks = [
            "mistralai/Mistral-7B-Instruct-v0.2",
            "microsoft/phi-2",
            "gpt2"
        ]
        candidates.extend(public_fallbacks)

        # Deduplicate preserving order
        seen = set()
        unique = []
        for c in candidates:
            if c and c not in seen:
                unique.append(c)
                seen.add(c)
        return unique

    def load_model(self, model_name: Optional[str] = None) -> bool:
        """
        Load the language model, trying different models in order of preference.

        Args:
            model_name: Optional specific model to load

        Returns:
            bool: True if any model was loaded successfully
        """
        candidates = self._get_candidate_models(model_name)
        self._last_attempted = candidates.copy()

        # Decide device and dtype based on environment
        use_cuda = torch.cuda.is_available()
        device_map = "auto" if use_cuda else {"": "cpu"}
        torch_dtype = torch.float16 if use_cuda else torch.float32

        # Check if bitsandbytes is available for 8-bit loading
        use_8bit = False
        try:
            import bitsandbytes as bnb  # type: ignore
            use_8bit = True
        except Exception:
            use_8bit = False

        for model_id in candidates:
            try:
                logger.info(f"Attempting to load model candidate: {model_id}")

                # If candidate looks like a local folder ensure it exists
                if model_id.startswith("./") or os.path.isdir(model_id):
                    if not os.path.exists(model_id):
                        logger.debug(f"Local model path not found, skipping: {model_id}")
                        continue

                # Load tokenizer first (may raise)
                tokenizer = AutoTokenizer.from_pretrained(model_id, use_fast=True)

                load_kwargs = {
                    "device_map": device_map,
                    "torch_dtype": torch_dtype,
                }

                # Add 8-bit if available and supported
                if use_8bit:
                    load_kwargs["load_in_8bit"] = True

                model = AutoModelForCausalLM.from_pretrained(model_id, **load_kwargs)

                # Put model in eval mode and store
                model.eval()
                self.current_model = model
                self.current_tokenizer = tokenizer
                self.current_model_name = model_id

                logger.info(f"Successfully loaded model: {model_id}")
                return True

            except Exception as e:
                logger.warning(f"Failed to load candidate {model_id}: {e}")
                # continue to next candidate
                continue

        logger.error("No candidate models could be loaded.")
        return False

    def get_current_model(self) -> Tuple[Optional[AutoModelForCausalLM], Optional[AutoTokenizer]]:
        """Get currently loaded model and tokenizer."""
        return self.current_model, self.current_tokenizer

    def is_model_loaded(self) -> bool:
        """Check if a model is currently loaded."""
        return self.current_model is not None and self.current_tokenizer is not None

    def list_attempted_models(self) -> List[str]:
        """Return the list of candidate models that were attempted on the last load call."""
        return self._last_attempted.copy()

    def get_current_model_name(self) -> Optional[str]:
        """Return the identifier of the currently loaded model."""
        return self.current_model_name