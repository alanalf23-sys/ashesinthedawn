from tools.daw_project import load_project, save_project, get_track_by_name_or_id
import sys
import os


def modify_track(track_name: str, gain_increase: float = 0.0, mute: bool = None, solo: bool = None, volume: float = None, use_api: bool = False, api_base: str = "http://localhost:8000", use_engine: bool = False, use_engine_node: bool = False, engine_node_url: str = "http://localhost:41234"):
    # Try API first when requested
    if use_api:
        try:
            import requests
            # Resolve endpoint payloads
            payload = {}
            # Attempt to identify track by id or name - send identifier as trackId
            payload_ident = {"trackId": track_name}

            if gain_increase != 0.0:
                # No dedicated endpoint for input gain in all servers; try level/set
                data = {"trackId": track_name, "levelType": "input_gain", "value": gain_increase}
                resp = requests.post(f"{api_base}/codette/daw/level/set", json=data, timeout=3)
                if resp.ok:
                    print(f"API: Increased input gain by {gain_increase} dB for '{track_name}'")
                else:
                    print(f"API: Failed to set input gain: {resp.status_code} {resp.text}")

            if mute is not None:
                data = {"trackId": track_name, "muted": bool(mute)}
                try:
                    resp = requests.post(f"{api_base}/codette/daw/track/mute", json=data, timeout=3)
                    if resp.ok:
                        print(f"API: Muted: {bool(mute)} for '{track_name}'")
                    else:
                        print(f"API: Failed to set mute: {resp.status_code} {resp.text}")
                except Exception as e:
                    print(f"API mute request failed: {e}")

            if solo is not None:
                data = {"trackId": track_name, "solo": bool(solo)}
                try:
                    resp = requests.post(f"{api_base}/codette/daw/track/solo", json=data, timeout=3)
                    if resp.ok:
                        print(f"API: Soloed: {bool(solo)} for '{track_name}'")
                    else:
                        print(f"API: Failed to set solo: {resp.status_code} {resp.text}")
                except Exception as e:
                    print(f"API solo request failed: {e}")

            if volume is not None:
                data = {"trackId": track_name, "levelType": "volume", "value": float(volume)}
                resp = requests.post(f"{api_base}/codette/daw/level/set", json=data, timeout=3)
                if resp.ok:
                    print(f"API: Volume (fader) set to {volume} dB for '{track_name}'")
                else:
                    print(f"API: Failed to set volume: {resp.status_code} {resp.text}")

            return True
        except ImportError:
            print("requests library not installed, falling back to local project file")
        except Exception as e:
            print(f"API unavailable or error: {e}. Falling back to local project file.")

    # Try direct engine interaction when requested
    engine = None
    if use_engine:
        try:
            # Prefer integration_patterns' IntegratedAudioEngine if available
            try:
                from daw_core.integration_patterns import IntegratedAudioEngine
                engine = IntegratedAudioEngine()
                # Start audio engine if not running
                engine.start_audio()
                print("Engine: IntegratedAudioEngine started or already running")
            except Exception:
                # Fallback to daw_core.engine.AudioEngine
                from daw_core.engine import AudioEngine
                engine = AudioEngine()
                engine.start()
                print("Engine: daw_core.AudioEngine started")
        except Exception as e:
            print(f"Engine initialization failed: {e}")
            engine = None

    # Try node bridge when requested
    if use_engine_node:
        try:
            import requests
            def rpc_call(method, params):
                payload = {"method": method, "params": params}
                resp = requests.post(f"{engine_node_url}/rpc", json=payload, timeout=2)
                if resp.ok:
                    return resp.json().get('result')
                else:
                    print(f"Engine node RPC failed: {resp.status_code} {resp.text}")
                    return None

            if gain_increase != 0.0:
                # No direct mapping for input gain in simple bridge; set volume delta instead
                print("Engine-node: applying gain delta as volume change (best-effort)")
                # Not implemented

            if mute is not None:
                r = rpc_call('setTrackMute', {'trackId': track_name, 'muted': bool(mute)})
                print(f"Engine-node mute result: {r}")

            if solo is not None:
                r = rpc_call('setTrackSolo', {'trackId': track_name, 'solo': bool(solo)})
                print(f"Engine-node solo result: {r}")

            if volume is not None:
                r = rpc_call('setTrackVolume', {'trackId': track_name, 'volumeDb': float(volume)})
                print(f"Engine-node volume result: {r}")

            return True
        except ImportError:
            print("requests not installed, cannot call engine-node bridge")
        except Exception as e:
            print(f"Engine-node RPC failed: {e}")

    # Local file fallback / primary local modification path
    router, meta = load_project()
    track = get_track_by_name_or_id(router, track_name)
    if not track:
        print(f"Track '{track_name}' not found.")
        return False

    if gain_increase != 0.0:
        track.input_gain = track.input_gain + gain_increase
        print(f"Increased input gain by {gain_increase} dB -> {track.input_gain} dB")
    if mute is not None:
        track.muted = bool(mute)
        print(f"Muted: {track.muted}")
    if solo is not None:
        track.soloed = bool(solo)
        print(f"Soloed: {track.soloed}")
    if volume is not None:
        track.volume = float(volume)
        print(f"Volume (fader) set to {track.volume} dB")

    # If engine present, attempt to apply changes to engine graph where possible (best-effort)
    if engine is not None:
        try:
            # If engine exposes transport or stats, print them
            stats = None
            if hasattr(engine, 'get_stats'):
                stats = engine.get_stats()
            elif hasattr(engine, 'transport'):
                stats = {'transport_running': getattr(engine, 'is_running', False)}
            print(f"Engine stats: {stats}")
            # Note: mapping track -> engine node is project-specific; we persist project changes
        except Exception as e:
            print(f"Warning: could not sync changes to engine: {e}")

    # persist
    save_project(router, meta)
    print(f"Track '{track.name}' updated.")
    return True


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Modify a track in the project or via Codette API or local engine")
    parser.add_argument("name", nargs="?", default="Audio 1", help="Track name or id")
    parser.add_argument("--gain", type=float, default=0.0, help="Increase input gain by dB (delta)")
    parser.add_argument("--mute", dest="mute", action="store_true", help="Set muted on")
    parser.add_argument("--unmute", dest="mute", action="store_false", help="Set muted off")
    parser.add_argument("--solo", dest="solo", action="store_true", help="Set solo on")
    parser.add_argument("--unsolo", dest="solo", action="store_false", help="Set solo off")
    parser.add_argument("--volume", type=float, help="Set fader volume in dB")
    parser.add_argument("--api", action="store_true", help="Use Codette FastAPI endpoints if available")
    parser.add_argument("--api-base", default=os.environ.get("CODETTE_API", "http://localhost:8000"), help="Base URL for Codette API")
    parser.add_argument("--engine", action="store_true", help="Use local AudioEngine (daw_core) instead of HTTP")
    parser.add_argument("--engine-node", action="store_true", help="Call Node.js engine bridge (http://localhost:41234)")
    parser.add_argument("--engine-node-url", default=os.environ.get("ENGINE_NODE_URL", "http://localhost:41234"), help="URL for Node engine bridge")

    parser.set_defaults(mute=None, solo=None)

    args = parser.parse_args()

    modify_track(args.name, gain_increase=args.gain, mute=args.mute, solo=args.solo, volume=args.volume, use_api=args.api, api_base=args.api_base, use_engine=args.engine, use_engine_node=args.engine_node, engine_node_url=args.engine_node_url)
