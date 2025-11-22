# CoreLogic Studio - Quick Reference Card
## New API Functions (24 Total)

---

## 📱 Modal Functions

```typescript
// Save As Dialog
import { useDAW } from "@/contexts/DAWContext";
const { showSaveAsModal, openSaveAsModal, closeSaveAsModal } = useDAW();

// Open Project Dialog
const { showOpenProjectModal, openOpenProjectModal, closeOpenProjectModal } = useDAW();

// MIDI Settings Dialog
const { showMidiSettingsModal, openMidiSettingsModal, closeMidiSettingsModal } = useDAW();

// Mixer Options Dialog
const { showMixerOptionsModal, openMixerOptionsModal, closeMixerOptionsModal } = useDAW();

// Preferences Dialog
const { showPreferencesModal, openPreferencesModal, closePreferencesModal } = useDAW();

// Shortcuts Dialog
const { showShortcutsModal, openShortcutsModal, closeShortcutsModal } = useDAW();
```

### Usage Pattern
```typescript
<button onClick={openSaveAsModal}>
  Save As...
</button>
{showSaveAsModal && <SaveAsModal onClose={closeSaveAsModal} />}
```

---

## 🎛️ Bus/Routing Functions

```typescript
const {
  buses,              // Bus[] - All buses
  createBus,          // (name: string) => void
  deleteBus,          // (busId: string) => void
  addTrackToBus,      // (trackId: string, busId: string) => void
  removeTrackFromBus, // (trackId: string, busId: string) => void
  createSidechain,    // (sourceTrackId: string, targetTrackId: string) => void
} = useDAW();
```

### Example: Create Bus and Route Track
```typescript
// Create a new bus
const createNewBus = () => {
  createBus("Vocals");
};

// Route selected track to bus
const routeToBus = (busId: string) => {
  if (selectedTrack) {
    addTrackToBus(selectedTrack.id, busId);
  }
};

// Display buses
{buses.map(bus => (
  <div key={bus.id}>
    <span>{bus.name}</span>
    <button onClick={() => routeToBus(bus.id)}>Route</button>
    <button onClick={() => deleteBus(bus.id)}>Delete</button>
  </div>
))}
```

---

## 🔌 Plugin Management Functions

```typescript
const {
  loadPlugin,       // (trackId: string, pluginName: string) => void
  unloadPlugin,     // (trackId: string, pluginId: string) => void
  loadedPlugins,    // Map<string, Plugin[]>
} = useDAW();
```

### Example: Load/Unload Plugins
```typescript
// Load a reverb plugin
const addReverb = () => {
  if (selectedTrack) {
    loadPlugin(selectedTrack.id, "Reverb");
  }
};

// Get plugins on current track
const trackPlugins = selectedTrack 
  ? (loadedPlugins.get(selectedTrack.id) || [])
  : [];

// Display and manage plugins
{trackPlugins.map(plugin => (
  <div key={plugin.id}>
    <span>{plugin.name}</span>
    <button onClick={() => unloadPlugin(selectedTrack.id, plugin.id)}>
      Remove
    </button>
  </div>
))}
```

---

## 🎹 MIDI Functions

```typescript
const {
  midiDevices,            // MidiDevice[] - Available MIDI devices
  createMIDIRoute,        // (sourceDeviceId: string, targetTrackId: string) => void
  deleteMIDIRoute,        // (routeId: string) => void
  getMIDIRoutesForTrack,  // (trackId: string) => MidiRoute[]
} = useDAW();
```

### Example: MIDI Device Routing
```typescript
// Connect MIDI device to track
const connectDevice = (deviceId: string) => {
  if (selectedTrack) {
    createMIDIRoute(deviceId, selectedTrack.id);
  }
};

// Get routes for current track
const activeRoutes = selectedTrack 
  ? getMIDIRoutesForTrack(selectedTrack.id)
  : [];

// Display available MIDI devices
{midiDevices.map(device => (
  <button 
    key={device.id}
    onClick={() => connectDevice(device.id)}
  >
    {device.name}
  </button>
))}

// Display active routes
{activeRoutes.map(route => (
  <div key={route.id}>
    <span>{midiDevices.find(d => d.id === route.sourceDeviceId)?.name}</span>
    <button onClick={() => deleteMIDIRoute(route.id)}>
      Disconnect
    </button>
  </div>
))}
```

---

## 📊 Utility Functions

```typescript
const {
  cpuUsageDetailed,  // Record<string, number>
} = useDAW();

// Access CPU metrics
const audioUsage = cpuUsageDetailed.audio;        // 2%
const uiUsage = cpuUsageDetailed.ui;              // 3%
const effectsUsage = cpuUsageDetailed.effects;    // 4%
const meteringUsage = cpuUsageDetailed.metering;  // 1%
const otherUsage = cpuUsageDetailed.other;        // 2%
```

### Example: CPU Meter
```typescript
<div className="cpu-meter">
  <div>Audio: {cpuUsageDetailed.audio}%</div>
  <div>UI: {cpuUsageDetailed.ui}%</div>
  <div>Effects: {cpuUsageDetailed.effects}%</div>
  <div>Metering: {cpuUsageDetailed.metering}%</div>
</div>
```

---

## 🔄 Complete Component Pattern

```typescript
import { useDAW } from "@/contexts/DAWContext";

export function MyDAWComponent() {
  const {
    // Modal functions
    openSaveAsModal,
    // Bus functions
    createBus,
    buses,
    // Plugin functions
    loadPlugin,
    // MIDI functions
    createMIDIRoute,
    // CPU
    cpuUsageDetailed,
    // Other core functions
    selectedTrack,
    tracks,
  } = useDAW();

  return (
    <div>
      {/* Use all functions here */}
    </div>
  );
}
```

---

## 🎯 Component Integration Checklist

### For Modal Components
- [x] Import `useDAW` hook
- [x] Destructure `open/closeXyzModal` functions
- [x] Destructure `showXyzModal` state variable
- [x] Use state to conditionally render modal
- [x] Call close function on user action

### For Routing Components
- [x] Import `useDAW` hook
- [x] Destructure bus functions
- [x] Display `buses` array
- [x] Call functions on user interactions
- [x] Update UI when state changes

### For Plugin Components
- [x] Import `useDAW` hook
- [x] Destructure plugin functions
- [x] Get plugins from `loadedPlugins` map
- [x] Display loaded plugins
- [x] Manage plugin lifecycle

### For MIDI Components
- [x] Import `useDAW` hook
- [x] Destructure MIDI functions
- [x] Display `midiDevices` list
- [x] Handle device connections
- [x] Show active routes

---

## 💡 Common Patterns

### Pattern 1: Toggle Modal
```typescript
const { showMyModal, openMyModal, closeMyModal } = useDAW();

return (
  <>
    <button onClick={openMyModal}>Open</button>
    {showMyModal && <MyModal onClose={closeMyModal} />}
  </>
);
```

### Pattern 2: List and Manage Items
```typescript
const { buses, createBus, deleteBus } = useDAW();

return (
  <>
    <button onClick={() => createBus("New Bus")}>+ Add</button>
    {buses.map(bus => (
      <BusItem 
        key={bus.id}
        bus={bus}
        onDelete={() => deleteBus(bus.id)}
      />
    ))}
  </>
);
```

### Pattern 3: Route to Selected Track
```typescript
const { selectedTrack, loadPlugin } = useDAW();

const handleLoadPlugin = (pluginName: string) => {
  if (selectedTrack) {
    loadPlugin(selectedTrack.id, pluginName);
  }
};

return (
  <button 
    onClick={() => handleLoadPlugin("Reverb")}
    disabled={!selectedTrack}
  >
    Load Reverb
  </button>
);
```

### Pattern 4: Filter Routes by Track
```typescript
const { selectedTrack, getMIDIRoutesForTrack } = useDAW();

const trackRoutes = selectedTrack
  ? getMIDIRoutesForTrack(selectedTrack.id)
  : [];

return (
  <div>
    {trackRoutes.map(route => (
      <RouteItem key={route.id} route={route} />
    ))}
  </div>
);
```

---

## 🐛 Debug Tips

### Check if modal is visible
```typescript
const { showSaveAsModal } = useDAW();
console.log("Modal visible:", showSaveAsModal);
```

### Check active buses
```typescript
const { buses } = useDAW();
console.log("Available buses:", buses);
```

### Check loaded plugins on track
```typescript
const { loadedPlugins, selectedTrack } = useDAW();
if (selectedTrack) {
  console.log("Plugins on track:", loadedPlugins.get(selectedTrack.id));
}
```

### Check MIDI routing
```typescript
const { getMIDIRoutesForTrack, selectedTrack } = useDAW();
if (selectedTrack) {
  console.log("MIDI routes:", getMIDIRoutesForTrack(selectedTrack.id));
}
```

---

## 📚 Full API Reference

| Function | Signature | Category |
|---|---|---|
| openSaveAsModal | `() => void` | Modal |
| closeSaveAsModal | `() => void` | Modal |
| openOpenProjectModal | `() => void` | Modal |
| closeOpenProjectModal | `() => void` | Modal |
| openMidiSettingsModal | `() => void` | Modal |
| closeMidiSettingsModal | `() => void` | Modal |
| openMixerOptionsModal | `() => void` | Modal |
| closeMixerOptionsModal | `() => void` | Modal |
| openPreferencesModal | `() => void` | Modal |
| closePreferencesModal | `() => void` | Modal |
| openShortcutsModal | `() => void` | Modal |
| closeShortcutsModal | `() => void` | Modal |
| createBus | `(name: string) => void` | Bus |
| deleteBus | `(busId: string) => void` | Bus |
| addTrackToBus | `(trackId: string, busId: string) => void` | Bus |
| removeTrackFromBus | `(trackId: string, busId: string) => void` | Bus |
| createSidechain | `(sourceTrackId: string, targetTrackId: string) => void` | Bus |
| loadPlugin | `(trackId: string, pluginName: string) => void` | Plugin |
| unloadPlugin | `(trackId: string, pluginId: string) => void` | Plugin |
| createMIDIRoute | `(sourceDeviceId: string, targetTrackId: string) => void` | MIDI |
| deleteMIDIRoute | `(routeId: string) => void` | MIDI |
| getMIDIRoutesForTrack | `(trackId: string) => MidiRoute[]` | MIDI |

---

## ✅ Ready to Use

All functions are:
- ✅ Fully implemented
- ✅ Type-safe
- ✅ Production-ready
- ✅ Backward compatible
- ✅ Well documented

**Start using them now in your components!**

