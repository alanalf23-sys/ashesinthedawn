"""
Interactive chat interface with Codette AI
"""
import sys
import logging
from typing import Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

try:
    from codette_new import Codette
except ImportError:
    logger.error("Could not import Codette from codette_new. Attempting fallback...")
    try:
        from Codette.codette_new import Codette
    except ImportError:
        logger.error("Failed to import Codette. Please ensure codette_new.py is available.")
        sys.exit(1)


class ChatInterface:
    """Interactive chat interface for Codette"""
    
    def __init__(self, user_name: str = "User"):
        """Initialize the chat interface
        
        Args:
            user_name: Name of the user for personalization
        """
        try:
            self.codette = Codette(user_name=user_name)
            self.user_name = user_name
            self.conversation_history = []
            logger.info(f"Chat interface initialized for {user_name}")
        except Exception as e:
            logger.error(f"Failed to initialize Codette: {e}")
            raise
    
    def process_input(self, user_input: str) -> str:
        """Process user input and get Codette response
        
        Args:
            user_input: The user's message
            
        Returns:
            Codette's response
        """
        try:
            response = self.codette.respond(user_input)
            self.conversation_history.append({
                'user': user_input,
                'assistant': response
            })
            return response
        except Exception as e:
            logger.error(f"Error processing input: {e}")
            return f"I encountered an error: {str(e)}"
    
    def display_welcome(self):
        """Display welcome message"""
        print("\n" + "="*60)
        print("🤖 Codette AI Assistant")
        print("="*60)
        print(f"Hello {self.user_name}! I'm Codette, your AI companion.")
        print("Type 'exit' or 'quit' to end the conversation.")
        print("Type 'clear' to reset conversation history.")
        print("Type 'help' for available commands.")
        print("="*60 + "\n")
    
    def display_help(self):
        """Display help information"""
        print("\n" + "-"*40)
        print("Available commands:")
        print("  exit/quit - End the conversation")
        print("  clear     - Reset conversation history")
        print("  help      - Show this help message")
        print("  history   - Show recent messages")
        print("-"*40 + "\n")
    
    def display_history(self, limit: int = 5):
        """Display recent conversation history
        
        Args:
            limit: Number of recent messages to show
        """
        if not self.conversation_history:
            print("\nNo conversation history yet.\n")
            return
        
        print("\n" + "-"*40)
        print("Recent Conversation History:")
        print("-"*40)
        for exchange in self.conversation_history[-limit:]:
            print(f"\nYou: {exchange['user']}")
            print(f"Codette: {exchange['assistant']}")
        print("-"*40 + "\n")
    
    def run(self):
        """Run the interactive chat loop"""
        self.display_welcome()
        
        try:
            while True:
                try:
                    user_input = input(f"\n{self.user_name}: ").strip()
                    
                    if not user_input:
                        continue
                    
                    # Handle special commands
                    if user_input.lower() in ('exit', 'quit'):
                        print("\nCodette: Goodbye! It was great talking with you. 👋\n")
                        break
                    elif user_input.lower() == 'clear':
                        self.conversation_history = []
                        print("Conversation history cleared.")
                        continue
                    elif user_input.lower() == 'help':
                        self.display_help()
                        continue
                    elif user_input.lower() == 'history':
                        self.display_history()
                        continue
                    
                    # Process and display response
                    response = self.process_input(user_input)
                    print(f"\nCodette: {response}")
                    
                except KeyboardInterrupt:
                    print("\n\nCodette: Goodbye! 👋\n")
                    break
                except Exception as e:
                    logger.error(f"Error in chat loop: {e}")
                    print(f"Error: {str(e)}")
                    
        except Exception as e:
            logger.error(f"Fatal error in chat interface: {e}")
            raise


def main():
    """Main entry point"""
    try:
        # Get user name
        user_name = input("Enter your name (or press Enter for 'User'): ").strip()
        if not user_name:
            user_name = "User"
        
        # Initialize and run chat interface
        chat = ChatInterface(user_name=user_name)
        chat.run()
        
    except KeyboardInterrupt:
        print("\n\nShutting down...")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
