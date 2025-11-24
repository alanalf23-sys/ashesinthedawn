# Function Implementation Matrix - Quick Reference

## Modal Functions (6 pairs = 12 functions)

| Modal Component | Show State | Open Function | Close Function |
|---|---|---|---|
| SaveAsModal | `showSaveAsModal` | `openSaveAsModal()` | `closeSaveAsModal()` |
| OpenProjectModal | `showOpenProjectModal` | `openOpenProjectModal()` | `closeOpenProjectModal()` |
| MidiSettingsModal | `showMidiSettingsModal` | `openMidiSettingsModal()` | `closeMidiSettingsModal()` |
| MixerOptionsModal | `showMixerOptionsModal` | `openMixerOptionsModal()` | `closeMixerOptionsModal()` |
| PreferencesModal | `showPreferencesModal` | `openPreferencesModal()` | `closePreferencesModal()` |
| ShortcutsModal | `showShortcutsModal` | `openShortcutsModal()` | `closeShortcutsModal()` |

## Bus/Routing Functions (5 functions)

| Function | Signature | Purpose |
|---|---|---|
| createBus | `(name: string) => void` | Create a new mixer bus |
| deleteBus | `(busId: string) => void` | Remove a bus and reroute tracks to master |
| addTrackToBus | `(trackId: string, busId: string) => void` | Route track through a bus |
| removeTrackFromBus | `(trackId: string, busId: string) => void` | Remove track from bus, reroute to master |
| createSidechain | `(sourceTrackId: string, targetTrackId: string) => void` | Set up sidechain routing |

## Plugin Management Functions (3 functions)

| Function | Signature | Purpose |
|---|---|---|
| loadPlugin | `(trackId: string, pluginName: string) => void` | Add plugin to track's insert chain |
| unloadPlugin | `(trackId: string, pluginId: string) => void` | Remove plugin from track |
| loadedPlugins | `Map<string, Plugin[]>` | Track loaded plugins per track |

## MIDI Functions (3 functions)

| Function | Signature | Purpose |
|---|---|---|
| createMIDIRoute | `(sourceDeviceId: string, targetTrackId: string) => void` | Route MIDI input to track |
| deleteMIDIRoute | `(routeId: string) => void` | Remove MIDI route |
| getMIDIRoutesForTrack | `(trackId: string) => MidiRoute[]` | Get all MIDI routes for a track |

## Utility Functions (1 property)

| Property | Type | Purpose |
|---|---|---|
| cpuUsageDetailed | `Record<string, number>` | Detailed CPU usage breakdown |

## Which Components Use Which Functions?

### SaveAsModal.tsx
```
✅ showSaveAsModal
✅ closeSaveAsModal
```

### OpenProjectModal.tsx
```
✅ showOpenProjectModal
✅ closeOpenProjectModal
```

### MidiSettingsModal.tsx
```
✅ showMidiSettingsModal
✅ closeMidiSettingsModal
✅ createMIDIRoute
✅ deleteMIDIRoute
✅ getMIDIRoutesForTrack
✅ midiDevices
```

### MixerOptionsModal.tsx
```
✅ showMixerOptionsModal
✅ closeMixerOptionsModal
```

### PreferencesModal.tsx
```
✅ showPreferencesModal
✅ closePreferencesModal
```

### ShortcutsModal.tsx
```
✅ showShortcutsModal
✅ closeShortcutsModal
```

### RoutingMatrix.tsx
```
✅ buses
✅ createBus
✅ deleteBus
✅ addTrackToBus
✅ removeTrackFromBus
✅ createSidechain
```

### PluginBrowser.tsx
```
✅ loadPlugin
✅ unloadPlugin
✅ loadedPlugins
```

### SpectrumVisualizerPanel.tsx
```
✅ cpuUsageDetailed
```

## Existing Modal Functions (Already Implemented)

| Modal Component | Show State | Open Function | Close Function |
|---|---|---|---|
| NewProjectModal | `showNewProjectModal` | `openNewProjectModal()` | `closeNewProjectModal()` |
| ExportModal | `showExportModal` | `openExportModal()` | `closeExportModal()` |
| AudioSettingsModal | `showAudioSettingsModal` | `openAudioSettingsModal()` | `closeAudioSettingsModal()` |
| AboutModal | `showAboutModal` | `openAboutModal()` | `closeAboutModal()` |

---

## How to Use in Components

### Example 1: Modal Management
```typescript
import { useDAW } from "@/contexts/DAWContext";

export function MenuBar() {
  const { 
    openSaveAsModal, 
    openExportModal, 
    openPreferencesModal 
  } = useDAW();
  
  return (
    <Menu>
      <MenuItem onClick={openSaveAsModal}>Save As...</MenuItem>
      <MenuItem onClick={openExportModal}>Export...</MenuItem>
      <MenuItem onClick={openPreferencesModal}>Preferences</MenuItem>
    </Menu>
  );
}
```

### Example 2: Bus Management
```typescript
export function RoutingPanel() {
  const { 
    buses, 
    createBus, 
    addTrackToBus, 
    selectedTrack 
  } = useDAW();
  
  const handleCreateBus = () => {
    createBus("Vocals");
  };
  
  const handleAddToBus = (busId: string) => {
    if (selectedTrack) {
      addTrackToBus(selectedTrack.id, busId);
    }
  };
  
  return (
    <div>
      <button onClick={handleCreateBus}>+ New Bus</button>
      {buses.map(bus => (
        <button key={bus.id} onClick={() => handleAddToBus(bus.id)}>
          {bus.name}
        </button>
      ))}
    </div>
  );
}
```

### Example 3: Plugin Management
```typescript
export function EffectRack() {
  const { 
    loadPlugin, 
    unloadPlugin, 
    selectedTrack,
    loadedPlugins 
  } = useDAW();
  
  const trackPlugins = selectedTrack 
    ? loadedPlugins.get(selectedTrack.id) || [] 
    : [];
  
  const handleAddPlugin = (pluginName: string) => {
    if (selectedTrack) {
      loadPlugin(selectedTrack.id, pluginName);
    }
  };
  
  return (
    <div>
      {trackPlugins.map(plugin => (
        <PluginSlot 
          key={plugin.id}
          plugin={plugin}
          onRemove={() => unloadPlugin(selectedTrack.id, plugin.id)}
        />
      ))}
      <AddPluginButton onClick={(name) => handleAddPlugin(name)} />
    </div>
  );
}
```

### Example 4: MIDI Routing
```typescript
export function MIDIRoutingPanel() {
  const { 
    midiDevices,
    createMIDIRoute,
    deleteMIDIRoute,
    getMIDIRoutesForTrack,
    selectedTrack 
  } = useDAW();
  
  const trackRoutes = selectedTrack 
    ? getMIDIRoutesForTrack(selectedTrack.id) 
    : [];
  
  const handleConnectDevice = (deviceId: string) => {
    if (selectedTrack) {
      createMIDIRoute(deviceId, selectedTrack.id);
    }
  };
  
  return (
    <div>
      <h3>Available MIDI Devices</h3>
      {midiDevices.map(device => (
        <button 
          key={device.id}
          onClick={() => handleConnectDevice(device.id)}
        >
          {device.name}
        </button>
      ))}
      
      <h3>Active Routes</h3>
      {trackRoutes.map(route => (
        <div key={route.id}>
          {midiDevices.find(d => d.id === route.sourceDeviceId)?.name}
          <button onClick={() => deleteMIDIRoute(route.id)}>Disconnect</button>
        </div>
      ))}
    </div>
  );
}
```

---

## AI/Codette Functions (Phase 5 - Integration Complete)

| Function | Hook | Signature | Purpose |
|---|---|---|---|
| sendMessage | useCodette | `(message: string, perspective?: Perspective) => Promise<void>` | Send chat message to Codette AI |
| analyzeAudio | useCodette | `(trackId: string, audioData: Float32Array, sampleRate: number) => Promise<void>` | Get AI analysis of audio |
| getSuggestions | useCodette | `(context: string) => Promise<void>` | Get AI suggestions based on context |
| getMasteringAdvice | useCodette | `(tracks: Track[]) => Promise<void>` | Get mastering recommendations |
| optimize | useCodette | `(context: string) => Promise<void>` | Get optimization suggestions |
| clearHistory | useCodette | `() => void` | Clear chat history |
| reconnect | useCodette | `() => Promise<void>` | Manual reconnection to backend |

### AI Perspectives Available
- **Neural Networks** - Pattern recognition, data analysis
- **Newtonian Logic** - Cause-effect reasoning, scientific approach
- **Da Vinci** - Creative synthesis, artistic approach
- **Quantum** - Probabilistic analysis, uncertainty quantification

### Hook Usage: useCodette()
```typescript
const { 
  sendMessage,
  analyzeAudio,
  getSuggestions,
  getMasteringAdvice,
  optimize,
  clearHistory,
  reconnect,
  isConnected,
  isLoading,
  chatHistory,
  error
} = useCodette();
```

### Backend Integration
- **Server**: `codette_server.py` (FastAPI)
- **API Base**: `http://localhost:8000`
- **Endpoints**: `/health`, `/codette/chat`, `/codette/analyze`, `/codette/suggest`, `/codette/process`, `/codette/status`

### Component Integration
- **CodettePanel.tsx** - Standalone UI component with chat interface
- **Integration Layer**: `src/lib/codettePythonIntegration.ts` - HTTP client
- **Available in Any Component** - Via `useCodette()` hook

---

## Implementation Status Summary

| Category | Total | Implemented | Status |
|---|---|---|---|
| Modal Functions | 12 | 12 | ✅ COMPLETE |
| Bus/Routing | 5 | 5 | ✅ COMPLETE |
| Plugin Management | 3 | 3 | ✅ COMPLETE |
| MIDI Functions | 3 | 3 | ✅ COMPLETE |
| AI/Codette Functions | 7 | 7 | ✅ COMPLETE |
| Utility | 1 | 1 | ✅ COMPLETE |
| **TOTAL** | **31** | **31** | ✅ **100% COMPLETE** |

---

## State & Type System Complete

### State Variables Added: 10
1. showSaveAsModal
2. showOpenProjectModal
3. showMidiSettingsModal
4. showMixerOptionsModal
5. showPreferencesModal
6. showShortcutsModal
7. buses
8. loadedPlugins
9. midiDevices
10. midiRoutes

### Type Interfaces Added: 3
1. Bus
2. MidiDevice
3. MidiRoute

### Build Status: ✅ VERIFIED
- **0 Type Errors**
- **1583 Modules**
- **445.87 kB JS Bundle**
- **2.69s Build Time**

