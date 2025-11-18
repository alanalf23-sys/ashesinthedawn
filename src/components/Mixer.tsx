import { Volume2, Maximize2, GripVertical, ChevronDown } from 'lucide-react';
import { useDAW } from '../contexts/DAWContext';
import { useState } from 'react';
import { Plugin } from '../types';

const PLUGIN_TYPES: { type: Plugin['type']; name: string; description: string }[] = [
  { type: 'eq', name: 'EQ', description: '3-band equalizer' },
  { type: 'compressor', name: 'Compressor', description: 'Dynamic range compressor' },
  { type: 'gate', name: 'Gate', description: 'Noise gate' },
  { type: 'saturation', name: 'Saturation', description: 'Saturation/distortion' },
  { type: 'delay', name: 'Delay', description: 'Time-based delay' },
  { type: 'reverb', name: 'Reverb', description: 'Space/reverb simulation' },
  { type: 'utility', name: 'Utility', description: 'Utility tools' },
  { type: 'meter', name: 'Meter', description: 'Metering/analysis' },
];

export default function Mixer() {
  const { tracks, updateTrack } = useDAW();
  const [gainValues, setGainValues] = useState<Record<string, number>>({});
  const [panValues, setPanValues] = useState<Record<string, number>>({});
  const [stereoWidthValues, setStereoWidthValues] = useState<Record<string, number>>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const [draggedPlugin, setDraggedPlugin] = useState<{ trackId: string; slotIndex: number } | null>(null);
  const [pluginMenuOpen, setPluginMenuOpen] = useState<{ trackId: string; slotIndex: number } | null>(null);

  const getPanLabel = (pan: number) => {
    if (pan < -0.1) return `L${Math.abs(Math.round(pan * 100))}`;
    if (pan > 0.1) return `R${Math.round(pan * 100)}`;
    return 'C';
  };

  // Handle numerical input for gain/volume
  const handleGainInput = (trackId: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      updateTrack(trackId, { volume: numValue });
      setGainValues({ ...gainValues, [trackId]: numValue });
    }
  };

  // Handle numerical input for pan
  const handlePanInput = (trackId: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= -1 && numValue <= 1) {
      updateTrack(trackId, { pan: numValue });
      setPanValues({ ...panValues, [trackId]: numValue });
    }
  };

  // Handle numerical input for stereo width
  const handleStereoWidthInput = (trackId: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 200) {
      updateTrack(trackId, { stereoWidth: numValue });
      setStereoWidthValues({ ...stereoWidthValues, [trackId]: numValue });
    }
  };

  // Double-click handler for all sliders
  const handleDoubleClickReset = (trackId: string, field: 'volume' | 'pan' | 'stereoWidth') => {
    const resetValues = { volume: 0, pan: 0, stereoWidth: 100 };
    updateTrack(trackId, { [field]: resetValues[field] });
  };

  // Handle double-click to reset volume to 0dB
  const handleVolumeFaderDoubleClick = (trackId: string) => {
    handleDoubleClickReset(trackId, 'volume');
  };

  // Handle double-click to reset pan to center
  const handlePanDoubleClick = (trackId: string) => {
    handleDoubleClickReset(trackId, 'pan');
  };

  // Handle double-click to reset stereo width
  const handleStereoWidthDoubleClick = (trackId: string) => {
    handleDoubleClickReset(trackId, 'stereoWidth');
  };

  // Handle gain knob interaction
  const handleGainChange = (trackId: string, value: number) => {
    setGainValues({ ...gainValues, [trackId]: value });
    updateTrack(trackId, { volume: value });
  };

  // Handle plugin insertion with menu
  const handleInsertPlugin = (trackId: string, slotIndex: number) => {
    setPluginMenuOpen({ trackId, slotIndex });
  };

  // Handle plugin type selection
  const handleSelectPluginType = (trackId: string, slotIndex: number, type: Plugin['type']) => {
    const pluginName = PLUGIN_TYPES.find(p => p.type === type)?.name || type;
    const newPlugin: Plugin = {
      id: `plugin-${Date.now()}`,
      name: pluginName,
      type,
      enabled: true,
      parameters: {},
    };

    const track = tracks.find(t => t.id === trackId);
    if (track) {
      const newInserts = [...track.inserts];
      newInserts[slotIndex] = newPlugin;
      updateTrack(trackId, { inserts: newInserts });
      console.log(`Plugin ${pluginName} inserted into slot ${slotIndex + 1} of track ${track.name}`);
    }
    setPluginMenuOpen(null);
  };

  // Handle plugin removal
  const handleRemovePlugin = (trackId: string, slotIndex: number) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      const newInserts = track.inserts.filter((_, idx) => idx !== slotIndex);
      updateTrack(trackId, { inserts: newInserts });
      console.log(`Plugin removed from slot ${slotIndex + 1} of track ${track.name}`);
    }
  };

  // Handle drag start for plugins
  const handleDragStart = (e: React.DragEvent, trackId: string, slotIndex: number) => {
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', JSON.stringify({ trackId, slotIndex }));
    }
    setDraggedPlugin({ trackId, slotIndex });
  };

  // Handle drag over for plugin slots
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  // Handle drop for plugin reordering
  const handleDropPlugin = (e: React.DragEvent, targetTrackId: string, targetSlotIndex: number) => {
    e.preventDefault();
    if (e.dataTransfer && draggedPlugin) {
      const sourceTrackId = draggedPlugin.trackId;
      const sourceSlotIndex = draggedPlugin.slotIndex;

      const sourceTrack = tracks.find(t => t.id === sourceTrackId);
      const targetTrack = tracks.find(t => t.id === targetTrackId);

      if (sourceTrack && targetTrack && sourceTrack.inserts[sourceSlotIndex]) {
        // Swap plugins or move plugin
        const sourcePlugin = sourceTrack.inserts[sourceSlotIndex];
        const targetPlugin = targetTrack.inserts[targetSlotIndex];

        const newSourceInserts = [...sourceTrack.inserts];
        const newTargetInserts = [...targetTrack.inserts];

        newSourceInserts[sourceSlotIndex] = targetPlugin!;
        newTargetInserts[targetSlotIndex] = sourcePlugin;

        updateTrack(sourceTrackId, { inserts: newSourceInserts });
        updateTrack(targetTrackId, { inserts: newTargetInserts });
      }
      setDraggedPlugin(null);
    }
  };

  return (
    <div className="h-80 bg-gradient-to-b from-daw-dark-900 to-daw-dark-950 border-t border-daw-dark-600 overflow-x-auto">
      <div className="flex h-full p-3 space-x-2">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="channel-strip w-28 flex flex-col p-2 space-y-2 flex-shrink-0"
          >
            {/* Gain Knob at Top */}
            <div className="flex flex-col items-center space-y-1">
              <div className="knob">
                <div 
                  className="absolute w-0.5 h-3 bg-daw-accent-400 rounded-full origin-bottom"
                  style={{
                    transform: `rotate(${(track.volume / 12 * 270) - 135}deg)`,
                    bottom: '50%'
                  }}
                />
              </div>
              <input
                type="range"
                min="-60"
                max="12"
                step="0.1"
                value={track.volume}
                onChange={(e) => handleGainChange(track.id, parseFloat(e.target.value))}
                onDoubleClick={() => handleVolumeFaderDoubleClick(track.id)}
                className="w-20 opacity-0 absolute h-0"
                title={`Gain: ${track.volume > 0 ? '+' : ''}${track.volume.toFixed(1)}dB`}
              />
              <div className="channel-strip-value">
                {track.volume > 0 ? '+' : ''}{track.volume.toFixed(1)}dB
              </div>
              {/* Numerical Input for Gain */}
              <input
                type="number"
                min="-60"
                max="12"
                step="0.1"
                value={gainValues[track.id] ?? track.volume}
                onChange={(e) => handleGainInput(track.id, e.target.value)}
                onDoubleClick={() => handleVolumeFaderDoubleClick(track.id)}
                className="input-daw w-16"
                title="Double-click to reset to 0dB"
              />
            </div>

            {/* Plugin Slots (vertical) - 6 slots with drag-drop */}
            <div className="flex flex-col space-y-0.5 text-daw-xs">
              <div className="channel-strip-label mb-1">Inserts:</div>
              {[0, 1, 2, 3, 4, 5].map((slotIndex) => (
                <div
                  key={slotIndex}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropPlugin(e, track.id, slotIndex)}
                  className="relative"
                >
                  {track.inserts[slotIndex] ? (
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, track.id, slotIndex)}
                      className="plugin-slot cursor-move h-5 flex items-center justify-between px-1 group"
                    >
                      <GripVertical className="w-2.5 h-2.5 mr-0.5 opacity-50 text-daw-dark-400" />
                      <span className="truncate flex-1 text-daw-xs text-daw-dark-100 font-medium">{track.inserts[slotIndex].name}</span>
                      <button
                        onClick={() => handleRemovePlugin(track.id, slotIndex)}
                        className="opacity-0 group-hover:opacity-100 text-daw-xs ml-1 hover:text-red-400 transition-opacity"
                        title="Remove plugin"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <button 
                        onClick={() => handleInsertPlugin(track.id, slotIndex)}
                        className="plugin-slot w-full h-5 text-daw-accent-400 flex items-center justify-center hover:text-daw-accent-300 transition" 
                        title={`Insert Plugin Slot ${slotIndex + 1}`}
                      >
                        +
                      </button>
                      {/* Plugin Menu */}
                      {pluginMenuOpen?.trackId === track.id && pluginMenuOpen?.slotIndex === slotIndex && (
                        <div className="dropdown-menu w-48 mt-1">
                          {PLUGIN_TYPES.map((plugin) => (
                            <button
                              key={plugin.type}
                              onClick={() => handleSelectPluginType(track.id, slotIndex, plugin.type)}
                              className="dropdown-item w-full"
                              title={plugin.description}
                            >
                              <div className="text-daw-dark-100 font-medium">{plugin.name}</div>
                              <div className="dropdown-item-desc">{plugin.description}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Metering */}
            <div className="meter w-full h-3">
              <div className="meter-bar" style={{ width: '45%' }} />
            </div>

            {/* Volume Fader */}
            <div className="flex-1 flex flex-col items-center space-y-1">
              <input
                type="range"
                min="-60"
                max="12"
                value={track.volume}
                onChange={(e) => updateTrack(track.id, { volume: parseFloat(e.target.value) })}
                onDoubleClick={() => handleVolumeFaderDoubleClick(track.id)}
                orient="vertical"
                className="flex-1 slider-vertical"
                title={`Volume: ${track.volume}dB - double-click to reset`}
              />
              <div className="channel-strip-value">
                {track.volume > 0 ? '+' : ''}{track.volume.toFixed(1)}dB
              </div>
            </div>

            {/* Pan Fader */}
            <div className="space-y-1">
              <input
                type="range"
                min="-1"
                max="1"
                step="0.1"
                value={track.pan}
                onChange={(e) => updateTrack(track.id, { pan: parseFloat(e.target.value) })}
                onDoubleClick={() => handlePanDoubleClick(track.id)}
                className="w-full"
                title={`Pan: ${getPanLabel(track.pan)} - double-click to center`}
              />
              <div className="channel-strip-label text-center">
                Pan: {getPanLabel(track.pan)}
              </div>
              {/* Numerical Input for Pan */}
              <input
                type="number"
                min="-1"
                max="1"
                step="0.1"
                value={panValues[track.id] ?? track.pan}
                onChange={(e) => handlePanInput(track.id, e.target.value)}
                onDoubleClick={() => handlePanDoubleClick(track.id)}
                className="input-daw w-16 mx-auto"
                title="Double-click to center at 0"
              />
            </div>

            {/* Stereo Width */}
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max="200"
                step="5"
                value={track.stereoWidth || 100}
                onChange={(e) => updateTrack(track.id, { stereoWidth: parseFloat(e.target.value) })}
                onDoubleClick={() => handleStereoWidthDoubleClick(track.id)}
                className="w-full"
                title={`Stereo Width: ${(track.stereoWidth || 100).toFixed(0)}% - double-click to reset`}
              />
              <div className="channel-strip-label text-center">
                <Maximize2 className="w-3 h-3 inline mr-1" /> {(track.stereoWidth || 100).toFixed(0)}%
              </div>
              {/* Numerical Input for Stereo Width */}
              <input
                type="number"
                min="0"
                max="200"
                step="5"
                value={stereoWidthValues[track.id] ?? (track.stereoWidth || 100)}
                onChange={(e) => handleStereoWidthInput(track.id, e.target.value)}
                onDoubleClick={() => handleStereoWidthDoubleClick(track.id)}
                className="input-daw w-16 mx-auto"
                title="Double-click to reset to 100%"
              />
            </div>

            {/* Automation Mode */}
            <div className="space-y-1">
              <select
                value={track.automationMode || 'off'}
                onChange={(e) => updateTrack(track.id, { automationMode: e.target.value as any })}
                className="input-daw w-full"
              >
                <option value="off">Off</option>
                <option value="read">Read</option>
                <option value="write">Write</option>
                <option value="touch">Touch</option>
                <option value="latch">Latch</option>
              </select>
              <div className="channel-strip-label text-center">Auto</div>
            </div>

            {/* Control Buttons */}
            <div className="space-y-1">
              <div className="flex justify-center space-x-1">
                {/* Phase Flip */}
                <button
                  onClick={() => updateTrack(track.id, { phaseFlip: !track.phaseFlip })}
                  className={`btn-small flex-1 font-mono transition-all ${
                    track.phaseFlip ? 'bg-purple-600 text-white shadow-md' : 'btn-secondary'
                  }`}
                  title="Phase Flip"
                >
                  Φ
                </button>
                <button
                  onClick={() => updateTrack(track.id, { muted: !track.muted })}
                  className={`btn-small flex-1 transition-all ${
                    track.muted ? 'btn-mute active' : 'btn-mute'
                  }`}
                  title="Mute"
                >
                  M
                </button>
                <button
                  onClick={() => updateTrack(track.id, { soloed: !track.soloed })}
                  className={`btn-small flex-1 transition-all ${
                    track.soloed ? 'btn-solo active' : 'btn-solo'
                  }`}
                  title="Solo"
                >
                  S
                </button>
              </div>

              {/* Track Label */}
              <div className="channel-strip-label text-center truncate" title={track.name}>
                {track.name.length > 12 ? track.name.substring(0, 10) + '..' : track.name}
              </div>

              {/* Track Color Indicator */}
              <div style={{ backgroundColor: track.color }} className="h-1 rounded-full" />
            </div>
          </div>
        ))}

        {tracks.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-daw-dark-500">
            <div className="text-center">
              <Volume2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No tracks yet. Add tracks to get started.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
