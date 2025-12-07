# CoreLogic Studio - Phase 4: Professional Audio Features

**Project**: CoreLogic Studio  
**Phase**: 4 (Professional Audio Features & Plugin Support)  
**Start Date**: November 22, 2025  
**Status**: ⏳ **PLANNED**  
**Duration Estimate**: 3-4 hours of development

---

## Executive Summary

Phase 4 transitions CoreLogic Studio from a fully-functional DAW to a professional-grade audio production platform. Building on Phase 3's robust real-time I/O foundation, Phase 4 introduces plugin support, advanced routing, MIDI integration, and VST hosting capabilities.

**Key Milestone**: Convert CoreLogic Studio into a professional-grade DAW comparable to industry standards (Logic Pro, Ableton Live, Studio One).

---

## Phase Objectives

### Primary Goals

1. **VST/AU Plugin Support** (High Priority)
   - Integrate VST2/VST3 plugin format support
   - Build plugin instance manager
   - Implement effect chain routing
   - Real-time audio processing through plugins
   - Parameter automation support

2. **MIDI Input/Output** (High Priority)
   - MIDI device enumeration
   - Real-time MIDI input capture
   - MIDI note routing to virtual instruments
   - MIDI output to external devices
   - MIDI port selection UI

3. **Advanced Audio Routing** (Medium Priority)
   - Multi-output track routing
   - Bus/group creation and management
   - Sidechain routing for compression
   - Cross-feed configurations
   - Matrix mixer display

4. **Frequency Spectrum Analyzer** (Medium Priority)
   - Real-time FFT visualization
   - Multiple analyzer modes (linear/log)
   - Frequency band highlighting
   - Peak frequency detection
   - Spectrum averaging

### Secondary Goals

1. **Per-Track Input Routing**
   - Select input device per track
   - Multi-input recording scenarios
   - Input monitoring modes (pre/post fade)
   - Track-specific latency compensation

2. **Advanced Mixing Tools**
   - Sidechain detection and display
   - Gain staging indicators
   - Metering modes (peak, VU, K-weighted)
   - Correlation metering for stereo
   - Phase correlation display

3. **Session Management**
   - Project templates with pre-configured plugins
   - Session recall and management
   - Undo/redo history expansion
   - Session backup and recovery

---

## Architecture Design

### Phase 4 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌────────────────┐  ┌────────────────┐
│  │  PluginBrowser   │  │  MIDISettings  │  │ AdvancedMixer  │
│  │  - VST/AU list   │  │  - Device sel  │  │ - Routing view │
│  │  - Drag & drop   │  │  - Port assign │  │ - Matrix mixer │
│  └──────────────────┘  └────────────────┘  └────────────────┘
│
│  ┌──────────────────┐  ┌────────────────┐  ┌────────────────┐
│  │ EffectChainUI    │  │ SpectrumUI     │  │ AutomationUI   │
│  │ - Insert display │  │ - FFT bars     │  │ - Automation   │
│  │ - Parameter ctrl │  │ - Spectrum avg │  │ - Recording    │
│  └──────────────────┘  └────────────────┘  └────────────────┘
│
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│              Plugin/MIDI/Routing Manager Layer                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐
│  │ PluginHost Manager                                        │
│  │ - Load/unload plugins                                    │
│  │ - Manage plugin instances                                │
│  │ - Route audio through chain                              │
│  │ - Parameter updates & automation                         │
│  └──────────────────────────────────────────────────────────┘
│
│  ┌──────────────────────────────────────────────────────────┐
│  │ MIDI Router Manager                                       │
│  │ - MIDI device enumeration                                │
│  │ - Route MIDI to virtual instruments                      │
│  │ - MIDI port selection                                    │
│  │ - Real-time MIDI processing                              │
│  └──────────────────────────────────────────────────────────┘
│
│  ┌──────────────────────────────────────────────────────────┐
│  │ Audio Routing Manager                                     │
│  │ - Multi-output routing                                   │
│  │ - Bus creation/management                                │
│  │ - Sidechain configuration                                │
│  │ - Level metering across routes                           │
│  └──────────────────────────────────────────────────────────┘
│
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│           DAW Context Extensions (Phase 4 State)             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ • Loaded plugins (trackId -> [Plugin instances])            │
│ • Plugin parameters (pluginId -> {param: value})            │
│ • MIDI routing (trackId -> MIDIDevice)                      │
│ • Audio routing matrix (fromTrack -> [toTrack/Bus])        │
│ • Sidechain configuration (trackId -> sidechainSource)      │
│ • Automation data (trackId -> AutomationCurve[])            │
│ • Spectrum analyzer data (trackId -> FrequencyBucket[])     │
│                                                               │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│              Audio Engine Layer (Web Audio API)               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ • AudioWorklet nodes for plugin processing                  │
│ • ConvolverNode for impulse responses                       │
│ • DynamicsCompressor (built-in plugin replacement)          │
│ • BiquadFilter (parametric EQ)                              │
│ • GainNode chains for routing                               │
│ • AnalyserNode for spectrum data                            │
│ • OscillatorNode for synthesis/test tone                    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow: Plugin Effect on Audio

```
Input Track
    ↓
Input Gain (pre-fader)
    ↓
Effect Chain (VST plugins)
    │
    ├─→ Plugin 1 (e.g., EQ)
    │       ↓ (audio out)
    ├─→ Plugin 2 (e.g., Compressor)
    │       ↓ (audio out)
    └─→ Plugin 3 (e.g., Reverb)
    ↓ (audio out)
Volume Fader
    ↓
Pan Control
    ↓
Sidechain Chain (parallel)
    ├─→ Sidechain Output (if routed)
    ↓
Main Output
    ↓
Output Gain
    ↓
Master Track (buses)
    ↓
Hardware Output
```

---

## Implementation Plan

### Phase 4.1: Plugin Infrastructure (2-3 hours)

**Goal**: Build the foundation for VST/AU plugin support

**Components to Create**:

1. **src/lib/pluginHost.ts** (~500 lines)
   - PluginInstance class for managing loaded plugins
   - PluginParameter type for VST parameter mapping
   - EffectChain class for managing effect sequences
   - Plugin discovery and loading
   - Audio processing loop integration

2. **src/lib/midiRouter.ts** (~350 lines)
   - MIDIDevice interface
   - MIDIRoute management
   - Virtual instrument host
   - MIDI event processing
   - Port selection and hot-swap handling

3. **src/lib/audioRouter.ts** (~400 lines)
   - RouteNode interface
   - BusManager for group routing
   - SidechainRouter for compression inputs
   - CrossfeedConfiguration
   - Matrix routing logic

4. **src/types/index.ts** (Extend +100 lines)
   - Plugin interface definitions
   - PluginParameter type
   - MIDIDevice interface
   - RoutingMatrix type
   - AutomationCurve type

**DAWContext Extensions**:
```typescript
// New state properties (Phase 4.1)
loadedPlugins: Map<string, PluginInstance[]>      // trackId -> plugins
pluginParameters: Map<string, number>              // pluginId.paramId -> value
midiRouting: Map<string, MIDIDevice>              // trackId -> device
audioRouting: RoutingMatrix                        // from -> [to]
sidechainConfigs: Map<string, SidechainConfig>    // compressorId -> source
automationCurves: Map<string, AutomationCurve[]>  // trackId -> curves
```

**New Context Methods**:
```typescript
// Plugin management
loadPlugin(pluginPath: string): Promise<PluginInstance>
unloadPlugin(pluginId: string): Promise<void>
addPluginToTrack(trackId: string, plugin: PluginInstance): void
removePluginFromTrack(trackId: string, pluginId: string): void
setPluginParameter(pluginId: string, paramId: number, value: number): void
getPluginParameters(pluginId: string): PluginParameter[]

// MIDI routing
getMIDIDevices(): Promise<MIDIDevice[]>
setTrackMIDIInput(trackId: string, deviceId: string): void
getTrackMIDIInput(trackId: string): MIDIDevice | null

// Audio routing
createBus(name: string): Bus
deleteBus(busId: string): void
routeTrackToBus(trackId: string, busId: string): void
setSidechain(compressorId: string, sourceTrackId: string): void
getRoutingMatrix(): RoutingMatrix
```

---

### Phase 4.2: UI Components (1-2 hours)

**Goal**: Build professional UI for plugin, MIDI, and routing management

**Components to Create**:

1. **src/components/modals/PluginBrowserModal.tsx** (~400 lines)
   - VST/AU plugin list
   - Drag-and-drop to effect chain
   - Plugin parameter edit interface
   - Search and filtering
   - Plugin categories

2. **src/components/EffectChainDisplay.tsx** (~300 lines)
   - Visual effect chain layout
   - Drag-to-reorder plugins
   - Bypass toggles
   - Parameter shortcuts
   - Delete buttons

3. **src/components/modals/MIDISettingsModal.tsx** (~350 lines)
   - MIDI device selection
   - Input/output port assignment
   - Latency calibration
   - MIDI velocity curve editor
   - Channel strip indicators

4. **src/components/AdvancedMixer.tsx** (~500 lines)
   - Routing matrix view
   - Bus creation interface
   - Sidechain assignment UI
   - Level meters across matrix
   - Send/return faders

5. **src/components/SpectrumAnalyzer.tsx** (~300 lines)
   - Real-time FFT visualization
   - Frequency bar chart
   - Peak frequency indicator
   - Spectrum smoothing
   - Gain compensation display

**Modified Components**:

- **Mixer.tsx**: Add effect chain section, MIDI input indicator
- **TopBar.tsx**: Add MIDI/plugin status indicators
- **Sidebar.tsx**: Add plugin browser tab, routing view tab

---

### Phase 4.3: DAWContext Integration (1 hour)

**Goal**: Wire all Phase 4 components to DAW state management

**Tasks**:
1. Implement all Phase 4.1 context methods
2. Add effect processing to audio engine playback
3. Integrate MIDI input with note playback
4. Wire routing matrix to audio output
5. Implement sidechain detection and display
6. Add automation curve tracking

---

### Phase 4.4: Real-World Testing & Documentation (30-60 mins)

**Goal**: Verify all features work end-to-end

**Testing Checklist**:
- [ ] Load VST plugins and hear them in effect chain
- [ ] Connect MIDI keyboard and play notes
- [ ] Route tracks through buses and hear output
- [ ] Set up sidechains and verify detection
- [ ] Record automation curves
- [ ] View spectrum analyzer in real-time
- [ ] Test plugin parameter automation
- [ ] Verify CPU usage under load

**Documentation**:
1. **PHASE_4_IMPLEMENTATION_REPORT.md** - Detailed specs
2. **PHASE_4_QUICK_REFERENCE.md** - Quick start guide
3. **PHASE_4_COMPLETION_REPORT.md** - Final summary

---

## File Structure (Phase 4)

### New Files to Create
```
src/lib/
├── pluginHost.ts          [NEW] VST/AU plugin management (500 lines)
├── midiRouter.ts          [NEW] MIDI device routing (350 lines)
├── audioRouter.ts         [NEW] Track/bus routing (400 lines)
└── spectrumAnalyzer.ts    [NEW] FFT visualization (250 lines)

src/components/
├── modals/
│   ├── PluginBrowserModal.tsx    [NEW] Plugin selection UI (400 lines)
│   └── MIDISettingsModal.tsx     [NEW] MIDI configuration (350 lines)
├── EffectChainDisplay.tsx        [NEW] Effect chain visualization (300 lines)
├── AdvancedMixer.tsx             [NEW] Routing matrix UI (500 lines)
└── SpectrumAnalyzer.tsx          [NEW] FFT display (300 lines)

Documentation/
├── PHASE_4_ROADMAP.md                       [THIS FILE]
├── PHASE_4_IMPLEMENTATION_REPORT.md         [TBD]
├── PHASE_4_QUICK_REFERENCE.md               [TBD]
└── PHASE_4_COMPLETION_REPORT.md             [TBD]
```

### Modified Files
```
src/contexts/DAWContext.tsx
├── Added: 9 new state properties (plugins, MIDI, routing, automation)
├── Added: 13 new context methods (plugin, MIDI, routing control)
├── Modified: Audio playback to process through effect chains
├── Modified: MIDI input handling
└── Lines Added: ~400-500 lines

src/types/index.ts
├── Added: PluginInstance interface
├── Added: PluginParameter type
├── Added: MIDIDevice interface
├── Added: RoutingMatrix type
├── Added: AutomationCurve type
└── Lines Added: ~100 lines

src/lib/audioEngine.ts
├── Added: Effect chain processing
├── Added: MIDI note triggering
├── Added: Routing matrix application
├── Added: Spectrum data extraction
└── Lines Added: ~200-300 lines

src/components/Mixer.tsx
├── Added: Effect chain display section
├── Added: MIDI input indicator
└── Lines Modified: ~50 lines

src/components/TopBar.tsx
├── Added: MIDI/Plugin status indicators
└── Lines Modified: ~20 lines
```

---

## Key Technologies

### Web Audio API Enhancements
- **AudioWorklet**: Custom audio processing (plugins)
- **AnalyserNode**: FFT for spectrum analysis
- **ConvolverNode**: Impulse response processing
- **DynamicsCompressor**: Built-in compressor access
- **BiquadFilter**: Parametric EQ implementation

### Plugin Architecture
- **VST3 Emulation**: JavaScript-based VST parameter mapping
- **Effect Chain**: Serial processing through effects
- **Parameter Automation**: Time-based parameter curves
- **Real-time Processing**: Audio thread integration

### MIDI Integration
- **Web MIDI API**: Keyboard/controller input
- **MIDI Event Processing**: Note on/off, CC handling
- **Virtual Instruments**: Software synthesizer hosting
- **Port Selection**: Multiple MIDI input/output support

### Advanced Audio Routing
- **Matrix Routing**: N-to-M track/bus connections
- **Sidechain Routing**: Parallel signal paths
- **Bus Grouping**: Multi-track control
- **Metering**: Level display across all routes

---

## Performance Targets (Phase 4)

| Metric | Target | Notes |
|--------|--------|-------|
| **Plugin Latency** | <5ms per plugin | Cumulative through chain |
| **MIDI Latency** | <10ms | Keyboard to sound |
| **Routing Overhead** | <2% CPU | Per track routing matrix |
| **Spectrum FFT** | 60 FPS | Real-time analyzer updates |
| **Memory (Plugins)** | ~500KB per plugin | Typical VST footprint |
| **Max Plugin Chain** | 10+ effects | Before performance degradation |
| **Total CPU Load** | <50% sustained | Full DAW with effects |

---

## Browser Support (Phase 4)

| Browser | Plugin Support | MIDI Support | Notes |
|---------|----------------|--------------|-------|
| Chrome 80+ | ✅ Partial | ✅ Full | Web MIDI API available |
| Firefox 76+ | ✅ Partial | ✅ Full | Web MIDI API available |
| Safari 14.1+ | ❌ Limited | ❌ No MIDI | iOS restrictions |
| Edge 80+ | ✅ Partial | ✅ Full | Chromium-based |

**Requirement**: HTTPS for Web MIDI API access

---

## Risk Mitigation

### Plugin Loading Risk
**Risk**: Plugin loading fails, crashes browser
**Mitigation**: 
- Sandboxed AudioWorklet processing
- Error boundary components
- Plugin validation before loading
- Graceful degradation

### MIDI Port Issues
**Risk**: MIDI ports become unavailable (driver crash, disconnect)
**Mitigation**:
- Port change callbacks with UI update
- Graceful failover to default input
- Error messages with recovery steps

### Routing Complexity
**Risk**: Circular routing creates feedback loops
**Mitigation**:
- Routing validation before application
- Cycle detection algorithm
- Prevention of self-routing
- Clear error messages

### Performance Degradation
**Risk**: Too many plugins/routes cause audio dropout
**Mitigation**:
- CPU usage monitoring
- Warning threshold at 80% CPU
- Plugin offload to Web Worker
- Automatic effect bypass under load

---

## Success Criteria

### Phase 4.1 Complete When:
- ✅ 3 plugin libraries created (pluginHost, midiRouter, audioRouter)
- ✅ All 4 types extended with new interfaces
- ✅ DAWContext has all 13 new methods
- ✅ TypeScript: 0 errors
- ✅ Build: Passing

### Phase 4.2 Complete When:
- ✅ 5 new UI components created
- ✅ 3 components modified with new features
- ✅ All UI fully styled and responsive
- ✅ TypeScript: 0 errors
- ✅ Build: Passing

### Phase 4.3 Complete When:
- ✅ All context methods implemented
- ✅ Audio engine integrated with effects
- ✅ MIDI input fully wired
- ✅ Routing matrix applied to playback
- ✅ Spectrum data flowing to UI

### Phase 4.4 Complete When:
- ✅ Load 3+ plugins in effect chain and hear audio
- ✅ Connect MIDI keyboard and play notes
- ✅ Route tracks through buses successfully
- ✅ Set up sidechain and see detection
- ✅ Record and playback automation curves
- ✅ View real-time spectrum analysis
- ✅ CPU usage stays <50% under load
- ✅ No crashes over 1-hour sustained use

---

## Recommended Next Steps

1. **Review Phase 3 Summary** - Understand current foundation
2. **Read This Roadmap** - Understand Phase 4 vision
3. **Discuss Approach** - VST implementation strategy
4. **Start Phase 4.1** - Build plugin infrastructure
5. **Iterate Through Phases** - 4.2 → 4.3 → 4.4 sequentially

---

## Phase 4 Context at a Glance

### What We're Building
A professional-grade DAW plugin system with VST/AU support, MIDI integration, and advanced audio routing comparable to industry standards.

### Why It Matters
Plugins are the core of modern music production. Enabling VST/AU support transforms CoreLogic Studio from a capable DAW into a professional production platform.

### Technical Difficulty
**Moderate to High**: Plugin architecture, MIDI handling, and routing matrices require careful state management and real-time audio processing.

### Time Estimate
**3-4 hours** for complete Phase 4 implementation including testing and documentation.

### Risk Level
**Medium**: Plugin loading and routing complexity adds risk, but mitigated by proper error handling and gradual feature rollout.

---

## Timeline

```
Phase 4.1: Plugin Infrastructure       ~2-3 hours
  ├─ pluginHost.ts creation           ~45 mins
  ├─ midiRouter.ts creation           ~30 mins
  ├─ audioRouter.ts creation          ~40 mins
  └─ Type definitions extension       ~30 mins

Phase 4.2: UI Components              ~1-2 hours
  ├─ PluginBrowserModal              ~30 mins
  ├─ MIDISettingsModal               ~25 mins
  ├─ EffectChainDisplay              ~25 mins
  ├─ AdvancedMixer                   ~30 mins
  └─ SpectrumAnalyzer                ~20 mins

Phase 4.3: DAW Integration            ~1 hour
  ├─ Context method implementation    ~30 mins
  ├─ Audio engine effects wiring      ~20 mins
  └─ MIDI & routing integration       ~10 mins

Phase 4.4: Testing & Documentation    ~30-60 mins
  ├─ Real-world testing              ~30 mins
  └─ Documentation creation          ~30 mins

Total: 3-4 hours ⏱️
```

---

## Success Metrics

| Metric | Target | Impact |
|--------|--------|--------|
| Build Size | <500 KB | Reasonable bundle size |
| TypeScript Errors | 0 | Production quality |
| Audio Glitches | 0 | Professional audio |
| CPU Usage (Idle) | <2% | Efficient resource use |
| MIDI Latency | <10ms | Responsive keyboard feel |
| Test Coverage | 8/8 features | All features verified |

---

## Notes for Development

### Important Considerations
1. **Plugin Safety**: VST plugins are third-party code - handle errors gracefully
2. **State Management**: Keep plugin state synchronized with DAWContext
3. **Performance**: Monitor CPU during plugin processing, implement warning system
4. **MIDI Timing**: MIDI events must be processed in real-time, not deferred
5. **Routing Validation**: Always validate routing before applying to audio graph

### Testing Recommendations
- Test with various VST plugins (compressor, EQ, reverb)
- Test MIDI keyboard with 88 keys minimum
- Test routing with 5+ tracks into 2 buses
- Verify CPU stays <50% during complex scenarios
- Test sidechain with FM synthesis/compression

### Documentation Focus
- API documentation for plugin integration
- User guide for effect chain management
- Troubleshooting guide for plugin loading
- Performance optimization tips

---

**Phase 4 Ready to Begin!** 🚀

This roadmap provides the complete vision for Phase 4. Ready to start Phase 4.1 (Plugin Infrastructure)?
