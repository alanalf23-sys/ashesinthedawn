# Frontend-Backend Integration Architecture

**Status**: Ready to implement
**Complexity**: Moderate (all pieces exist, need connection)

---

## 🏗️ Current Architecture (What You Have)

```
┌──────────────────────────────────────────────────────────────┐
│                    REACT FRONTEND (Port 5173)                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              DAW Context State Management            │    │
│  │  • tracks[], selectedTrack, isPlaying, etc.         │    │
│  │  • 20+ methods (addTrack, togglePlay, etc.)         │    │
│  └─────────────────────────────────────────────────────┘    │
│                            ↕ (Not Connected)                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │            React Components (33 total)              │    │
│  │  • Mixer, TopBar, Timeline, TrackList, etc.        │    │
│  │  • All built and styled (Tailwind CSS)             │    │
│  └─────────────────────────────────────────────────────┘    │
│                            ↕ (Local Only)                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Web Audio API (audioEngine.ts)            │    │
│  │  • playAudio(), stopAudio(), setVolume()           │    │
│  │  • getWaveformData(), getAudioLevels()             │    │
│  │  • Real playback works locally                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                            ↓                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │          Browser Audio Output (Speakers)            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                            ❌ ISOLATED
                    (No connection to backend)


┌──────────────────────────────────────────────────────────────┐
│                   PYTHON BACKEND (Port 8000)                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           FastAPI Server + WebSocket                │    │
│  │  • 19 REST endpoints for effects                    │    │
│  │  • /ws/transport/clock for real-time sync           │    │
│  │  • Waiting for connections...                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                            ↕ (Not Used)                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │          19 Professional Audio Effects              │    │
│  │  • EQ3Band, Compressor, Reverb, etc.               │    │
│  │  • 197 passing tests, production ready             │    │
│  │  • Just need audio data to process                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                            ↕ (Not Used)                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │        Automation & Metering Frameworks             │    │
│  │  • AutomationCurve, LFO, Envelope                  │    │
│  │  • LevelMeter, SpectrumAnalyzer, etc.              │    │
│  │  • Data available but not streamed                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔌 Target Architecture (What You're Building)

```
┌────────────────────────────────────────────────────────────────┐
│                    REACT FRONTEND (Port 5173)                  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────┐     │
│  │         DAW Context (Orchestrator)                   │     │
│  │  • Manages state                                     │     │
│  │  • Calls apiClient for processing                   │     │
│  │  • Listens to WebSocket for updates                 │     │
│  └──────────────────────────────────────────────────────┘     │
│                    ↕ ↕ ↕ (Bidirectional)                      │
│  ┌──────────────┬──────────────────┬──────────────────────┐   │
│  │              │                  │                      │   │
│  │  REST API    │  WebSocket       │  Event Listeners    │   │
│  │  Calls       │  Subscribe       │  (UI updates)       │   │
│  │              │                  │                      │   │
│  └──────────────┴──────────────────┴──────────────────────┘   │
│         ↓                  ↓                                   │
│    ┌─────────────────────────────────────────────────────┐   │
│    │       Network Layer (HTTP + WebSocket)              │   │
│    │  • Port 8000 (backend server)                       │   │
│    │  • CORS enabled for localhost:5173                 │   │
│    └─────────────────────────────────────────────────────┘   │
│         ↓                  ↓                                   │
└─────────┼──────────────────┼────────────────────────────────┘
          │                  │
          ↓                  ↓
┌────────────────────────────────────────────────────────────────┐
│                   PYTHON BACKEND (Port 8000)                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────┐     │
│  │      FastAPI REST Endpoints                          │     │
│  │  ✅ POST /process/eq_3band                          │     │
│  │  ✅ POST /process/compressor                        │     │
│  │  ✅ POST /process/reverb                            │     │
│  │  ... (19 total)                                      │     │
│  └──────────────────────────────────────────────────────┘     │
│         ↓ (Processes audio)                                   │
│  ┌──────────────────────────────────────────────────────┐     │
│  │      19 Professional Audio Effects (DSP)             │     │
│  │  • Processes audio buffers                           │     │
│  │  • Returns processed output                          │     │
│  └──────────────────────────────────────────────────────┘     │
│         ↑ (Provides data)                                     │
│  ┌──────────────────────────────────────────────────────┐     │
│  │      Audio Engine + Metering                         │     │
│  │  • Measures real-time levels                         │     │
│  │  • Computes spectrum analysis                        │     │
│  └──────────────────────────────────────────────────────┘     │
│         ↓                                                      │
│  ┌──────────────────────────────────────────────────────┐     │
│  │      WebSocket /ws/transport/clock                   │     │
│  │  • Broadcasts state 30 FPS                           │     │
│  │  • Includes: levels, peaks, BPM, time               │     │
│  └──────────────────────────────────────────────────────┘     │
│         ↑ (Streams to React)                                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 📡 Data Flow Diagram

### **Scenario 1: User Applies Compressor Effect**

```
User clicks "Add Compressor"
    ↓
React: PluginRack component
    ↓
Call: audioAPI.processEffect('compressor', params, audioBuffer)
    ↓
HTTP POST to http://localhost:8000/process/compressor
    ↓
Python FastAPI receives request
    ↓
Extract: effect_type, parameters, audio_data
    ↓
Load: Compressor class from daw_core.fx.dynamics_part2
    ↓
Process: compressor.process(audio_data, **parameters)
    ↓
Return: JSON { output: [...compressed audio...] }
    ↓
React receives response
    ↓
Update Web Audio buffer with processed audio
    ↓
Play through speakers
    ↓
User hears compressed audio ✅
```

### **Scenario 2: Real-Time Level Metering**

```
Audio plays through Web Audio API
    ↓
audioEngine.getAudioLevels() samples audio buffer
    ↓
Backend: daw_core/metering/level_meter.py measures RMS
    ↓
Every 33ms, broadcast via WebSocket:
{
  "playing": true,
  "levels": { "track_1": -12.5, "track_2": -8.3, ... },
  "peaks": { "track_1": -3.2, "track_2": 0.1, ... },
  "time_seconds": 45.230,
  ...
}
    ↓
React: useTransportWebSocket hook receives data
    ↓
AudioMeter component updates display
    ↓
Meters show real-time levels in UI ✅
```

### **Scenario 3: Recording Automation**

```
User presses Record
    ↓
DAWContext: setIsRecording(true)
    ↓
User moves volume fader
    ↓
Mixer component detects change
    ↓
If recording: recordAutomationPoint(trackId, time, value)
    ↓
Store in automation curve (daw_core/automation/automation_curve.py)
    ↓
User stops recording
    ↓
Press Play
    ↓
During playback: getAutomationValue(time) for each point
    ↓
Apply value to track parameter
    ↓
Parameter changes heard in real-time ✅
```

---

## 🔄 Integration Points

### **Point 1: Effect Processing Chain**

```typescript
// In DAWContext.tsx, add:

const processEffectChain = async (
  trackId: string,
  audioData: Float32Array,
  plugins: Plugin[]
): Promise<Float32Array> => {
  let currentAudio = audioData;

  for (const plugin of plugins) {
    if (!plugin.enabled) continue;

    try {
      const response = await audioAPI.processEffect(
        plugin.type,
        plugin.parameters,
        Array.from(currentAudio)
      );

      // Convert response back to Float32Array
      currentAudio = new Float32Array(response.output);
    } catch (error) {
      console.error(`Error processing ${plugin.type}:`, error);
    }
  }

  return currentAudio;
};

// In audioEngine.ts playAudio(), use:
const selectedTrack = tracks.find((t) => t.id === trackId);
if (selectedTrack?.inserts.length > 0) {
  audioData = await processEffectChain(
    trackId,
    audioData,
    selectedTrack.inserts
  );
}
```

### **Point 2: Real-Time Metering**

```typescript
// Create src/lib/useTransportWebSocket.ts (already provided above)
// Then in AudioMeter.tsx:

export default function AudioMeter({ trackId }: { trackId: string }) {
  const { state } = useTransportWebSocket();

  useEffect(() => {
    if (state?.levels) {
      setLevel(state.levels[trackId] ?? -60);
    }
  }, [state?.levels]);

  // Render meter based on level
}
```

### **Point 3: Automation Playback**

```typescript
// In DAWContext.tsx, during playback:

const playbackLoop = () => {
  tracks.forEach((track) => {
    // Get automation values at current time
    const automationValue = getAutomationValue(track.id, currentTime);

    if (automationValue !== null) {
      // Apply to track
      updateTrack(track.id, { volume: automationValue });
    }

    // Play audio with current parameters
    audioEngine.playAudio(track.id, currentTime, track.volume, track.pan);
  });
};
```

---

## 🎯 Implementation Checklist

### **Phase 1: Foundation (Make Connection)**

- [ ] Create `src/lib/apiClient.ts` (REST API wrapper)
- [ ] Create `src/lib/useTransportWebSocket.ts` (WebSocket hook)
- [ ] Test: Can call `audioAPI.getEffects()` successfully
- [ ] Test: WebSocket shows `Connected to transport clock` in console

### **Phase 2: Metering (Show Real Data)**

- [ ] Update `AudioMeter.tsx` to use WebSocket
- [ ] Update `Mixer.tsx` to display real meters
- [ ] Verify: Meters respond to audio playback
- [ ] Add: Peak hold indicator

### **Phase 3: Effects (Make Sound)**

- [ ] Create effect selection UI in `PluginRack.tsx`
- [ ] Wire effect processing in `DAWContext.tsx`
- [ ] Integrate effect chain into `audioEngine.ts`
- [ ] Test: Can add compressor and hear it
- [ ] Test: All 19 effects work

### **Phase 4: Recording (Capture Changes)**

- [ ] Implement recording logic in `DAWContext.tsx`
- [ ] Wire automation curve storage
- [ ] Implement playback of automation
- [ ] Test: Record fader movement and playback

### **Phase 5: Polish (Production Ready)**

- [ ] Fix all TypeScript errors
- [ ] Fix all build warnings
- [ ] Optimize performance
- [ ] Add error handling for network issues
- [ ] Test with 8+ tracks + effects

---

## 📊 Expected Results by Phase

### After Phase 1

- ✅ Backend and frontend can talk
- ✅ No errors in console
- ✅ API calls succeed

### After Phase 2

- ✅ Meters show real audio levels
- ✅ Levels change with playback
- ✅ Smooth visual updates

### After Phase 3

- ✅ Can add effects to tracks
- ✅ Hear effect processing
- ✅ Multiple effects in chain
- ✅ All 19 effects available

### After Phase 4

- ✅ Can record automation
- ✅ Automation plays back
- ✅ Smooth parameter changes

### After Phase 5

- ✅ Professional DAW feel
- ✅ 8+ tracks with effects
- ✅ No performance issues
- ✅ Production ready

---

## 🧩 Component Connection Map

```
User Input
    ↓
┌─────────────────────────────────────────┐
│  Top-Level Components (App.tsx)         │
│  • MenuBar                              │
│  • TrackList                            │
│  • Timeline                             │
│  • Mixer                                │
│  • Sidebar                              │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  Mid-Level Components                   │
│  • MixerStrip (per track)               │
│  • PluginRack (effect UI)               │
│  • AudioMeter (metering)                │
│  • VolumeFader (control)                │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  DAWContext (State Manager)             │
│  • updateTrack()                        │
│  • addPluginToTrack()                   │
│  • togglePlay()                         │
│  • [Connect to API here]                │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  API Client (Network Layer)             │
│  • audioAPI.processEffect()             │
│  • audioAPI.transportControl()          │
│  • useTransportWebSocket()              │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  Audio Engine (Local Playback)          │
│  • playAudio()                          │
│  • setTrackVolume()                     │
│  • getAudioLevels()                     │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  Python Backend (Port 8000)             │
│  • FastAPI endpoints                    │
│  • 19 audio effects                     │
│  • Metering & analysis                  │
│  • WebSocket broadcast                  │
└─────────────────────────────────────────┘
```

---

## 🚀 Start Here

1. **Read** this diagram
2. **Implement** Phase 1 (30 minutes)
3. **Test** backend connection works
4. **Move to** Phase 2 (real metering)
5. **Continue** through phases

**Total time to full feature set**: 8-16 hours

---

**Status**: All pieces exist, ready to connect → Just need to implement the glue code! 🔧
