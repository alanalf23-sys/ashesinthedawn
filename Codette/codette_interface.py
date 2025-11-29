# -*- coding: utf-8 -*-
"""
Unified Codette Interface
Provides clean API for accessing Codette AI with multiple backends
"""
import logging
from datetime import datetime
import json
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import the core Codette
try:
    from codette_new import Codette
    CODETTE_AVAILABLE = True
except ImportError as e:
    logger.error(f"Could not import Codette: {e}")
    CODETTE_AVAILABLE = False
    Codette = None


class CodetteInterface:
    """Clean interface to Codette AI"""
    
    def __init__(self, user_name: str = "User"):
        """
        Initialize Codette Interface
        
        Args:
            user_name: Name of the user interacting with Codette
        """
        self.user_name = user_name
        self.response_memory = []
        self.last_interaction = None
        
        # Load configuration
        self.config = self._load_config()
        
        # Initialize Codette core
        if CODETTE_AVAILABLE:
            try:
                self.codette = Codette(user_name=user_name)
                logger.info(f"[OK] Codette AI initialized for user: {user_name}")
            except Exception as e:
                logger.error(f"[ERROR] Failed to initialize Codette: {e}")
                self.codette = None
        else:
            self.codette = None

    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from file or use defaults"""
        try:
            with open('config.json', 'r') as f:
                config = json.load(f)
                logger.info("[OK] Configuration loaded from config.json")
                return config
        except FileNotFoundError:
            logger.warning("[!] config.json not found, using defaults")
            return self._default_config()
        except Exception as e:
            logger.error(f"[ERROR] Error loading config: {e}")
            return self._default_config()

    @staticmethod
    def _default_config() -> Dict[str, Any]:
        """Return default configuration"""
        return {
            "host": "127.0.0.1",
            "port": 8000,
            "enable_quantum": True,
            "enable_memory": True,
            "perspectives": ["Newton", "DaVinci", "Ethical", "Quantum", "Memory"],
            "max_history": 1000,
            "response_timeout": 30
        }

    def process_message(self, message: str) -> Dict[str, Any]:
        """
        Process a message through Codette
        
        Args:
            message: User input message
            
        Returns:
            Dict with response, timestamp, and metadata
        """
        if not CODETTE_AVAILABLE or self.codette is None:
            return {
                "status": "error",
                "message": "Codette AI is not initialized",
                "error": "CODETTE_UNAVAILABLE"
            }

        try:
            timestamp = datetime.now().strftime("%H:%M:%S")
            
            # Process through Codette
            # Note: codette_new.respond() returns a string, not a dict
            result = self.codette.respond(message)
            
            # Extract response text
            if isinstance(result, dict):
                response_text = result.get("response", str(result))
            else:
                # result is a string
                response_text = str(result)
            
            # Store in memory
            self.response_memory.append({
                "query": message,
                "response": response_text,
                "timestamp": timestamp
            })
            
            # Keep memory under control
            if len(self.response_memory) > self.config.get("max_history", 1000):
                self.response_memory.pop(0)
            
            # Return structured response
            return {
                "status": "success",
                "response": response_text,
                "timestamp": timestamp,
                "metrics": {},
                "insights": [],
                "memory_size": len(self.response_memory)
            }
            
        except Exception as e:
            logger.error(f"[ERROR] Error processing message: {e}")
            return {
                "status": "error",
                "message": f"Error processing request: {str(e)}",
                "error": type(e).__name__,
                "timestamp": datetime.now().strftime("%H:%M:%S")
            }

    def get_system_state(self) -> Dict[str, Any]:
        """Get current system state"""
        if not CODETTE_AVAILABLE or self.codette is None:
            return {
                "status": "unavailable",
                "codette_available": False,
                "memory_size": 0
            }

        try:
            return {
                "status": "active",
                "codette_available": True,
                "memory_size": len(self.response_memory),
                "user": self.user_name,
                "timestamp": datetime.now().strftime("%H:%M:%S"),
                "config": {
                    "host": self.config.get("host"),
                    "port": self.config.get("port"),
                    "quantum_enabled": self.config.get("enable_quantum", True),
                    "memory_enabled": self.config.get("enable_memory", True)
                }
            }
        except Exception as e:
            logger.error(f"[ERROR] Error getting system state: {e}")
            return {
                "status": "error",
                "error": str(e)
            }

    def clear_memory(self) -> Dict[str, Any]:
        """Clear response memory"""
        old_size = len(self.response_memory)
        self.response_memory = []
        return {
            "status": "success",
            "cleared_items": old_size,
            "message": f"Cleared {old_size} items from memory"
        }

    def get_memory(self) -> list:
        """Get all stored interactions"""
        return self.response_memory.copy()

    def get_memory_summary(self) -> Dict[str, Any]:
        """Get summary statistics about memory"""
        if not self.response_memory:
            return {
                "total_interactions": 0,
                "message": "No interactions recorded yet"
            }

        return {
            "total_interactions": len(self.response_memory),
            "first_interaction": self.response_memory[0]["timestamp"],
            "last_interaction": self.response_memory[-1]["timestamp"],
            "memory_capacity": self.config.get("max_history", 1000)
        }


# Convenience functions
_interface_instance: Optional[CodetteInterface] = None


def get_interface(user_name: str = "User") -> CodetteInterface:
    """Get or create singleton interface instance"""
    global _interface_instance
    if _interface_instance is None:
        _interface_instance = CodetteInterface(user_name=user_name)
    return _interface_instance


def reset_interface() -> None:
    """Reset the singleton interface instance"""
    global _interface_instance
    _interface_instance = None


# For FastAPI integration
def create_fastapi_interface():
    """Create FastAPI app that uses Codette"""
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
    
    app = FastAPI(
        title="Codette AI Interface",
        description="API for interacting with Codette AI",
        version="1.0.0"
    )
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"]
    )
    
    # Create interface
    interface = get_interface()
    
    class MessageRequest(BaseModel):
        message: str
        user_name: Optional[str] = None
    
    @app.get("/health")
    async def health_check():
        return {"status": "ok", "service": "codette-interface"}
    
    @app.get("/state")
    async def get_state():
        return interface.get_system_state()
    
    @app.post("/chat")
    async def chat(request: MessageRequest):
        return interface.process_message(request.message)
    
    @app.get("/memory")
    async def get_memory():
        return {"memory": interface.get_memory_summary()}
    
    @app.post("/clear-memory")
    async def clear_memory():
        return interface.clear_memory()
    
    return app


if __name__ == "__main__":
    # Test the interface
    interface = CodetteInterface("TestUser")
    print("\n[*] Testing Codette Interface")
    print("[*] System State:", interface.get_system_state())
    
    if interface.codette is not None:
        print("\n[*] Testing message processing...")
        result = interface.process_message("Hello Codette, what is 2+2?")
        print(f"[+] Response: {result['response']}")
        print(f"[+] Memory size: {result['memory_size']}")
    else:
        print("[!] Codette not available - interface in limited mode")
