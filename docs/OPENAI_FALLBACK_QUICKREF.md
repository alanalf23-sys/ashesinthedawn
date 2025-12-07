# OpenAI Fallback - Quick Reference

## ? 5-Minute Setup

```bash
# 1. Add API key to .env
echo "OPENAI_API_KEY=sk-proj-your-key-here" >> .env

# 2. Install library
pip install openai

# 3. Restart server
python codette_server_unified.py
```

## ?? Configuration (.env)

```env
# Required
OPENAI_API_KEY=sk-proj-your-api-key-here

# Assistant API (Highest Priority)
OPENAI_ASSISTANT_ID=asst_qOBjSkFUAGVJgglhcnauiUZJ
OPENAI_ASSISTANT_VERSION=v2

# Fine-tuned Models (Fallback)
OPENAI_FALLBACK_ENABLED=true
OPENAI_FALLBACK_MODEL_PRIMARY=ft:gpt-4.1-2025-04-14:raiffs-bits:codettev71:C61lAE2r:ckpt-step-60
OPENAI_FALLBACK_MODEL_SECONDARY=ft:gpt-4.1-2025-04-14:raiffs-bits:codette-v9:BWgspFHr:ckpt-step-456
OPENAI_TIMEOUT=30
OPENAI_MAX_RETRIES=3
```

## ?? How It Works (Updated)

```
Your Chat Request
    ?
Try Local Codette (FREE) ?
    ? (fails)
Try OpenAI Assistant API ($$$) ? ? NEW! Highest quality, persistent context
    ? (fails)
Try OpenAI Primary ($) ?
    ? (fails)
Try OpenAI Secondary ($) ?
    ? (fails)  
Try OpenAI Base ($) ?
    ? (fails)
Keyword Fallback (FREE) ?
```

## ?? Thread Management

```bash
# List all threads
curl http://localhost:8000/codette/threads

# Get thread for user
curl http://localhost:8000/codette/threads/default

# Clear thread (start fresh)
curl -X POST http://localhost:8000/codette/threads/clear?user_id=default

# Clear all threads
curl -X POST http://localhost:8000/codette/threads/clear-all
```

## ? Verify Setup

```bash
# Check logs for this:
grep "OpenAI Assistant API: AVAILABLE" <(python codette_server_unified.py 2>&1)

# Test endpoint:
curl -X POST http://localhost:8000/codette/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How do I mix vocals?"}'

# Expected: "source": "openai_assistant" (best) or "openai_primary"
```

## ?? Key Features

? **Assistant API** (NEW!)
- Persistent conversation threads
- Highest quality responses
- Automatic context retention
- Per-user thread management

? **Automatic Fallback**
- No frontend changes needed
- Transparent to users
- Logs show which model responded

? **Cost-Effective**
- Only uses OpenAI when local Codette fails
- Tries most accurate model first
- Falls back to cheaper models automatically

## ?? Costs (Updated)

| Scenario | Cost/Month |
|----------|------------|
| Local Codette works 95% | ~$10-20 |
| Local Codette works 50% | ~$100-120 |
| Local Codette unavailable | ~$300 (with Assistant API) |

**Note**: Assistant API is more expensive but provides better quality and persistent context.

## ?? Monitoring

```bash
# Fallback rate
grep -c "OpenAI Fallback" codette_server.log

# Assistant API usage
grep -c "openai_assistant" codette_server.log

# Thread count
curl http://localhost:8000/codette/threads | jq '.total'

# Model usage
grep -E "openai_(assistant|primary|secondary|base)" codette_server.log | sort | uniq -c
```

## ?? Response Sources

| Source | Type | Confidence | Cost |
|--------|------|------------|------|
| `CodetteHybrid` | Local | 95% | Free |
| `openai_assistant` | Assistant API | 95% | $$$ |
| `openai_primary` | Fine-tuned | 90% | $$ |
| `openai_secondary` | Fine-tuned | 85% | $$ |
| `openai_base` | Base | 75% | $ |
| `fallback_basic` | Keyword | 50% | Free |

## ?? Troubleshooting

| Issue | Solution |
|-------|----------|
| "OpenAI fallback not configured" | Add `OPENAI_API_KEY` to `.env` |
| "All OpenAI models failed" | Check API key & credits at platform.openai.com |
| High costs | Set `OPENAI_FALLBACK_ENABLED=false` |
| Slow responses | Increase `OPENAI_TIMEOUT` in `.env` |

## ?? Support

- **OpenAI Dashboard**: https://platform.openai.com/
- **API Status**: https://status.openai.com/
- **Server Logs**: `tail -f codette_server.log`
- **Test Health**: `curl http://localhost:8000/health`

## ?? Key Points

? **Automatic** - No code changes needed  
? **Transparent** - Frontend unaware of fallback  
? **Cost-Effective** - Only used on local failure  
? **Secure** - API key backend-only  
? **Reliable** - 3-tier fallback chain  

---

**Quick Setup Time**: 5 minutes  
**Status**: ? Ready  
**Docs**: `docs/OPENAI_FALLBACK_SETUP.md`
