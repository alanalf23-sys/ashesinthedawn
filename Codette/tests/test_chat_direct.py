#!/usr/bin/env python3
"""Test the chat endpoint directly"""

import sys
sys.path.insert(0, '.')

# Import and test
try:
    from codette_server_unified import chat_endpoint, ChatRequest
    import asyncio
    
    # Create a test request
    request = ChatRequest(
        message="hi",
        perspective="mix_engineering"
    )
    
    # Run the endpoint
    result = asyncio.run(chat_endpoint(request))
    
    print("✅ Chat endpoint executed successfully")
    print(f"Response type: {type(result)}")
    print(f"Response: {result.response[:100]}...")
    print(f"Perspective: {result.perspective}")
    print(f"Confidence: {result.confidence}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
