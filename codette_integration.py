#!/usr/bin/env python
"""
Codette Server Integration - Local Model with OpenAI Fallback
Manages the query flow: Local Model -> OpenAI Assistant -> Local Codette Engine -> Fallback
"""

import logging
from typing import Optional, Dict, Any
from codette_local_loader import get_local_model, is_local_model_available

logger = logging.getLogger(__name__)


class CodetteLMIntegration:
    """Integration layer for local model and fallback engines"""
    
    def __init__(self):
        """Initialize integration"""
        self.local_model = get_local_model()
        self.local_model_available = False
        self.openai_available = False
        self.codette_engine = None
        
    def initialize(self, openai_available: bool = False, codette_engine: Optional[Any] = None):
        """
        Initialize integration with available engines
        
        Args:
            openai_available: Whether OpenAI fallback is available
            codette_engine: Codette AI engine (local or hybrid)
        """
        self.openai_available = openai_available
        self.codette_engine = codette_engine
        self.local_model_available = is_local_model_available()
        
        logger.info("[Integration] Codette LM Integration initialized")
        logger.info(f"[Integration] Local model available: {self.local_model_available}")
        logger.info(f"[Integration] OpenAI fallback available: {openai_available}")
        logger.info(f"[Integration] Codette engine available: {codette_engine is not None}")
    
    def get_model_status(self) -> Dict[str, Any]:
        """Get status of all available models"""
        return {
            "local_model": {
                "available": self.local_model_available,
                "info": self.local_model.get_info() if self.local_model_available else None
            },
            "openai_assistant": {
                "available": self.openai_available
            },
            "codette_engine": {
                "available": self.codette_engine is not None
            }
        }
    
    async def query_with_local_model(
        self,
        message: str,
        max_length: int = 200,
        temperature: float = 0.7
    ) -> Optional[str]:
        """
        Query local model
        
        Args:
            message: User message
            max_length: Max response length
            temperature: Generation temperature
            
        Returns:
            Generated response or None if unavailable
        """
        if not self.local_model_available:
            logger.debug("[Integration] Local model not available")
            return None
        
        try:
            logger.info(f"[Integration] Querying local model: {message[:50]}...")
            response = self.local_model.generate(message, max_length, temperature)
            logger.info(f"[Integration] Local model response: {len(response)} chars")
            return response
        except Exception as e:
            logger.error(f"[Integration] Local model query failed: {e}")
            return None
    
    async def query_with_codette_engine(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Optional[str]:
        """
        Query local Codette engine
        
        Args:
            message: User message
            context: Optional DAW context
            
        Returns:
            Response or None if unavailable
        """
        if self.codette_engine is None:
            logger.debug("[Integration] Codette engine not available")
            return None
        
        try:
            logger.info(f"[Integration] Querying Codette engine: {message[:50]}...")
            if context and hasattr(self.codette_engine, 'respond'):
                response = self.codette_engine.respond(message, context)
            elif hasattr(self.codette_engine, 'respond'):
                response = self.codette_engine.respond(message)
            else:
                logger.warning("[Integration] Codette engine doesn't have respond method")
                return None
            
            logger.info(f"[Integration] Codette engine response: {len(response)} chars")
            return response
        except Exception as e:
            logger.error(f"[Integration] Codette engine query failed: {e}")
            return None
    
    async def query_integrated(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        max_length: int = 200,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """
        Query integrated system with fallback chain
        
        Priority:
        1. Local Codette RC-XI Model (primary)
        2. Codette Engine (fallback 1)
        3. OpenAI (fallback 2 - via caller)
        
        Args:
            message: User message
            context: Optional DAW context
            max_length: Max response length
            temperature: Generation temperature
            
        Returns:
            Response dict with response, source, and status
        """
        logger.info(f"[Integration] Querying integrated system: {message[:50]}...")
        
        # Try 1: Local Model (PRIMARY)
        if self.local_model_available:
            logger.info("[Integration] Trying local model (priority 1)...")
            response = await self.query_with_local_model(message, max_length, temperature)
            if response:
                return {
                    "response": response,
                    "source": "local_model",
                    "model_id": self.local_model.model_id,
                    "confidence": 0.95,
                    "priority": 1
                }
        
        # Try 2: Codette Engine (FALLBACK 1)
        if self.codette_engine:
            logger.info("[Integration] Trying Codette engine (priority 2)...")
            response = await self.query_with_codette_engine(message, context)
            if response:
                return {
                    "response": response,
                    "source": "codette_engine",
                    "confidence": 0.85,
                    "priority": 2
                }
        
        # Fallback 3: Return indicator that fallback chain exhausted
        logger.warning("[Integration] All local engines exhausted, need OpenAI")
        return {
            "response": None,
            "source": "none",
            "confidence": 0.0,
            "priority": 999,
            "error": "No local models available, use OpenAI fallback"
        }


# Global integration instance
_integration_instance: Optional[CodetteLMIntegration] = None


def get_integration() -> CodetteLMIntegration:
    """Get or create global integration instance"""
    global _integration_instance
    if _integration_instance is None:
        _integration_instance = CodetteLMIntegration()
    return _integration_instance


def initialize_integration(openai_available: bool = False, codette_engine: Optional[Any] = None):
    """Initialize global integration"""
    integration = get_integration()
    integration.initialize(openai_available, codette_engine)


async def query_codette(
    message: str,
    context: Optional[Dict[str, Any]] = None,
    max_length: int = 200,
    temperature: float = 0.7
) -> Dict[str, Any]:
    """Query Codette integrated system"""
    integration = get_integration()
    return await integration.query_integrated(message, context, max_length, temperature)
