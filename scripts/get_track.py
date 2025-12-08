from tools.daw_project import load_project, get_track_by_name_or_id
import sys
import os


def get_track(track_name: str, use_api: bool = False, api_base: str = "http://localhost:8000", use_engine_node: bool = False, engine_node_url: str = "http://localhost:41234"):
    if use_api:
        try:
            import requests
            resp = requests.get(f"{api_base}/codette/daw/track/status?trackId={track_name}", timeout=2)
            if resp.ok:
                data = resp.json()
                print("Track (API):", data)
                return data
            else:
                print(f"API: No live data for '{track_name}' ({resp.status_code})")
        except ImportError:
            print("requests not installed, falling back to project file")
        except Exception as e:
            print(f"API unavailable: {e}, falling back to project file")

    if use_engine_node:
        try:
            import requests
            payload = {"method": "getTrack", "params": {"trackId": track_name}}
            resp = requests.post(f"{engine_node_url}/rpc", json=payload, timeout=2)
            if resp.ok:
                data = resp.json().get('result')
                print("Track (Engine Node):", data)
                return data
            else:
                print(f"Engine-node returned {resp.status_code}: {resp.text}")
        except ImportError:
            print("requests not installed, cannot query engine-node")
        except Exception as e:
            print(f"Engine-node query failed: {e}")

    router, meta = load_project()
    track = get_track_by_name_or_id(router, track_name)
    if track:
        print(f"Track: {track.name}")
        print(f" ID: {track.id}")
        print(f" Type: {track.type}")
        print(f" Volume (fader): {track.volume} dB")
        print(f" Input Gain: {track.input_gain} dB")
        print(f" Peak Level: N/A (no live metering)")
        print(f" Muted: {track.muted}")
        print(f" Soloed: {track.soloed}")
        return track
    else:
        print(f"Track '{track_name}' not found.")
        return None


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Get track info from project or Codette API")
    parser.add_argument("name", nargs="?", default="Audio 1", help="Track name or id")
    parser.add_argument("--api", action="store_true", help="Query live Codette API if available")
    parser.add_argument("--api-base", default=os.environ.get("CODETTE_API", "http://localhost:8000"), help="Base URL for Codette API")
    parser.add_argument("--engine-node", action="store_true", help="Query Node.js engine bridge for live track state")
    parser.add_argument("--engine-node-url", default=os.environ.get("ENGINE_NODE_URL", "http://localhost:41234"), help="URL for Node engine bridge")

    args = parser.parse_args()
    get_track(args.name, use_api=args.api, api_base=args.api_base, use_engine_node=args.engine_node, engine_node_url=args.engine_node_url)
