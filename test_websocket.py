#!/usr/bin/env python
"""
WebSocket Test Client for Codette Server
Tests all WebSocket message types
"""

import asyncio
import websockets
import json
import sys

# Configuration
WS_URL = "ws://localhost:8000/ws"
TIMEOUT = 5  # seconds

async def test_websocket():
    """Test WebSocket connection and message handling"""
    
    print("=" * 70)
    print("?? Codette WebSocket Test Client")
    print("=" * 70)
    print(f"Connecting to: {WS_URL}\n")
    
    try:
        # Connect to WebSocket
        async with websockets.connect(WS_URL) as websocket:
            print("? Connected!")
            
            # Test 1: Receive welcome message
            print("\n[TEST 1] Waiting for welcome message...")
            try:
                welcome = await asyncio.wait_for(websocket.recv(), timeout=TIMEOUT)
                welcome_data = json.loads(welcome)
                print(f"? Received: {json.dumps(welcome_data, indent=2)}")
                
                if welcome_data.get("type") != "connection":
                    print("? ERROR: Expected 'connection' type")
                    return False
            except asyncio.TimeoutError:
                print("? ERROR: Timeout waiting for welcome message")
                return False
            
            # Test 2: Ping-Pong
            print("\n[TEST 2] Sending ping...")
            await websocket.send(json.dumps({"type": "ping"}))
            
            try:
                pong = await asyncio.wait_for(websocket.recv(), timeout=TIMEOUT)
                pong_data = json.loads(pong)
                print(f"? Received: {json.dumps(pong_data, indent=2)}")
                
                if pong_data.get("type") != "pong":
                    print("? ERROR: Expected 'pong' type")
                    return False
            except asyncio.TimeoutError:
                print("? ERROR: Timeout waiting for pong")
                return False
            
            # Test 3: Status Request
            print("\n[TEST 3] Sending status request...")
            await websocket.send(json.dumps({"type": "status"}))
            
            try:
                status = await asyncio.wait_for(websocket.recv(), timeout=TIMEOUT)
                status_data = json.loads(status)
                print(f"? Received: {json.dumps(status_data, indent=2)}")
                
                if status_data.get("type") != "status_response":
                    print("? ERROR: Expected 'status_response' type")
                    return False
            except asyncio.TimeoutError:
                print("? ERROR: Timeout waiting for status")
                return False
            
            # Test 4: Chat Message
            print("\n[TEST 4] Sending chat message...")
            chat_request = {
                "type": "chat",
                "message": "How should I mix vocals?",
                "perspective": "mix_engineering",
                "daw_context": {
                    "tracks": [],
                    "selected_track": None
                }
            }
            await websocket.send(json.dumps(chat_request))
            
            try:
                chat_response = await asyncio.wait_for(websocket.recv(), timeout=TIMEOUT)
                chat_data = json.loads(chat_response)
                print(f"? Received chat response:")
                print(f"   Response: {chat_data.get('response', 'N/A')}")
                print(f"   Confidence: {chat_data.get('confidence', 'N/A')}")
                print(f"   Source: {chat_data.get('source', 'N/A')}")
                
                if chat_data.get("type") != "chat_response":
                    print("? ERROR: Expected 'chat_response' type")
                    return False
            except asyncio.TimeoutError:
                print("? ERROR: Timeout waiting for chat response")
                return False
            
            # Test 5: Audio Analysis
            print("\n[TEST 5] Sending analysis request...")
            analysis_request = {
                "type": "analyze",
                "track_data": {
                    "track_id": "track_001",
                    "track_name": "Lead Vocal",
                    "track_type": "vocal"
                },
                "audio_data": {
                    "peak_level": -6.0,
                    "rms_level": -18.0
                },
                "analysis_type": "spectrum"
            }
            await websocket.send(json.dumps(analysis_request))
            
            try:
                analysis_response = await asyncio.wait_for(websocket.recv(), timeout=TIMEOUT)
                analysis_data = json.loads(analysis_response)
                print(f"? Received analysis response:")
                print(f"   Track ID: {analysis_data.get('trackId', 'N/A')}")
                print(f"   Status: {analysis_data.get('status', 'N/A')}")
                if 'analysis' in analysis_data:
                    print(f"   Quality Score: {analysis_data['analysis'].get('quality_score', 'N/A')}")
                
                if analysis_data.get("type") != "analysis_response":
                    print("? ERROR: Expected 'analysis_response' type")
                    return False
            except asyncio.TimeoutError:
                print("? ERROR: Timeout waiting for analysis response")
                return False
            
            # Test 6: Invalid Message Type
            print("\n[TEST 6] Sending invalid message type...")
            await websocket.send(json.dumps({"type": "invalid_test"}))
            
            try:
                error_response = await asyncio.wait_for(websocket.recv(), timeout=TIMEOUT)
                error_data = json.loads(error_response)
                print(f"? Received error response:")
                print(f"   Message: {error_data.get('message', 'N/A')}")
                
                if error_data.get("type") != "error":
                    print("? ERROR: Expected 'error' type")
                    return False
            except asyncio.TimeoutError:
                print("? ERROR: Timeout waiting for error response")
                return False
            
            print("\n" + "=" * 70)
            print("? All tests passed!")
            print("=" * 70)
            return True
            
    except websockets.exceptions.WebSocketException as e:
        print(f"? WebSocket error: {e}")
        return False
    except ConnectionRefusedError:
        print("? Connection refused. Is the server running on port 8000?")
        print("   Start server with: python codette_server_unified.py")
        return False
    except Exception as e:
        print(f"? Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_connection_only():
    """Quick test to just check if WebSocket connects"""
    print("Testing WebSocket connection...")
    try:
        async with websockets.connect(WS_URL, timeout=3) as websocket:
            welcome = await asyncio.wait_for(websocket.recv(), timeout=3)
            print("? WebSocket is working!")
            print(f"Welcome message: {welcome}")
            return True
    except Exception as e:
        print(f"? WebSocket connection failed: {e}")
        return False

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test Codette WebSocket endpoint")
    parser.add_argument(
        "--quick",
        action="store_true",
        help="Quick connection test only"
    )
    
    args = parser.parse_args()
    
    try:
        if args.quick:
            success = asyncio.run(test_connection_only())
        else:
            success = asyncio.run(test_websocket())
        
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\n\n?? Test interrupted by user")
        sys.exit(1)

if __name__ == "__main__":
    main()
