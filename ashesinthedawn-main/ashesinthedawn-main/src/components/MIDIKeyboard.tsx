import React, { useState, useCallback } from 'react';

interface MIDIKeyboardProps {
  onNoteOn: (pitch: number, velocity: number) => void;
  onNoteOff: (pitch: number) => void;
  octaveStart?: number;
  octaveCount?: number;
  isVisible?: boolean;
}

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const WHITE_KEYS = [0, 2, 4, 5, 7, 9, 11]; // C, D, E, F, G, A, B
const BLACK_KEYS = [1, 3, 6, 8, 10]; // C#, D#, F#, G#, A#

export const MIDIKeyboard: React.FC<MIDIKeyboardProps> = ({
  onNoteOn,
  onNoteOff,
  octaveStart = 3,
  octaveCount = 3,
  isVisible = true,
}) => {
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [enableMouseControl, setEnableMouseControl] = useState(true);

  const getNoteNumber = (octave: number, noteInOctave: number): number => {
    return octave * 12 + noteInOctave + 12; // Start from C0
  };

  const handleNoteOn = useCallback(
    (octave: number, noteInOctave: number) => {
      const pitch = getNoteNumber(octave, noteInOctave);
      setActiveNotes(prev => new Set(prev).add(pitch));
      onNoteOn(pitch, 100);
    },
    [onNoteOn]
  );

  const handleNoteOff = useCallback(
    (octave: number, noteInOctave: number) => {
      const pitch = getNoteNumber(octave, noteInOctave);
      setActiveNotes(prev => {
        const next = new Set(prev);
        next.delete(pitch);
        return next;
      });
      onNoteOff(pitch);
    },
    [onNoteOff]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!enableMouseControl) return;

      const keyMap: Record<string, [number, number]> = {
        'z': [octaveStart, 0], // C
        'x': [octaveStart, 2], // D
        'c': [octaveStart, 4], // E
        'v': [octaveStart, 5], // F
        'b': [octaveStart, 7], // G
        'n': [octaveStart, 9], // A
        'm': [octaveStart, 11], // B
        'q': [octaveStart + 1, 0], // C
        'w': [octaveStart + 1, 2], // D
        'e': [octaveStart + 1, 4], // E
        'r': [octaveStart + 1, 5], // F
        't': [octaveStart + 1, 7], // G
        'y': [octaveStart + 1, 9], // A
        'u': [octaveStart + 1, 11], // B
      };

      const key = e.key.toLowerCase();
      if (keyMap[key] && !activeNotes.has(getNoteNumber(...keyMap[key]))) {
        e.preventDefault();
        const [octave, note] = keyMap[key];
        handleNoteOn(octave, note);
      }
    },
    [enableMouseControl, octaveStart, activeNotes, handleNoteOn]
  );

  const handleKeyUp = useCallback(
    (e: React.KeyboardEvent) => {
      const keyMap: Record<string, [number, number]> = {
        'z': [octaveStart, 0],
        'x': [octaveStart, 2],
        'c': [octaveStart, 4],
        'v': [octaveStart, 5],
        'b': [octaveStart, 7],
        'n': [octaveStart, 9],
        'm': [octaveStart, 11],
        'q': [octaveStart + 1, 0],
        'w': [octaveStart + 1, 2],
        'e': [octaveStart + 1, 4],
        'r': [octaveStart + 1, 5],
        't': [octaveStart + 1, 7],
        'y': [octaveStart + 1, 9],
        'u': [octaveStart + 1, 11],
      };

      const key = e.key.toLowerCase();
      if (keyMap[key]) {
        const [octave, note] = keyMap[key];
        handleNoteOff(octave, note);
      }
    },
    [octaveStart, handleNoteOff]
  );

  if (!isVisible) return null;

  return (
    <div
      className="bg-gray-900 rounded border border-gray-700 p-3"
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      tabIndex={0}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-300">MIDI Keyboard</h3>
        <label className="text-xs text-gray-400 flex items-center gap-1">
          <input
            type="checkbox"
            checked={enableMouseControl}
            onChange={(e) => setEnableMouseControl(e.target.checked)}
            className="w-3 h-3"
          />
          Enable Mouse
        </label>
      </div>

      <div className="relative bg-black rounded border border-gray-600 p-2 overflow-x-auto">
        <div className="flex gap-0.5" style={{ minWidth: 'min-content' }}>
          {Array.from({ length: octaveCount }).map((_, octaveIdx) => {
            const octave = octaveStart + octaveIdx;
            return (
              <div key={octave} className="relative" style={{ width: '84px', height: '140px' }}>
                {/* White keys */}
                {WHITE_KEYS.map((noteIdx) => {
                  const pitch = getNoteNumber(octave, noteIdx);
                  const isActive = activeNotes.has(pitch);
                  return (
                    <button
                      key={`white-${octave}-${noteIdx}`}
                      onMouseDown={() => handleNoteOn(octave, noteIdx)}
                      onMouseUp={() => handleNoteOff(octave, noteIdx)}
                      onMouseLeave={() => handleNoteOff(octave, noteIdx)}
                      className={`absolute border border-gray-700 rounded-b transition-colors ${
                        isActive
                          ? 'bg-blue-500'
                          : 'bg-white hover:bg-gray-100'
                      }`}
                      style={{
                        width: '11px',
                        height: '100px',
                        left: `${WHITE_KEYS.indexOf(noteIdx) * 12}px`,
                        top: '20px',
                      }}
                      title={`${NOTES[noteIdx]}${octave}`}
                    />
                  );
                })}

                {/* Black keys */}
                {BLACK_KEYS.map((noteIdx) => {
                  const pitch = getNoteNumber(octave, noteIdx);
                  const isActive = activeNotes.has(pitch);
                  const offsetIdx = BLACK_KEYS.indexOf(noteIdx);
                  const positions = [5.5, 17.5, 35.5, 47.5, 59.5];

                  return (
                    <button
                      key={`black-${octave}-${noteIdx}`}
                      onMouseDown={() => handleNoteOn(octave, noteIdx)}
                      onMouseUp={() => handleNoteOff(octave, noteIdx)}
                      onMouseLeave={() => handleNoteOff(octave, noteIdx)}
                      className={`absolute border border-gray-900 rounded-b transition-colors ${
                        isActive
                          ? 'bg-red-500'
                          : 'bg-black hover:bg-gray-800'
                      }`}
                      style={{
                        width: '8px',
                        height: '60px',
                        left: `${positions[offsetIdx]}px`,
                        top: '20px',
                        zIndex: 10,
                      }}
                      title={`${NOTES[noteIdx]}${octave}`}
                    />
                  );
                })}

                {/* Octave label */}
                <div className="text-xs text-gray-500 text-center mt-1">{octave}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-xs text-gray-500 mt-2">
        <div>Mouse: Click keys | Keyboard: Z-M (C-B), Q-U (C-B up)</div>
      </div>
    </div>
  );
};
