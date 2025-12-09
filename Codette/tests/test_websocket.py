#!/usr/bin/env python
"""
Test WebSocket connection to Codette server
"""

import asyncio
import json
import websockets

async def test_websocket():
    """Test WebSocket connection and basic messages"""
    uri = "ws://localhost:8000/ws"
    
    print(f"?? Connecting to {uri}...")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("? Connected!")
            
            # Receive welcome message
            welcome = await websocket.recv()
            print(f"?? Received: {json.loads(welcome)}")
            
            # Send ping
            print("\n?? Sending ping...")
            await websocket.send(json.dumps({"type": "ping"}))
            
            # Receive pong
            pong = await websocket.recv()
            print(f"?? Received: {json.loads(pong)}")
            
            # Send status request
            print("\n?? Sending status request...")
            await websocket.send(json.dumps({"type": "status"}))
            
            # Receive status
            status = await websocket.recv()
            print(f"?? Received: {json.loads(status)}")
            
            # Send chat message
            print("\n?? Sending chat message...")
            await websocket.send(json.dumps({
                "type": "chat",
                "message": "Hello Codette! How should I mix vocals?",
                "perspective": "mix_engineering"
            }))
            
            # Receive chat response
            response = await websocket.recv()
            chat_data = json.loads(response)
            print(f"?? Received chat response:")
            print(f"   Type: {chat_data.get('type')}")
            print(f"   Response: {chat_data.get('response', '')[:100]}...")
            
            print("\n? WebSocket test complete!")
    
    except Exception as e:
        print(f"? WebSocket test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("WebSocket Test for Codette AI Server")
    print("=" * 50)
    asyncio.run(test_websocket())
