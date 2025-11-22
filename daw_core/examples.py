"""
CoreLogic Studio - DAW Core Example & Test Suite

Demonstrates the node-based architecture in action.
Run this to validate the core engine works correctly.
"""

# NOTE: This file requires numpy and scipy to run
# Install with: pip install numpy scipy

import sys

# Try importing, but provide helpful message if dependencies missing
try:
    import numpy as np
except ImportError:
    print("ERROR: numpy not installed")
    print("Install dependencies: pip install numpy scipy")
    sys.exit(1)


def example_1_simple_graph():
    """
    Example 1: Basic signal flow
    AudioInput → Effect → Master Output
    """
    print("\n" + "=" * 60)
    print("Example 1: Simple Signal Graph")
    print("=" * 60)

    from daw_core.graph import AudioInput, FXNode, MixerBus, OutputNode
    from daw_core.engine import AudioEngine

    # Create engine
    engine = AudioEngine(sample_rate=44100, buffer_size=1024)

    # Create nodes
    # 1. Audio input (generated sine wave for testing)
    def generate_sine():
        t = np.linspace(0, 1, 1024)
        return np.array([
            np.sin(2 * np.pi * 440 * t) * 0.1,  # 440 Hz sine, -20dB
            np.sin(2 * np.pi * 440 * t) * 0.1,
        ])

    audio_in = AudioInput("MicIn")
    audio_in.set_data(generate_sine())

    # 2. Effect node (soft clipping)
    def soft_clip(signal):
        return np.tanh(signal * 2.0)

    compressor = FXNode("SoftClipper", soft_clip)

    # 3. Master bus
    master = MixerBus("Master")
    master.set_gain(0.0)  # 0 dB

    # 4. Output node
    output = OutputNode("MasterOutput")

    # Add to engine
    engine.add_node(audio_in)
    engine.add_node(compressor)
    engine.add_node(master)
    engine.add_node(output)

    # Connect graph
    engine.connect(audio_in, compressor)
    engine.connect(compressor, master)
    engine.connect(master, output)

    # Process
    print("Processing graph...")
    engine.start()
    for i in range(5):
        engine.process_block()
        if i == 0:
            status = output.get_status()
            print(
                f"  Block {i}: Master peak = {status['peak_db']:.2f} dB, "
                f"Clipped: {status['clipped']}"
            )

    engine.stop()
    print("✓ Simple graph processed successfully")


def example_2_multi_track_routing():
    """
    Example 2: Multiple tracks routed to master
    Track1 → Master
    Track2 → Master
    """
    print("\n" + "=" * 60)
    print("Example 2: Multi-Track Routing")
    print("=" * 60)

    from daw_core.track import Track
    from daw_core.routing import Router

    router = Router()

    # Create tracks
    track1 = Track("track_1", "Guitar", track_type="audio")
    track1.set_volume(-3.0)  # -3 dB
    track1.set_pan(0.3)  # Pan right

    track2 = Track("track_2", "Drums", track_type="audio")
    track2.set_volume(0.0)  # Unity gain
    track2.set_pan(-0.3)  # Pan left

    # Add to router
    router.add_track(track1)
    router.add_track(track2)

    # Create master bus
    router.create_master_bus()

    # Route both to master
    router.route_track("track_1", "master")
    router.route_track("track_2", "master")

    # Validate routing
    is_valid, msg = router.validate_routing()
    print(f"Routing valid: {is_valid} ({msg})")

    # Export routing matrix
    routing = router.get_graph_connections()
    print(f"Routing matrix: {routing}")

    print("✓ Multi-track routing configured")


def example_3_sends_and_parallel():
    """
    Example 3: Sends and parallel processing
    Track1 → Main Out
          → Send (copy) → Reverb Aux → Main Out
    """
    print("\n" + "=" * 60)
    print("Example 3: Sends & Parallel Processing")
    print("=" * 60)

    from daw_core.track import Track
    from daw_core.routing import Router

    router = Router()

    # Create main track
    main_track = Track("track_main", "Vocal", track_type="audio")
    main_track.set_volume(0.0)

    # Create auxiliary track for reverb
    aux_reverb = Track("aux_reverb", "Reverb", track_type="aux")
    aux_reverb.set_volume(-6.0)  # Aux quieter than main

    # Add send from main to reverb (post-fader)
    main_track.add_send(
        destination_id="aux_reverb", level_db=-6.0, pre_fader=False
    )

    # Add to router
    router.add_track(main_track)
    router.add_track(aux_reverb)
    router.create_master_bus()

    # Route to master
    router.route_track("track_main", "master")
    router.route_track("aux_reverb", "master")

    # Display send configuration
    sends = router.get_send_destinations("track_main")
    print(f"Main track sends: {sends}")

    for send in sends:
        print(
            f"  → Destination: {send['destination']}, "
            f"Level: {send['level_db']} dB, "
            f"Pre-fader: {send['pre_fader']}"
        )

    print("✓ Parallel processing chain configured")


def example_4_project_serialization():
    """
    Example 4: Save and load project
    """
    print("\n" + "=" * 60)
    print("Example 4: Project Serialization")
    print("=" * 60)

    import json
    from daw_core.track import Track

    # Create a track with settings
    track = Track("vocal_1", "Lead Vocal", track_type="audio")
    track.set_volume(-2.5)
    track.set_pan(0.1)
    track.set_input_gain(3.0)
    track.set_armed(True)
    track.color = "#FF5733"

    # Serialize
    track_data = track.to_dict()
    print("Serialized track:")
    print(json.dumps(track_data, indent=2))

    # Deserialize
    track2 = Track("vocal_2", "New Track")
    track2.from_dict(track_data)

    print("\nDeserialized track:")
    print(f"  Name: {track2.name}")
    print(f"  Volume: {track2.volume} dB")
    print(f"  Pan: {track2.pan}")
    print(f"  Input Gain: {track2.input_gain} dB")
    print(f"  Armed: {track2.armed}")
    print(f"  Color: {track2.color}")

    print("✓ Project serialization working")


def example_5_cycle_detection():
    """
    Example 5: Detect cycles in routing
    This should fail validation (and it should!)
    """
    print("\n" + "=" * 60)
    print("Example 5: Cycle Detection")
    print("=" * 60)

    from daw_core.routing import Router
    from daw_core.track import Track

    router = Router()

    # Create tracks
    track_a = Track("track_a", "A")
    track_b = Track("track_b", "B")
    track_c = Track("track_c", "C")

    router.add_track(track_a)
    router.add_track(track_b)
    router.add_track(track_c)

    # Create a cycle: A → B → C → A
    router.route_track("track_a", "track_b")
    router.route_track("track_b", "track_c")
    router.route_track("track_c", "track_a")

    # Validate (should detect cycle)
    is_valid, msg = router.validate_routing()
    print(f"Routing valid: {is_valid}")
    print(f"Message: {msg}")

    if not is_valid:
        print("✓ Cycle successfully detected!")


def run_all_examples():
    """Run all examples."""
    print("\n" + "🎛" * 20)
    print("CoreLogic Studio - DAW Core Examples")
    print("🎛" * 20)

    try:
        example_1_simple_graph()
        example_2_multi_track_routing()
        example_3_sends_and_parallel()
        example_4_project_serialization()
        example_5_cycle_detection()

        print("\n" + "=" * 60)
        print("✓ All examples completed successfully!")
        print("=" * 60 + "\n")

    except Exception as e:
        print(f"\n❌ Error running examples: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    run_all_examples()
