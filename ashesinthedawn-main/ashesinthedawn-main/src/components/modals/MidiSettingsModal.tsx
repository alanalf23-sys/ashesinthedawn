import { useState } from 'react';
import { X } from 'lucide-react';
import { useDAW } from '../../contexts/DAWContext';

export default function MidiSettingsModal() {
  const { showMidiSettingsModal, closeMidiSettingsModal } = useDAW();
  const [midiInput, setMidiInput] = useState('all');
  const [midiOutput, setMidiOutput] = useState('default');
  const [pitchBend, setPitchBend] = useState(2);
  const [sustainPedalCC, setSustainPedalCC] = useState(64);
  const [modWheelCC, setModWheelCC] = useState(1);

  if (!showMidiSettingsModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">MIDI Settings</h2>
          <button
            onClick={closeMidiSettingsModal}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* MIDI Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              MIDI Input Device
            </label>
            <select
              value={midiInput}
              onChange={(e) => setMidiInput(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Devices</option>
              <option value="keyboard">MIDI Keyboard</option>
              <option value="controller">MIDI Controller</option>
              <option value="none">None</option>
            </select>
          </div>

          {/* MIDI Output */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              MIDI Output Device
            </label>
            <select
              value={midiOutput}
              onChange={(e) => setMidiOutput(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="default">Default</option>
              <option value="internal">Internal Synth</option>
              <option value="external">External Device</option>
            </select>
          </div>

          {/* Pitch Bend Range */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Pitch Bend Range: <span className="text-blue-400">{pitchBend} semitones</span>
            </label>
            <input
              type="range"
              min="1"
              max="12"
              value={pitchBend}
              onChange={(e) => setPitchBend(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>12</span>
            </div>
          </div>

          {/* CC Assignments */}
          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">CC Assignments</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Sustain Pedal (CC #)
                </label>
                <input
                  type="number"
                  value={sustainPedalCC}
                  onChange={(e) => setSustainPedalCC(Number(e.target.value))}
                  min="0"
                  max="127"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Mod Wheel (CC #)
                </label>
                <input
                  type="number"
                  value={modWheelCC}
                  onChange={(e) => setModWheelCC(Number(e.target.value))}
                  min="0"
                  max="127"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* MIDI Activity Monitor */}
          <div className="bg-gray-800 border border-gray-700 rounded p-3 text-xs text-gray-400">
            <p>MIDI Activity: <span className="text-gray-300">No activity</span></p>
            <p className="text-gray-500 mt-1">Last note: --</p>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={closeMidiSettingsModal}
            className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition"
          >
            Reset
          </button>
          <button
            onClick={closeMidiSettingsModal}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
