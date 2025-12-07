# OpenAI Fallback Integration Guide

## Overview

CoreLogic Studio now includes **OpenAI Assistants API** and **fine-tuned models** as a fallback when the local Codette AI engine is unavailable or encounters errors.

## What's New: Assistants API v2

The server now supports OpenAI's **Assistants API** with persistent conversation threads, providing:
- ? **Highest quality responses** (tried first before chat models)
- ? **Persistent context** across multiple messages
- ? **Thread management** for each user
- ? **Automatic conversation history**

## Setup

### 1. Add API Key to .env

Open `.env` file and add your OpenAI API key:

```env
# OpenAI API Configuration
OPENAI_API_KEY=sk-proj-your-api-key-here

# OpenAI Assistant (v2 API) - HIGHEST PRIORITY
OPENAI_ASSISTANT_ID=asst_qOBjSkFUAGVJgglhcnauiUZJ
OPENAI_ASSISTANT_VERSION=v2

# Fine-tuned Models (Fallback after Assistant)
OPENAI_FALLBACK_MODEL_PRIMARY=ft:gpt-4.1-2025-04-14:raiffs-bits:codettev71:C61lAE2r:ckpt-step-60
OPENAI_FALLBACK_MODEL_SECONDARY=ft:gpt-4.1-2025-04-14:raiffs-bits:codette-v9:BWgspFHr:ckpt-step-456

# Enable fallback
OPENAI_FALLBACK_ENABLED=true
```

### 2. Install OpenAI Library

```bash
pip install openai
```

### 3. Restart Server

```bash
python codette_server_unified.py
```

## Fallback Chain (Updated)

The system now tries models in this order:

1. **Local Codette Engine** (Primary - Free)
   - CodetteHybrid (if available)
   - CodetteEnhanced (if available)
   - CodetteCore (if available)

2. **OpenAI Assistant API** (Fallback 1 - Paid, Highest Quality)
   - Assistant: `asst_qOBjSkFUAGVJgglhcnauiUZJ`
   - Persistent conversation threads
   - Full context awareness
   - Confidence: 95%

3. **OpenAI Fine-tuned Primary** (Fallback 2 - Paid)
   - Model: `ft:gpt-4.1-2025-04-14:raiffs-bits:codettev71:C61lAE2r:ckpt-step-60`
   - Confidence: 90%

4. **OpenAI Fine-tuned Secondary** (Fallback 3 - Paid)
   - Model: `ft:gpt-4.1-2025-04-14:raiffs-bits:codette-v9:BWgspFHr:ckpt-step-456`
   - Confidence: 85%

5. **OpenAI Base Model** (Fallback 4 - Paid)
   - Model: `gpt-4o-mini`
   - Confidence: 75%

6. **Basic Keyword Fallback** (Last Resort - Free)
   - Keyword-based responses
   - Confidence: 50%

## New Features: Thread Management

### List Active Threads

```bash
curl http://localhost:8000/codette/threads
```

Response:
```json
{
  "success": true,
  "threads": [
    {"user_id": "default", "thread_id": "thread_abc123"},
    {"user_id": "user_456", "thread_id": "thread_def789"}
  ],
  "total": 2
}
```

### Get Thread for User

```bash
curl http://localhost:8000/codette/threads/default
```

### Clear Thread (Start Fresh Conversation)

```bash
curl -X POST http://localhost:8000/codette/threads/clear?user_id=default
```

### Clear All Threads

```bash
curl -X POST http://localhost:8000/codette/threads/clear-all
```

## Verification

### Check Server Logs

When the server starts, you should see:

```
?? OpenAI Fallback:
   ? Status: ENABLED
   ?? Assistant API: AVAILABLE
      • Assistant ID: asst_qOBjSkFUAGVJgglhcnauiUZJ
      • Version: v2
      • Thread Management: Enabled
      • Priority: Highest (tried first)

   ?? Chat Models:
      • Primary: ft:gpt-4.1-2025-04-14:raiffs-bits:codettev71...
      • Secondary: ft:gpt-4.1-2025-04-14:raiffs-bits:codette-v9...
      • Base: gpt-4o-mini

   ?? Fallback Chain:
      1. Local Codette (Free)
      2. OpenAI Assistant API (Highest quality)
      3. Fine-tuned Primary Model
      4. Fine-tuned Secondary Model
      5. Base Model (gpt-4o-mini)
      6. Keyword Fallback (Last resort)
```

### Test Chat Endpoint

```bash
curl -X POST http://localhost:8000/codette/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I mix vocals?",
    "perspective": "mix_engineering"
  }'
```

Expected response with Assistant API:
```json
{
  "response": "For vocal mixing, I recommend...",
  "perspective": "mix_engineering",
  "confidence": 0.95,
  "timestamp": "2025-01-15T10:30:00Z",
  "source": "openai_assistant"
}
```

### Check Response Source

The `source` field indicates which engine responded:

- `CodetteHybrid` / `CodetteEnhanced` / `CodetteCore` - Local Codette
- `openai_assistant` - OpenAI Assistant API (highest quality)
- `openai_primary` - Fine-tuned primary model
- `openai_secondary` - Fine-tuned secondary model
- `openai_base` - Base model (gpt-4o-mini)
- `fallback_basic` - Keyword-based fallback

## Benefits of Assistant API

### Persistent Context
Each user gets their own conversation thread that maintains context across multiple messages:
```bash
# First message
curl -X POST http://localhost:8000/codette/chat \
  -d '{"message": "I have a vocal track"}'
# Response remembers this

# Second message (context maintained)
curl -X POST http://localhost:8000/codette/chat \
  -d '{"message": "What EQ should I use?"}'
# Assistant knows you're asking about the vocal track!
```

### Better Quality
- More coherent responses
- Better understanding of complex questions
- Follows instructions more accurately

### Automatic Thread Management
- Threads created automatically per user
- Thread IDs persisted in memory
- Clear threads to start fresh conversations

## Configuration Options

### Disable OpenAI Fallback

Set in `.env`:
```env
OPENAI_FALLBACK_ENABLED=false
```

### Adjust Timeout

```env
OPENAI_TIMEOUT=60  # seconds (default: 30)
```

### Adjust Retries

```env
OPENAI_MAX_RETRIES=5  # (default: 3)
```

## Cost Considerations

### OpenAI API Pricing (Estimated)

- **Fine-tuned GPT-4**: ~$0.06 per 1K tokens (input), ~$0.12 per 1K tokens (output)
- **GPT-4o-mini**: ~$0.15 per 1M tokens (input), ~$0.60 per 1M tokens (output)

### Typical Usage

- Average chat: 200 input tokens + 500 output tokens = ~$0.07 per request (fine-tuned)
- 100 chats/day with fallback: ~$7/day = ~$210/month

### Cost Optimization

1. **Keep local Codette running** - It's free and only uses OpenAI on failure
2. **Monitor fallback rate** - Check logs for `[OpenAI Fallback]` messages
3. **Use shorter prompts** - Add DAW context selectively
4. **Cache responses** - Frontend can cache common queries

## Troubleshooting

### Issue: "OpenAI fallback not configured"

**Solution**: Add `OPENAI_API_KEY` to `.env` file and restart server

### Issue: "All OpenAI models failed"

**Possible Causes**:
- Invalid API key
- Insufficient API credits
- Network connectivity issues
- Rate limit exceeded

**Solution**: Check OpenAI dashboard at https://platform.openai.com/

### Issue: High API costs

**Solution**: 
- Disable OpenAI fallback if local Codette is reliable
- Set `OPENAI_FALLBACK_ENABLED=false` in `.env`
- Use longer cache TTL in frontend

### Issue: Slow responses

**Solution**:
- Increase `OPENAI_TIMEOUT` in `.env`
- Check network latency to OpenAI API
- Use faster model (gpt-4o-mini is faster than fine-tuned models)

## API Endpoints Affected

All Codette chat endpoints now support OpenAI fallback:

- `POST /codette/chat`
- `POST /api/codette/chat`

Fallback is **automatic** and **transparent** - no frontend changes needed.

## Monitoring

### Check Fallback Usage

Search server logs for:
```bash
grep "OpenAI Fallback" codette_server.log
```

### Count Fallback Calls

```bash
grep "OpenAI fallback successful" codette_server.log | wc -l
```

### Check Model Used

```bash
grep -E "(primary|secondary|base) model" codette_server.log
```

## Security

### API Key Protection

- **Never commit** `.env` file to git
- Store API key in environment variable for production
- Use read-only API keys if available
- Rotate keys regularly

### Backend-Only Access

OpenAI API key is:
- ? Stored in backend `.env` (secure)
- ? Never exposed to frontend (secure)
- ? Used only by `codette_server_unified.py` (secure)
- ? Not accessible via frontend API (secure)

## Support

### OpenAI Support
- Dashboard: https://platform.openai.com/
- API Status: https://status.openai.com/
- Docs: https://platform.openai.com/docs/

### Codette Support
- Check server logs: `tail -f codette_server.log`
- Verify local Codette: `python -c "from codette_new import Codette; print('OK')"`
- Test endpoint: `curl http://localhost:8000/codette/status`

## Summary

? **Setup Complete**
- Add API key to `.env`
- Install `openai` library
- Restart server
- Verify logs show "OpenAI Fallback: ENABLED"

? **Automatic Fallback**
- No frontend changes needed
- Transparent to users
- Logs show which model responded

? **Cost-Effective**
- Only used when local Codette fails
- Primary model tried first (most accurate)
- Falls back to cheaper models if needed

? **Secure**
- API key never exposed to frontend
- Backend-only configuration
- No code changes required

---

**Status**: ? Ready for Production  
**Last Updated**: January 15, 2025  
**Integration**: Complete
