# ?? CoreLogic Studio Integration Gap Report

**Generated**: December 2025  
**Status**: ?? Multiple Critical Integration Issues Found

---

## Executive Summary

The frontend UI and backend Codette AI server are **not properly connected**. While individual components exist and work in isolation, the integration layer has significant gaps:

1. **API Endpoint Mismatches** - Frontend calls endpoints that don't exist or have wrong paths
2. **Mock Data Fallback Overuse** - Frontend falls back to hardcoded responses too frequently
3. **Menu Actions Using alert()** - Many AI features show placeholders instead of calling backend
4. **Scattered Codette Logic** - Multiple Python files with overlapping/unused implementations

---

## ?? Critical Issues

### 1. API Endpoint Path Mismatches

| Frontend Calls | Backend Has | Status |
|----------------|-------------|--------|
| `/codette/suggest` | `/api/codette/suggest` (no direct) | ? 404 |
| `/codette/analyze` | Only `/codette/chat` | ? 404 |
| `/codette/process` | Not implemented | ? 404 |
| `/api/codette/query` | ? Exists | ? OK |
| `/codette/chat` | ? Exists | ? OK |

**Files Affected:**
- `src/lib/codetteBridge.ts` (lines 165, 195, 215)
- `src/hooks/useCodette.ts` (lines 280, 350)

### 2. MenuBar AI Features Are Placeholders

**File:** `src/components/MenuBar.tsx`

All items under `Tools > Codette AI Assistant` use `alert()` instead of actual API calls:

```typescript
// CURRENT (broken):
{ label: 'Music Theory Reference', onClick: () => { alert('Music Theory Reference...'); } }

// SHOULD BE:
{ label: 'Music Theory Reference', onClick: () => { codetteApi.getMusicTheory(); } }
```

**Affected Menu Items (7 total):**
- Music Theory Reference
- Composition Helper  
- AI Suggestions Panel
- Delay Sync Calculator
- Genre Analysis
- Harmonic Progression Analysis
- Ear Training Exercises

### 3. Mock Data Fallback Dominates Responses

**File:** `src/hooks/useCodette.ts`

The hook has extensive fallback logic that kicks in too often:

```typescript
// Line ~280: Falls back to MOCK_PERSPECTIVES when API fails
const MOCK_PERSPECTIVES: Record<string, string> = {
  newtonian_logic: 'Analyzing through deterministic cause-effect...',
  // ... hardcoded responses
};
```

**Root Cause:** API calls fail due to endpoint mismatches, triggering fallback.

### 4. Unused/Duplicate Codette Files

**Location:** `Codette/` folder

| File | Status | Issue |
|------|--------|-------|
| `codette_new.py` | ? ACTIVE | Used by server |
| `codette_enhanced.py` | ? UNUSED | Has 9 perspectives, not imported |
| `codette_advanced.py` | ? UNUSED | Archived but present |
| `codette2.py` | ? UNUSED | Old version |
| `codette_v2.py` | ? UNUSED | Old version |
| `perspectives.py` | ? UNUSED | Has perspective logic, not imported |

**Impact:** The server only uses `codette_new.py`, but richer perspective logic exists in `codette_enhanced.py` and is never called.

---

## ?? Secondary Issues

### 5. CodettePanel Works But Has Partial Integration

**File:** `src/components/CodettePanel.tsx`

The component correctly uses `useCodette` hook, but many features don't work due to upstream API issues:

- ? Chat tab works (calls `/api/codette/query`)
- ? Suggestions tab gets mock data (endpoint mismatch)
- ? Analysis tab incomplete (no `/codette/analyze` endpoint)
- ? Advanced features call non-existent endpoints

### 6. codetteApiClient.ts Exists But Not Used

**File:** `src/lib/api/codetteApiClient.ts`

Contains 50+ well-typed endpoint methods but is **barely imported** anywhere:

```typescript
// This comprehensive client exists but isn't used:
export class CodetteApiClient {
  async chat(request: ChatRequest): Promise<ChatResponse> { ... }
  async analyzeAudio(request: AudioAnalysisRequest): Promise<AudioAnalysisResponse> { ... }
  // 50+ more methods
}
```

**Components using it:** Almost none - they use `useCodette` hook instead, which has its own fetch calls.

### 7. DAWContext Codette Methods Call Bridge Correctly

**File:** `src/contexts/DAWContext.tsx`

These methods exist and properly call `codetteBridgeRef`:

- ? `getSuggestionsForTrack()` - Calls bridge
- ? `applyCodetteSuggestion()` - Calls bridge  
- ? `analyzeTrackWithCodette()` - Calls bridge
- ? `syncDAWStateToCodette()` - Calls bridge

**But:** The bridge then hits wrong endpoints ? failure ? frontend gets nothing useful.

---

## ?? Working Components

| Component | Status | Notes |
|-----------|--------|-------|
| Transport controls (Play/Stop/Record) | ? Works | Uses audioEngine directly |
| Track management (Add/Delete/Update) | ? Works | Uses DAWContext state |
| Audio file upload | ? Works | Uses audioEngine.loadAudioFile() |
| Waveform display | ? Works | Uses audioEngine.getWaveformData() |
| Volume/Pan controls | ? Works | Uses audioEngine setTrackVolume/Pan |
| Mixer component | ? Works | Updates track state |
| Backend server startup | ? Works | FastAPI starts correctly |
| `/health` endpoint | ? Works | Returns healthy status |
| `/codette/chat` endpoint | ? Works | Returns real responses |

---

## ?? Fix Priority List

### Priority 1: Fix API Endpoint Paths (CRITICAL)

**Action:** Update `codetteBridge.ts` to use correct paths:

```typescript
// codetteBridge.ts changes needed:
getSuggestions() ? call "/api/codette/suggest" instead of "/codette/suggest"
analyzeAudio() ? call "/codette/chat" with analysis context (no /analyze endpoint)
```

### Priority 2: Add Missing Backend Endpoints

**Action:** Add to `codette_server_unified.py`:

```python
@app.post("/codette/suggest")
async def codette_suggest(request: SuggestionRequest):
    # Route to existing suggest logic
    return await api_codette_suggest(request)

@app.post("/codette/analyze")  
async def codette_analyze(request: AudioAnalysisRequest):
    # Add analysis endpoint
```

### Priority 3: Replace MenuBar alert() with Real Calls

**Action:** Update `MenuBar.tsx`:

```typescript
// Replace alert() with actual API calls
{ label: 'Delay Sync Calculator', onClick: async () => {
    const bpm = prompt('Enter BPM:', '120');
    if (bpm) {
      const result = await codetteApi.getDelaySync(parseInt(bpm));
      // Show result in modal
    }
  }
}
```

### Priority 4: Wire Up codetteApiClient

**Action:** Either:
- A) Use `codetteApiClient.ts` in `useCodette.ts` hook
- B) Or remove duplicate code and standardize on one approach

### Priority 5: Import codette_enhanced.py Perspectives

**Action:** Update `codette_server_unified.py` to use enhanced perspectives:

```python
from codette_enhanced import Codette as CodetteEnhanced
# Use the 9-perspective system instead of basic respond()
```

---

## File Change Summary

| File | Changes Needed |
|------|----------------|
| `src/lib/codetteBridge.ts` | Fix endpoint paths |
| `src/hooks/useCodette.ts` | Fix endpoint paths, reduce mock fallback |
| `src/components/MenuBar.tsx` | Replace 7 alert() calls with API calls |
| `codette_server_unified.py` | Add /codette/suggest, /codette/analyze routes |
| `Codette/codette_new.py` | Consider merging perspectives from codette_enhanced.py |

---

## Testing Checklist After Fixes

- [ ] Chat in CodettePanel returns real backend response
- [ ] Suggestions tab shows actual suggestions (not mock)
- [ ] MenuBar > Tools > Codette AI items work
- [ ] Track analysis returns real analysis
- [ ] No console errors about 404 endpoints
- [ ] WebSocket connection established
- [ ] Backend logs show requests being processed

---

## Conclusion

The project has **all the pieces** but they're not connected:

1. **Frontend** has comprehensive UI components ?
2. **Backend** has working Codette AI ?
3. **Integration layer** has mismatched paths and placeholders ?

Fixing the 5 priority items above will make the AI features functional.

---

*Report generated by integration audit - December 2025*
