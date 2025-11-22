"""
WebSocket Transport Clock - Testing Guide

Quick tests to verify the transport clock is working correctly.
Run these immediately after starting the server.
"""

# Test 1: REST API Status Check (Run in another terminal)
# ========================================================
# curl http://localhost:8000/transport/status
#
# Expected output:
# {
#   "playing": false,
#   "sample_pos": 0,
#   "time_seconds": 0.0,
#   "time_formatted": "00:00.000",
#   "bpm": 120.0,
#   "beat_pos": 0.0,
#   "timestamp_ms": 1700641234567.0
# }

# Test 2: REST API Metrics
# ========================
# curl http://localhost:8000/transport/metrics
#
# Expected output:
# {
#   "sample_rate": 48000,
#   "block_size": 512,
#   "bpm": 120.0,
#   "playing": false,
#   "connected_clients": 0,
#   "updates_sent": 0,
#   "actual_fps": 0.0
# }

# Test 3: Start Playback (REST)
# ============================
# curl -X POST http://localhost:8000/transport/play
#
# Then check status:
# curl http://localhost:8000/transport/status
# "playing" should now be true

# Test 4: WebSocket Connection (Python)
# ======================================

import asyncio
import websockets
import json


async def test_websocket():
    """Connect to WebSocket and receive updates."""
    uri = "ws://localhost:8000/ws/transport/clock"

    print("Connecting to WebSocket...")
    async with websockets.connect(uri) as ws:
        print(f"Connected to {uri}")
        print("Receiving updates (Ctrl+C to stop)...\n")

        try:
            for i in range(10):  # Receive 10 updates
                state_json = await ws.recv()
                state = json.loads(state_json)

                print(f"Update {i+1}:")
                print(f"  Time: {state['time_formatted']}")
                print(f"  Playing: {state['playing']}")
                print(f"  BPM: {state['bpm']}")
                print(f"  Beat: {state['beat_pos']:.1f}")
                print()

        except KeyboardInterrupt:
            print("Stopped.")


# Test 5: WebSocket Control Commands (Python)
# =============================================

async def test_control():
    """Send control commands via WebSocket."""
    uri = "ws://localhost:8000/ws/transport/control"

    print("Connecting to control WebSocket...")
    async with websockets.connect(uri) as ws:
        print(f"Connected to {uri}\n")

        # Send play command
        print("Sending play command...")
        await ws.send(json.dumps({"command": "play"}))
        response = json.loads(await ws.recv())
        print(f"Response: {response}\n")

        # Wait a moment
        await asyncio.sleep(2)

        # Send seek command
        print("Sending seek command (10 seconds)...")
        await ws.send(json.dumps({"command": "seek", "value": 10.0}))
        response = json.loads(await ws.recv())
        print(f"Response: {response}\n")

        # Send tempo command
        print("Sending tempo command (140 BPM)...")
        await ws.send(json.dumps({"command": "tempo", "value": 140.0}))
        response = json.loads(await ws.recv())
        print(f"Response: {response}\n")

        # Send stop command
        print("Sending stop command...")
        await ws.send(json.dumps({"command": "stop"}))
        response = json.loads(await ws.recv())
        print(f"Response: {response}\n")


# Test 6: Multiple Concurrent Clients
# ====================================

async def client(client_id: int, duration: int = 5):
    """Simulate a client receiving updates."""
    uri = "ws://localhost:8000/ws/transport/clock"

    try:
        async with websockets.connect(uri) as ws:
            print(f"Client {client_id} connected")

            for _ in range(duration):
                state_json = await ws.recv()
                state = json.loads(state_json)
                print(f"Client {client_id}: {state['time_formatted']} "
                      f"- Beat: {state['beat_pos']:.1f}")

            print(f"Client {client_id} done")

    except Exception as e:
        print(f"Client {client_id} error: {e}")


async def test_multiple_clients():
    """Test multiple concurrent clients."""
    print("Starting 5 concurrent clients...\n")

    clients = [client(i, duration=10) for i in range(5)]
    await asyncio.gather(*clients)

    print("\nAll clients finished")


# Test 7: Integration Test (Full Flow)
# =====================================

async def test_full_flow():
    """Complete integration test."""
    print("=" * 70)
    print("FULL INTEGRATION TEST")
    print("=" * 70 + "\n")

    # Start client
    async def receiver():
        uri = "ws://localhost:8000/ws/transport/clock"
        async with websockets.connect(uri) as ws:
            print("Client: Connected to transport clock\n")

            for i in range(20):
                state_json = await ws.recv()
                state = json.loads(state_json)

                status_icon = "▶️ " if state['playing'] else "⏸️ "
                print(f"{status_icon} {state['time_formatted']} | "
                      f"BPM: {state['bpm']:.0f} | "
                      f"Beat: {state['beat_pos']:5.1f}")

    await receiver()


# Test 8: Performance Monitoring
# ==============================

async def test_performance():
    """Monitor actual update frequency and latency."""
    uri = "ws://localhost:8000/ws/transport/clock"

    print("Monitoring performance for 30 seconds...\n")

    times = []
    async with websockets.connect(uri) as ws:
        for _ in range(30 * 30):  # 30 seconds at 30 Hz
            start = asyncio.get_event_loop().time()
            await ws.recv()  # Receive but don't store
            latency = (asyncio.get_event_loop().time() - start) * 1000
            times.append(latency)

            if len(times) % 30 == 0:
                avg_latency = sum(times[-30:]) / 30
                print(f"Last 30 updates: Avg latency {avg_latency:.2f}ms")

    print("\nPerformance Summary:")
    print(f"  Total updates: {len(times)}")
    print(f"  Avg latency: {sum(times)/len(times):.2f}ms")
    print(f"  Min latency: {min(times):.2f}ms")
    print(f"  Max latency: {max(times):.2f}ms")


# Main Test Runner
# ================

if __name__ == "__main__":
    import sys

    print("\n" + "=" * 70)
    print("WebSocket Transport Clock - Test Suite")
    print("=" * 70 + "\n")

    print("Available tests:")
    print("  1. WebSocket basic connection")
    print("  2. WebSocket control commands")
    print("  3. Multiple concurrent clients")
    print("  4. Full integration flow")
    print("  5. Performance monitoring")
    print("\nRun REST API tests in another terminal:")
    print("  curl http://localhost:8000/transport/status")
    print("  curl http://localhost:8000/transport/metrics")
    print("  curl -X POST http://localhost:8000/transport/play")
    print("\n" + "-" * 70 + "\n")

    if len(sys.argv) < 2:
        print("Usage: python test_transport_clock.py <test_number>")
        print("\nExample: python test_transport_clock.py 1")
        sys.exit(1)

    test_num = int(sys.argv[1])

    try:
        if test_num == 1:
            asyncio.run(test_websocket())
        elif test_num == 2:
            asyncio.run(test_control())
        elif test_num == 3:
            asyncio.run(test_multiple_clients())
        elif test_num == 4:
            asyncio.run(test_full_flow())
        elif test_num == 5:
            asyncio.run(test_performance())
        else:
            print(f"Unknown test: {test_num}")

    except KeyboardInterrupt:
        print("\n\nTest interrupted")
    except Exception as e:
        print(f"\nTest failed: {e}")
        import traceback
        traceback.print_exc()
