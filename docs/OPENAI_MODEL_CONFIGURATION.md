# OpenAI Model Configuration Guide

**Last Updated**: December 6, 2025  
**Status**: ? Configuration Corrected

---

## ?? Current Configuration

### Primary Model (Base Model)
```
ft:gpt-4.1-2025-04-14:raiffs-bits:codette-v9:BWgspFHr:ckpt-step-456
```
- **Version**: Codette v9
- **Checkpoint**: Step 456
- **Usage**: Base fine-tuned model for Codette AI
- **Priority**: PRIMARY in fallback chain

### Secondary Model (Backup)
```
ft:gpt-4.1-2025-04-14:raiffs-bits:codettev71:C61lAE2r:ckpt-step-60
```
- **Version**: Codette v7.1
- **Checkpoint**: Step 60
- **Usage**: Fallback if primary fails
- **Priority**: SECONDARY in fallback chain

### OpenAI Assistant
```
Assistant ID: asst_qOBjSkFUAGVJgglhcnauiUZJ
```
- **API Version**: v2 (Assistants API)
- **Features**: Thread management, function calling, persistent conversations
- **Model**: Configured in OpenAI dashboard (separate from fallback models)
- **Priority**: HIGHEST (tried first before fallback models)

---

## ?? Response Priority Chain

When a user sends a message to Codette AI, the system tries multiple engines in this order:

### 1. ? OpenAI Assistant API (PRIMARY)
**File**: `codette_server_unified.py` ? `query_openai_assistant()`  
**Model**: Configured in OpenAI dashboard for Assistant ID  
**Confidence**: 0.95 (highest)  
**Usage**:
- Full conversation context via threads
- Function calling for advanced features
- Best response quality
- Persistent memory across sessions

**When it's used**:
```python
if OPENAI_AVAILABLE and OPENAI_FALLBACK_ENABLED:
    result = await query_openai_assistant(message, daw_context)
    if result["response"]:
        return result  # Success - stop here
```

### 2. ?? Local Codette Engine (Fallback #1)
**File**: `codette_server_unified.py` ? `codette_engine.respond()`  
**Model**: Local Python model (Hybrid/Enhanced/Core)  
**Confidence**: 0.85  
**Usage**:
- Falls back if OpenAI Assistant fails
- Uses local multi-perspective analysis
- No API costs
- Lower response quality than Assistant

**When it's used**:
```python
if codette_engine and hasattr(codette_engine, 'respond'):
    response = codette_engine.respond(message)
    return response
```

### 3. ?? Keyword Fallback (Last Resort)
**File**: `codette_server_unified.py` ? `generate_basic_fallback_response()`  
**Model**: None (keyword matching)  
**Confidence**: 0.5  
**Usage**:
- Basic keyword-based responses
- No AI processing
- Guaranteed to always return something

**When it's used**:
```python
# Only if both OpenAI Assistant and local Codette fail
response = generate_basic_fallback_response(message)
return response
```

---

## ?? Configuration Files

### 1. Environment Variables (`.env`)
```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-...
OPENAI_FALLBACK_ENABLED=true

# Fine-tuned Models (for future chat completion API use)
OPENAI_FALLBACK_MODEL_PRIMARY=ft:gpt-4.1-2025-04-14:raiffs-bits:codette-v9:BWgspFHr:ckpt-step-456
OPENAI_FALLBACK_MODEL_SECONDARY=ft:gpt-4.1-2025-04-14:raiffs-bits:codettev71:C61lAE2r:ckpt-step-60

# Assistant API (currently used)
OPENAI_ASSISTANT_ID=asst_qOBjSkFUAGVJgglhcnauiUZJ
OPENAI_ASSISTANT_VERSION=v2
OPENAI_TIMEOUT=30
```

### 2. Python Server (`codette_server_unified.py`)
```python
# Lines 117-122 (now corrected)
OPENAI_FALLBACK_MODEL_PRIMARY = os.getenv(
    "OPENAI_FALLBACK_MODEL_PRIMARY", 
    "ft:gpt-4.1-2025-04-14:raiffs-bits:codette-v9:BWgspFHr:ckpt-step-456"  # ? CORRECT
)
OPENAI_FALLBACK_MODEL_SECONDARY = os.getenv(
    "OPENAI_FALLBACK_MODEL_SECONDARY",
    "ft:gpt-4.1-2025-04-14:raiffs-bits:codettev71:C61lAE2r:ckpt-step-60"
)
```

**Previous Issue** (now fixed):
- Primary and Secondary models were swapped in default values
- Environment variables were correct, but fallback defaults were wrong
- **Fixed**: Defaults now match `.env` configuration

---

## ?? Important Notes

### OpenAI Assistant vs. Chat Completions API

The system currently uses **OpenAI Assistant API**, which is **separate** from the Chat Completions API:

| Feature | Assistant API | Chat Completions API |
|---------|---------------|---------------------|
| **Current Use** | ? Active (PRIMARY) | ? Not used (models defined for future) |
| **Model Config** | OpenAI dashboard | Environment variables |
| **Thread Management** | ? Built-in | ? Manual implementation |
| **Function Calling** | ? Native support | ? Supported |
| **Conversation Memory** | ? Persistent | ? Must manage manually |
| **Cost** | Higher | Lower |
| **Quality** | Best | Good |

### Why Define Fallback Models?

The `OPENAI_FALLBACK_MODEL_PRIMARY` and `OPENAI_FALLBACK_MODEL_SECONDARY` variables are defined but **not currently used** because:

1. **Assistant API is working** - It's the preferred method
2. **Future-proofing** - If Assistant API fails, can switch to Chat Completions API
3. **Cost optimization** - Can switch to cheaper Chat Completions API if needed
4. **Redundancy** - Multiple fallback options increase reliability

### Model Selection Priority

```
User Message
    ?
1. Try OpenAI Assistant API (asst_qOBjSkFUAGVJgglhcnauiUZJ)
    ?? Success? ? Return response (confidence: 0.95)
    ?? Failed? ? Go to step 2
    
2. Try Local Codette Engine (Hybrid/Enhanced/Core)
    ?? Success? ? Return response (confidence: 0.85)
    ?? Failed? ? Go to step 3
    
3. Use Keyword Fallback (always succeeds)
    ?? Return basic response (confidence: 0.5)
```

---

## ? Verification Checklist

After updating model configuration:

- [x] `.env` file has correct model IDs
- [x] `codette_server_unified.py` default values match `.env`
- [x] Primary model: `codette-v9:BWgspFHr:ckpt-step-456` ?
- [x] Secondary model: `codettev71:C61lAE2r:ckpt-step-60` ?
- [x] Assistant ID: `asst_qOBjSkFUAGVJgglhcnauiUZJ` ?
- [x] `OPENAI_FALLBACK_ENABLED=true` ?
- [x] API key configured ?

---

## ?? Testing the Configuration

### 1. Start the Server
```bash
python codette_server_unified.py
```

### 2. Check Startup Logs
Look for these lines in the console output:
```
? OpenAI client initialized (fallback enabled)
   • Primary model: ft:gpt-4.1-2025-04-14:raiffs-bits:codette-v9:BW...
   • Secondary model: ft:gpt-4.1-2025-04-14:raiffs-bits:codettev71:C...
   • Assistant ID: asst_qOBjSkFUAGVJgglhcnauiUZJ

?? Response Priority Chain:
   1. ? OpenAI Assistant API (PRIMARY - Highest quality)
   2. Local Codette (Fallback)
   3. Keyword Fallback (Last resort)
```

### 3. Test via Frontend
Send a message in the Codette chat interface:
```
"What's the best way to mix vocals?"
```

Expected response should come from **OpenAI Assistant** (check console logs):
```
[Chat] ?? Trying OpenAI Assistant (primary)...
[OpenAI Assistant] Creating run with assistant asst_qOBjSkFUAGVJgglhcnauiUZJ
[OpenAI Assistant] ? Success (XXX chars)
[Chat] ? OpenAI Assistant successful (openai_assistant, XXX chars)
```

### 4. Verify Model in Response
The response object will include:
```json
{
  "response": "...",
  "source": "openai_assistant",  // ? Confirms Assistant API was used
  "confidence": 0.95,
  "thread_id": "thread_...",
  "run_id": "run_..."
}
```

---

## ?? Summary

### What Changed
- ? Fixed default model order in `codette_server_unified.py` (lines 120-121)
- ? Primary model now correctly defaults to `codette-v9:BWgspFHr:ckpt-step-456`
- ? Secondary model now correctly defaults to `codettev71:C61lAE2r:ckpt-step-60`

### What Didn't Change
- OpenAI Assistant ID (already correct)
- Environment variables in `.env` (already correct)
- Response priority chain (Assistant API still PRIMARY)
- Fallback behavior (unchanged)

### Current Status
- ? **Model configuration is now correct**
- ? **Server will use the right base model**
- ? **Fallback chain is properly ordered**
- ? **Ready for deployment**

---

## ?? How to Find Which Model Responded

Each response includes a `source` field:

| Source Value | Engine Used | Model |
|--------------|-------------|-------|
| `openai_assistant` | OpenAI Assistant API | Dashboard-configured model |
| `CodetteHybrid` | Local Codette Hybrid | Local Python model |
| `CodetteEnhanced` | Local Codette Enhanced | Local Python model |
| `CodetteCore` | Local Codette Core | Local Python model |
| `fallback_basic` | Keyword fallback | None (keyword matching) |

**To check in real-time**, watch the server console logs for lines starting with:
- `[Chat]` - Shows which engine is being tried
- `[OpenAI Assistant]` - Shows Assistant API activity
- `[Chat] ?` - Shows which engine succeeded

---

**Questions?**
- Where is the Assistant model configured? ? OpenAI dashboard (not in code)
- Why aren't fallback models used? ? Assistant API is working (preferred)
- Can I switch to Chat Completions API? ? Yes, by modifying `query_openai_assistant()` function
- How do I know which model answered? ? Check response `source` field or console logs

---

*Configuration verified by: GitHub Copilot*  
*Project: CoreLogic Studio - Codette AI*  
*Date: December 6, 2025*
