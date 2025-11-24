# GUI Improvement Roadmap - CoreLogic Studio

**Current Status**: React 18 UI with 33 components | 0 TypeScript errors | Web Audio API working
**Last Updated**: November 22, 2025 (23:52 UTC)

---

## 🎯 Quick Summary: What You Need to Do

Your GUI has **all the building blocks** but needs:

1. **Feature integration** (connect unused components)
2. **Backend connection** (wire Python DSP to React UI)
3. **Real-time synchronization** (WebSocket for live metering)
4. **Polish & stability** (fix integration issues)

---

## 📊 Current State Analysis

### ✅ What's Working

- **React 18 Layout**: 3-section layout (tracks, timeline, mixer)
- **Web Audio API**: Native playback, volume control, waveform display
- **Component Library**: 33 components built and tested
- **TypeScript**: 0 errors, strict mode enabled
- **UI/UX**: Tailwind CSS dark theme, professional styling
- **State Management**: DAWContext with 20+ methods

### ❌ What's Missing

- **Backend Integration**: Python DSP not wired to React
- **Effect Processing**: No effects actually processing audio
- **Live Metering**: Placeholder data only, not real audio levels
- **MIDI/Automation**: Not integrated
- **Real-time Features**: WebSocket connections not active
- **File Management**: Save/load project not fully implemented

---

## 🚀 5-Step Improvement Plan

### **STEP 1: Connect Python Backend (Foundation)**

**Current**: React UI sends no data to Python DSP backend
**Target**: REST API calls working for effect processing

#### Actions:

1. **Start FastAPI Server** (if not running)

```bash
cd daw_core
pip install fastapi uvicorn
python -m uvicorn api:app --reload --port 8000 --host 127.0.0.1
```

2. **Create API Client in React**

```typescript
// src/lib/apiClient.ts
export const audioAPI = {
  async processEffect(
    effectType: string,
    params: Record<string, number>,
    audio: Float32Array
  ) {
    const response = await fetch(
      "http://localhost:8000/process/" + effectType,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          effect_type: effectType,
          parameters: params,
          audio_data: Array.from(audio),
        }),
      }
    );
    return response.json();
  },
};
```

3. **Wire Effects in Mixer**

- In `Mixer.tsx`: When user enables plugin, call API
- Process audio through Python backend
- Update UI with processed audio

**Time Estimate**: 2-3 hours | **Impact**: HIGH

---

### **STEP 2: Implement Real-Time Metering (Live Feedback)**

**Current**: Meter shows random data
**Target**: Meters show actual audio levels in real-time

#### Actions:

1. **Enable WebSocket Connection**

```typescript
// src/lib/websocketClient.ts
export const transportWS = new WebSocket(
  "ws://localhost:8000/ws/transport/clock"
);

transportWS.onmessage = (event) => {
  const state = JSON.parse(event.data);
  // Update UI with real-time levels
};
```

2. **Update Meter Component**

```tsx
// In MixerStrip or AudioMeter component
useEffect(() => {
  const handleMeterUpdate = (data) => {
    setMeterLevel(data.levels[trackId]);
  };
  transportWS.addEventListener("message", handleMeterUpdate);
}, []);
```

3. **Connect Level Detection**

- Use `audioEngine.getAudioLevels()` to read real-time data
- Broadcast via WebSocket to connected clients
- Update all meters 30 FPS

**Time Estimate**: 1-2 hours | **Impact**: HIGH

---

### **STEP 3: Wire Plugin System (Effects Chain)**

**Current**: Plugin racks built but plugins don't process audio
**Target**: Add effects to tracks, hear them in real-time

#### Actions:

1. **Create Effect Plugin Registry**

```typescript
// src/lib/effects.ts
export const AVAILABLE_EFFECTS = {
  eq_3band: { name: "3-Band EQ", params: ["low", "mid", "high"] },
  compressor: { name: "Compressor", params: ["threshold", "ratio", "attack"] },
  reverb: { name: "Reverb", params: ["room_size", "damping", "wet"] },
  // ... more effects
};
```

2. **Update PluginRack Component**

```tsx
// src/components/PluginRack.tsx
export default function PluginRack({ trackId, plugins }) {
  const handleAddEffect = async (effectType: string) => {
    const plugin = { id: generateId(), type: effectType, enabled: true };
    // Send to backend
    await audioAPI.addEffect(trackId, plugin);
    // Update UI
    updateTrack(trackId, { inserts: [...plugins, plugin] });
  };
}
```

3. **Process Audio Through Chain**

- When playing, route through all enabled inserts
- Update DAWContext to handle effect processing
- Show active effect indicators in mixer

**Time Estimate**: 3-4 hours | **Impact**: CRITICAL

---

### **STEP 4: Implement Automation & Recording (User Control)**

**Current**: UI has controls but no backend action
**Target**: Record parameter changes, playback automation

#### Actions:

1. **Enable Recording Mode**

```typescript
// In DAWContext - already has infrastructure
const toggleRecord = () => {
  setIsRecording(!isRecording);
  // Start recording parameter changes
};
```

2. **Wire Automation UI**

```tsx
// In Mixer - make fader movements update automation curve
const handleFaderChange = (trackId: string, value: number) => {
  if (isRecording) {
    recordAutomationPoint(trackId, currentTime, value);
  }
  updateTrack(trackId, { volume: value });
};
```

3. **Playback Automation**

- Read automation curves during playback
- Apply automation values to track parameters
- Use Python automation framework for interpolation

**Time Estimate**: 2-3 hours | **Impact**: MEDIUM

---

### **STEP 5: Polish & Stability (Production Ready)**

**Current**: Core features working but UI needs refinement
**Target**: Professional DAW feel, no glitches

#### Actions:

1. **Fix Known Issues**

   - [ ] Build errors (check `npm run build` output)
   - [ ] Memory leaks (audit effect instances)
   - [ ] Audio glitches (check buffer sizes)
   - [ ] WebSocket reconnection (add auto-reconnect)

2. **Optimize Performance**

   - Reduce component re-renders (use React.memo)
   - Batch audio processing updates
   - Implement virtual scrolling for many tracks

3. **Enhance UX**

   - Add visual feedback for all actions
   - Implement undo/redo (already in DAWContext)
   - Add keyboard shortcuts
   - Better error messages

4. **Add Missing Features**
   - Project save/load (JSON serialization)
   - Multi-track recording
   - MIDI input support
   - Export audio to file

**Time Estimate**: 4-6 hours | **Impact**: MEDIUM

---

## 📋 Specific Components to Wire

### High Priority (Wire First)

| Component          | Current State           | Action                 | Dependency         |
| ------------------ | ----------------------- | ---------------------- | ------------------ |
| **PluginRack.tsx** | Built, not functional   | Connect to audio API   | Backend API        |
| **AudioMeter.tsx** | Shows random data       | Wire to WebSocket      | Transport Clock    |
| **Mixer.tsx**      | UI only                 | Add effect processing  | PluginRack + API   |
| **TopBar.tsx**     | Transport controls only | Add recording/metering | DAWContext updates |
| **MixerTile.tsx**  | Detachable, no function | Add to real mixer flow | Mixer refactor     |

### Medium Priority (Wire Second)

| Component           | Current State         | Action                    | Dependency           |
| ------------------- | --------------------- | ------------------------- | -------------------- |
| **Timeline.tsx**    | Waveform display only | Add seek, automation view | Backend connection   |
| **Sidebar.tsx**     | Browser UI only       | Add file/plugin browser   | File system API      |
| **MarkerPanel.tsx** | Built, not integrated | Wire to playhead          | Timeline + Transport |
| **LoopControl.tsx** | UI only               | Connect to transport      | Transport Clock      |

### Lower Priority (Polish Later)

| Component               | Current State         | Action                             | Dependency        |
| ----------------------- | --------------------- | ---------------------------------- | ----------------- |
| **WaveformDisplay.tsx** | Rendering only        | Optimize, add editing              | Timeline refactor |
| **ProTimeline.tsx**     | Alternative component | Choose best version, remove others | Code cleanup      |
| **Phase3Features.tsx**  | Reference only        | Implement features                 | All above steps   |

---

## 🔧 Technical Deep Dive: By Component Type

### **1. Audio Processing Components**

**What needs to happen**:

- User sets effect parameter (slider moves)
- Value sent to Python backend
- Effect processes audio buffer
- Processed audio returned to Web Audio

**Files to modify**:

- `src/components/PluginRack.tsx` - Effect UI
- `src/contexts/DAWContext.tsx` - Add effect processing methods
- `src/lib/audioEngine.ts` - Route audio through effects

**Example code**:

```typescript
// In DAWContext, add new method
const processAudioWithEffects = async (
  trackId: string,
  audioBuffer: AudioBuffer
) => {
  const track = tracks.find((t) => t.id === trackId);
  if (!track?.inserts.length) return audioBuffer;

  let processedAudio = audioBuffer;
  for (const pluginId of track.inserts) {
    const plugin = plugins.find((p) => p.id === pluginId);
    if (!plugin || !plugin.enabled) continue;

    // Call Python backend
    const response = await fetch(
      `http://localhost:8000/process/${plugin.type}`,
      {
        method: "POST",
        body: JSON.stringify({
          effect_type: plugin.type,
          parameters: plugin.parameters,
          audio_data: audioBuffer.getChannelData(0),
        }),
      }
    );

    const result = await response.json();
    // Process result back into AudioBuffer
  }

  return processedAudio;
};
```

### **2. Real-Time Metering Components**

**What needs to happen**:

- Audio engine measures levels every buffer
- WebSocket broadcasts 30 times/second
- UI receives and updates meters without blocking

**Files to modify**:

- `src/components/AudioMeter.tsx` - Connect WebSocket
- `src/lib/audioEngine.ts` - Add level measurement
- Backend: `daw_core/transport_clock.py` - Broadcast levels

**Example code**:

```typescript
// In AudioMeter.tsx
useEffect(() => {
  const ws = new WebSocket("ws://localhost:8000/ws/transport/clock");

  ws.onmessage = (event) => {
    const state = JSON.parse(event.data);
    // Update from state.levels
    setMeterLevel(state.levels[trackId]);
    setMeterPeak(state.peaks?.[trackId]);
  };

  return () => ws.close();
}, [trackId]);
```

### **3. Transport & Playback Components**

**What needs to happen**:

- Play/Stop/Record buttons control playback
- Automation playback applies saved curves
- Looping works with transport clock

**Files to modify**:

- `src/components/TopBar.tsx` - Transport controls
- `src/contexts/DAWContext.tsx` - Recording logic
- `src/lib/audioEngine.ts` - Automation playback

---

## 📈 Implementation Phases

### **Phase 1: Backend Connection (Days 1-2)**

- ✅ Python server running
- ✅ React API client created
- ✅ Simple effect processing test
- **Result**: Can send audio to Python and get it back

### **Phase 2: Effects & Metering (Days 3-4)**

- ✅ PluginRack working
- ✅ Real-time meters
- ✅ Effect chains processing
- **Result**: 19 effects available and working

### **Phase 3: Recording & Automation (Days 5-6)**

- ✅ Recording parameter changes
- ✅ Automation playback
- ✅ MIDI recording (optional)
- **Result**: Can record and playback automation

### **Phase 4: Polish & Stability (Days 7-8)**

- ✅ Fix all build errors
- ✅ Performance optimization
- ✅ UX improvements
- **Result**: Production-ready GUI

---

## 🧪 Testing Checklist

Before claiming "features working", verify:

- [ ] **Playback**: Audio plays continuously without stopping
- [ ] **Volume**: Master fader and track faders control volume
- [ ] **Metering**: Meters respond to audio in real-time
- [ ] **Effects**: Each of 19 effects can be added and heard
- [ ] **Automation**: Parameter changes record and playback
- [ ] **Recording**: Can record audio and see waveform
- [ ] **Tracks**: Can add/delete/select tracks
- [ ] **Mixer**: All mixer controls responsive
- [ ] **Save/Load**: Project saves and loads correctly
- [ ] **Performance**: No stuttering at 48kHz with 8 tracks + effects

---

## 📂 Quick File Reference

### Core Files to Modify (Priority Order)

```
1. src/contexts/DAWContext.tsx          ← Add effect processing methods
2. src/lib/audioEngine.ts               ← Add effect routing
3. src/lib/apiClient.ts                 ← NEW: Create REST client
4. src/components/PluginRack.tsx        ← Wire effect UI
5. src/components/AudioMeter.tsx        ← Wire to WebSocket
6. src/components/Mixer.tsx             ← Orchestrate all above
7. src/components/TopBar.tsx            ← Add recording controls
```

### Backend Files (Already Exist)

```
daw_core/api.py                         ← FastAPI server
daw_core/transport_clock.py             ← WebSocket broadcaster
daw_core/fx/*.py                        ← 19 effects (ready to use)
daw_core/automation/*.py                ← Automation framework
daw_core/metering/*.py                  ← Metering tools
```

---

## 💡 Pro Tips

### **Quick Win #1: Get Metering Working First**

Start by just connecting the WebSocket and showing real-time levels. This validates your backend connection and is 100% visible in the UI.

### **Quick Win #2: Process One Effect**

Wire just the compressor as a proof-of-concept. Once one effect works, all 19 will follow the same pattern.

### **Quick Win #3: Use Existing Components**

You have `MixerOptionsTile.tsx` and `MixerTile.tsx` - these are already built for detachable UIs. Use them!

### **Quick Win #4: Start Local, Then Network**

Keep Python and React on same machine first. Once working, you can move to separate servers later.

---

## 🚨 Common Pitfalls to Avoid

1. **CORS Issues**: Add CORS headers to FastAPI

   ```python
   from fastapi.middleware.cors import CORSMiddleware
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:5173"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

2. **Audio Buffer Format**: Ensure React Float32Array matches Python NumPy
3. **Timing Issues**: WebSocket updates should be 30 FPS max, not per-buffer
4. **Memory Leaks**: Cancel animation frames and close WebSockets on unmount
5. **Type Mismatches**: Keep TypeScript strict mode for safety

---

## 📞 Getting Help

- **Audio Issues**: Check `src/lib/audioEngine.ts` - all Web Audio API calls
- **Component Questions**: Look at similar working components (e.g., `TopBar.tsx`)
- **Backend Issues**: Check `daw_core/api.py` for endpoint definitions
- **TypeScript Errors**: Run `npm run typecheck` to see all issues at once

---

## 🎯 Success Criteria

You'll know you're done when:

1. ✅ Can add effects to tracks and hear them
2. ✅ Meters show real audio levels
3. ✅ Record parameter changes and playback
4. ✅ Multiple tracks play simultaneously
5. ✅ All 19 effects are accessible
6. ✅ Can save and load projects
7. ✅ No UI lag or audio glitches
8. ✅ Works with 8+ tracks + effects

---

**Status**: Ready to implement
**Estimated Total Time**: 8-16 hours spread over 1-2 weeks
**Difficulty**: Moderate (all pieces exist, just need integration)

Start with **STEP 1** → get backend connection working → everything else flows from there! 🚀
