"""
Missing Helper Functions for codette_server_unified.py
Add these functions after the 'base' dictionary definition and before 'async def broadcast_status_periodically'
"""

def _is_thread_run_active(thread_id: str) -> bool:
    """
    Helper function to check if OpenAI thread has an active run.
    Returns True if a non-terminal run exists for the given thread.
    """
    if not OPENAI_AVAILABLE or not openai_client or not thread_id:
        return False

    try:
        # Try to list runs for this thread
        runs_resp = None
        try:
            runs_resp = openai_client.beta.threads.runs.list(thread_id=thread_id, limit=10)
        except Exception:
            try:
                runs_resp = openai_client.beta.threads.runs(thread_id=thread_id).list(limit=10)
            except Exception:
                try:
                    runs_resp = openai_client.list_runs(thread_id=thread_id)
                except Exception:
                    runs_resp = None

        if runs_resp is None:
            return False

        # Normalize to iterable
        runs = []
        if hasattr(runs_resp, 'data') and getattr(runs_resp, 'data') is not None:
            runs = list(runs_resp.data)
        elif isinstance(runs_resp, (list, tuple)):
            runs = list(runs_resp)
        else:
            try:
                runs = list(runs_resp)
            except Exception:
                runs = [runs_resp]

        # Check if any run is in an active state
        for r in runs:
            try:
                status = None
                if isinstance(r, dict):
                    status = r.get('status')
                else:
                    status = getattr(r, 'status', None)
                
                if status and status.lower() in ("queued", "in_progress", "running", "processing", "requires_action"):
                    return True
            except Exception:
                continue

        return False
    except Exception:
        # Be conservative: assume no active run if we cannot determine
        return False


async def ingest_chat_to_codette(user_id: str, user_message: str, assistant_response: str, source: str = "unknown"):
    """
    Ingest chat exchange into Codette's memory if engine supports learning.
    This function is best-effort and will not raise if Codette lacks methods.
    """
    try:
        if not codette_engine:
            logger.debug("Ingest skipped: no codette engine available")
            return False

        # Prefer known ingestion API shapes
        data = {
            "user_id": user_id,
            "user_message": user_message,
            "assistant_response": assistant_response,
            "source": source,
            "timestamp": get_timestamp()
        }

        # Try dedicated method
        if hasattr(codette_engine, 'learn_from_chat') and callable(getattr(codette_engine, 'learn_from_chat')):
            try:
                maybe = codette_engine.learn_from_chat(data)
                if asyncio.iscoroutine(maybe):
                    await maybe
                logger.info("Ingested chat to codette via learn_from_chat")
                return True
            except Exception as e:
                logger.debug(f"learn_from_chat failed: {e}")

        # Try append to context memory
        if hasattr(codette_engine, 'context_memory') and isinstance(getattr(codette_engine, 'context_memory'), list):
            try:
                codette_engine.context_memory.append({
                    'input': user_message,
                    'response': assistant_response,
                    'source': source,
                    'timestamp': get_timestamp()
                })
                logger.info("Appended chat to codette.context_memory")
                return True
            except Exception as e:
                logger.debug(f"Appending to context_memory failed: {e}")

        # Try generic memory attributes
        for attr in ('memory', 'conversation_history', 'conversation', 'chat_history'):
            try:
                mem = getattr(codette_engine, attr, None)
                if isinstance(mem, list):
                    mem.append({
                        'user': user_message,
                        'assistant': assistant_response,
                        'source': source,
                        'timestamp': get_timestamp()
                    })
                    logger.info(f"Appended chat to codette.{attr}")
                    return True
            except Exception as e:
                logger.debug(f"Failed to append to {attr}: {e}")

        logger.debug("No supported ingestion method found on codette_engine")
        return False
    except Exception as e:
        logger.warning(f"Failed to ingest chat to Codette: {e}")
        return False


async def production_checklist(stage: str) -> Dict[str, Any]:
    """
    Get production workflow checklist for specified stage.
    Returns tasks organized by stage and category.
    """
    try:
        # Use base data if available
        if 'base' in globals() and isinstance(base, dict):
            items = base.get(stage, base.get('mixing', []))
        else:
            # Fallback checklists
            items = {
                "recording": [
                    {"id": "rec_signal_check", "task": "Confirm input levels and no clipping", "priority": "high", "category": "Recording", "completed": False},
                    {"id": "rec_phase", "task": "Check phase alignment on multi-mic setups", "priority": "high", "category": "Recording", "completed": False},
                ],
                "arrangement": [
                    {"id": "arr_structure", "task": "Verify song sections and transitions", "priority": "medium", "category": "Arrangement", "completed": False},
                    {"id": "arr_balance", "task": "Balance instrument levels across sections", "priority": "medium", "category": "Arrangement", "completed": False},
                ],
                "mixing": [
                    {"id": "mix_level_check", "task": "Verify master headroom and peaks", "priority": "high", "category": "Mixing", "completed": False},
                    {"id": "mix_balance", "task": "Balance instrument levels and panning", "priority": "medium", "category": "Mixing", "completed": False},
                    {"id": "mix_eq", "task": "Apply EQ to carve frequency space", "priority": "high", "category": "Mixing", "completed": False},
                    {"id": "mix_comp", "task": "Add compression for dynamics control", "priority": "medium", "category": "Mixing", "completed": False},
                ],
                "mastering": [
                    {"id": "master_reference", "task": "Check reference tracks and LUFS", "priority": "high", "category": "Mastering", "completed": False},
                    {"id": "master_eq", "task": "Apply final EQ for tonal balance", "priority": "high", "category": "Mastering", "completed": False},
                    {"id": "master_limit", "task": "Set limiter for target loudness", "priority": "high", "category": "Mastering", "completed": False},
                ],
            }.get(stage, [])

        return {
            "success": True,
            "stage": stage,
            "items": items,
            "completionPercentage": 0,
            "timestamp": get_timestamp()
        }
    except Exception as e:
        logger.error(f"[Production Checklist] Error: {e}")
        return {
            "success": False,
            "error": str(e),
            "stage": stage,
            "items": [],
            "completionPercentage": 0
        }


async def instrument_info(category: str, instrument: str) -> Dict[str, Any]:
    """
    Get instrument processing guide with frequency ranges, EQ recommendations, etc.
    """
    try:
        # Sample instrument database
        instruments_db = {
            "vocals": {
                "lead": {
                    "typical_range_hz": [80, 12000],
                    "target_levels": {"peaks_dbfs": -6, "avg_lufs": -18},
                    "common_issues": ["Sibilance", "Muddiness", "Proximity effect"],
                    "recommended_processing": {
                        "eq": ["High-pass at 80Hz", "Cut at 200-300Hz for clarity", "Boost at 3-5kHz for presence"],
                        "compression": ["4:1 ratio", "5-10ms attack", "40-100ms release"],
                        "effects": ["De-esser", "Reverb", "Delay"]
                    },
                    "tips": ["Use pop filter", "Maintain consistent distance", "Watch for phase issues"]
                }
            },
            "drums": {
                "kick": {
                    "typical_range_hz": [20, 250],
                    "target_levels": {"peaks_dbfs": -3, "avg_lufs": -15},
                    "common_issues": ["Phase cancellation", "Too much low-end", "Lack of punch"],
                    "recommended_processing": {
                        "eq": ["Boost at 60Hz for depth", "Boost at 3-5kHz for attack"],
                        "compression": ["4:1 ratio", "Fast attack", "Medium release"],
                        "effects": ["Saturation"]
                    },
                    "tips": ["Tune to key of song", "Layer samples if needed", "Sidechain bass"]
                }
            },
            "guitars": {
                "electric": {
                    "typical_range_hz": [80, 8000],
                    "target_levels": {"peaks_dbfs": -9, "avg_lufs": -20},
                    "common_issues": ["Harshness", "Too much bass", "Lack of definition"],
                    "recommended_processing": {
                        "eq": ["High-pass at 80Hz", "Cut at 250Hz", "Boost at 2-4kHz"],
                        "compression": ["3:1 ratio", "Medium attack", "Medium release"],
                        "effects": ["Reverb", "Delay", "Chorus"]
                    },
                    "tips": ["Double-track for width", "Pan left-right", "Watch for phase"]
                }
            }
        }

        info = instruments_db.get(category, {}).get(instrument, {})
        
        if not info:
            info = {
                "typical_range_hz": [20, 20000],
                "target_levels": {"peaks_dbfs": -6, "avg_lufs": -18},
                "common_issues": ["Generic instrument"],
                "recommended_processing": {"eq": [], "compression": [], "effects": []},
                "tips": []
            }

        return {
            "success": True,
            "category": category,
            "instrument": instrument,
            "info": info,
            "timestamp": get_timestamp()
        }
    except Exception as e:
        logger.error(f"[Instrument Info] Error: {e}")
        return {
            "success": False,
            "error": str(e),
            "category": category,
            "instrument": instrument,
            "info": {}
        }
