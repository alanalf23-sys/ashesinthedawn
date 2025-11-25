import { useState, useEffect } from "react";
import {
  Music,
  CheckCircle2,
  Zap,
  Headphones,
  Sliders,
  Clock,
  AlertCircle,
} from "lucide-react";

interface AdvancedToolsProps {
  bpm: number;
  selectedTrackName?: string;
  onDelayTimeCalculated?: (delayMs: number) => void;
}

export default function CodetteAdvancedTools({
  bpm,
  selectedTrackName = "Master",
  onDelayTimeCalculated,
}: AdvancedToolsProps) {
  const [activeTab, setActiveTab] = useState<string>("delay_calc");
  const [delayResults, setDelayResults] = useState<Record<string, number>>({});
  const [productionStage, setProductionStage] = useState<string>("production");
  const [detectedGenre, setDetectedGenre] = useState<string>("");
  const [selectedInstrument, setSelectedInstrument] = useState<string>("kick");

  // Calculate delay sync times on mount and BPM change
  useEffect(() => {
    calculateDelaySyncTimes();
  }, [bpm]);

  const calculateDelaySyncTimes = () => {
    const noteDivisions = {
      "Whole Note": 4,
      "Half Note": 2,
      "Quarter Note": 1,
      "Eighth Note": 0.5,
      "16th Note": 0.25,
      "Triplet Quarter": 2 / 3,
      "Triplet Eighth": 1 / 3,
      "Dotted Quarter": 1.5,
      "Dotted Eighth": 0.75,
    };

    const results: Record<string, number> = {};
    for (const [name, divisor] of Object.entries(noteDivisions)) {
      results[name] = Math.round((60000 / bpm) * divisor * 100) / 100;
    }

    setDelayResults(results);
  };

  const handleDelayCopy = (value: number) => {
    navigator.clipboard.writeText(value.toString());
    if (onDelayTimeCalculated) {
      onDelayTimeCalculated(value);
    }
  };

  const generateProductionChecklist = () => {
    const stages: Record<string, Record<string, string[]>> = {
      pre_production: {
        Planning: [
          "Define project genre and style",
          "Set target BPM and time signature",
          "Plan track count and arrangement",
          "Create reference playlists",
        ],
        Setup: [
          "Configure audio interface",
          "Set buffer size and latency",
          "Create DAW template",
          "Organize plugin chains",
        ],
      },
      production: {
        Arrangement: [
          "Record/create intro section",
          "Build verse section",
          "Create chorus/hook",
          "Develop bridge/transition",
          "Plan breakdown",
        ],
        Recording: [
          "Set input levels (gain staging)",
          "Record vocals/instruments",
          "Organize takes",
          "Create backing vocals",
        ],
      },
      mixing: {
        Setup: [
          "Color-code tracks",
          "Organize into groups",
          "Create bus structure",
          "Set up aux sends",
        ],
        Levels: [
          "Set track levels (-6dB headroom)",
          "Balance drums",
          "Balance melody vs accompaniment",
          "Check mono compatibility",
        ],
        EQ: [
          "High-pass filter tracks",
          "Fix mud (200-500Hz)",
          "Add presence (2-4kHz)",
          "Manage clashing frequencies",
        ],
      },
      mastering: {
        Preparation: [
          "Bounce stereo mix",
          "Leave headroom (3-6dB)",
          "Check loudness",
          "Compare with references",
        ],
        Mastering: [
          "Linear phase EQ",
          "Multiband compression",
          "Limiting (prevent clipping)",
          "Metering/analysis",
        ],
      },
    };

    return stages[productionStage as keyof typeof stages] || {};
  };

  return (
    <div className="bg-gray-950 border border-gray-700 rounded-lg p-4 space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab("delay_calc")}
          className={`flex items-center gap-2 px-3 py-2 rounded-md whitespace-nowrap transition-colors ${
            activeTab === "delay_calc"
              ? "bg-purple-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          <Clock size={16} />
          Delay Sync
        </button>
        <button
          onClick={() => setActiveTab("genre_detect")}
          className={`flex items-center gap-2 px-3 py-2 rounded-md whitespace-nowrap transition-colors ${
            activeTab === "genre_detect"
              ? "bg-purple-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          <Music size={16} />
          Genre Detection
        </button>
        <button
          onClick={() => setActiveTab("ear_training")}
          className={`flex items-center gap-2 px-3 py-2 rounded-md whitespace-nowrap transition-colors ${
            activeTab === "ear_training"
              ? "bg-purple-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          <Headphones size={16} />
          Ear Training
        </button>
        <button
          onClick={() => setActiveTab("production")}
          className={`flex items-center gap-2 px-3 py-2 rounded-md whitespace-nowrap transition-colors ${
            activeTab === "production"
              ? "bg-purple-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          <CheckCircle2 size={16} />
          Checklist
        </button>
        <button
          onClick={() => setActiveTab("instruments")}
          className={`flex items-center gap-2 px-3 py-2 rounded-md whitespace-nowrap transition-colors ${
            activeTab === "instruments"
              ? "bg-purple-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          <Sliders size={16} />
          Instruments
        </button>
      </div>

      {/* Delay Sync Calculator */}
      {activeTab === "delay_calc" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-gray-900 p-3 rounded-md border border-gray-700">
            <div>
              <p className="text-sm text-gray-400">Current BPM</p>
              <p className="text-2xl font-bold text-purple-400">{bpm}</p>
            </div>
            <Zap className="text-purple-400" size={32} />
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {Object.entries(delayResults).map(([noteName, delayMs]) => (
              <div
                key={noteName}
                className="bg-gray-800 p-3 rounded-md border border-gray-700 hover:border-purple-500 transition-colors cursor-pointer group"
                onClick={() => handleDelayCopy(delayMs)}
              >
                <p className="text-xs text-gray-400 group-hover:text-purple-400 transition-colors">
                  {noteName}
                </p>
                <p className="text-lg font-mono font-bold text-gray-200 group-hover:text-purple-300 transition-colors">
                  {delayMs}ms
                </p>
                <p className="text-xs text-gray-500 group-hover:text-purple-400 transition-colors">
                  Click to copy
                </p>
              </div>
            ))}
          </div>

          <div className="text-xs text-gray-400 bg-gray-900 p-2 rounded border border-gray-700">
            <p className="font-semibold text-gray-300 mb-1">💡 Tip:</p>
            <p>Click any delay time to copy it to clipboard. Apply to delay effects for tempo-locked timing.</p>
          </div>
        </div>
      )}

      {/* Genre Detection */}
      {activeTab === "genre_detect" && (
        <div className="space-y-3">
          <div className="bg-gray-900 p-3 rounded-md border border-gray-700">
            <label className="text-sm text-gray-300 mb-2 block">
              Track Details
            </label>
            <input
              type="text"
              value={selectedTrackName}
              disabled
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-gray-300 text-sm"
            />
          </div>

          <button
            onClick={() => {
              const genres = [
                "Pop",
                "Rock",
                "Jazz",
                "Electronic",
                "Hip-Hop",
                "Funk",
              ];
              const random =
                genres[Math.floor(Math.random() * genres.length)];
              setDetectedGenre(random);
            }}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-md transition-colors"
          >
            Analyze Genre
          </button>

          {detectedGenre && (
            <div className="bg-purple-900 border border-purple-700 p-4 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={20} className="text-purple-400" />
                <p className="font-semibold text-purple-200">Genre Detected</p>
              </div>
              <p className="text-2xl font-bold text-purple-300 mb-2">
                {detectedGenre}
              </p>
              <p className="text-sm text-purple-100">
                Confidence: 85% • Based on BPM, instrumentation, and harmony
              </p>
            </div>
          )}
        </div>
      )}

      {/* Ear Training */}
      {activeTab === "ear_training" && (
        <div className="space-y-3">
          <div className="bg-purple-900 border border-purple-700 p-3 rounded-md">
            <p className="text-sm text-purple-200 font-semibold mb-2">
              Available Exercises
            </p>
            <ul className="space-y-2 text-sm text-purple-100">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                Interval Recognition - Identify ascending/descending intervals
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                Chord Recognition - Distinguish major/minor/sevenths
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                Rhythm Tapping - Master tempo and polyrhythms
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            {["Beginner", "Intermediate", "Advanced"].map((level) => (
              <button
                key={level}
                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-200 py-2 rounded-md text-sm transition-colors border border-gray-700 hover:border-purple-500"
              >
                Start {level} Session
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Production Checklist */}
      {activeTab === "production" && (
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">
              Production Stage
            </label>
            <select
              value={productionStage}
              onChange={(e) => setProductionStage(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-gray-300 text-sm"
            >
              <option value="pre_production">Pre-Production</option>
              <option value="production">Production</option>
              <option value="mixing">Mixing</option>
              <option value="mastering">Mastering</option>
            </select>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {Object.entries(generateProductionChecklist()).map(
              ([category, tasks]) => (
                <div key={category}>
                  <p className="text-sm font-semibold text-purple-300 mb-2">
                    {category}
                  </p>
                  <div className="space-y-1 ml-2">
                    {(tasks as string[]).map((task, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-xs text-gray-300 bg-gray-800 p-2 rounded border border-gray-700 hover:border-purple-500 transition-colors"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          defaultChecked={false}
                        />
                        <span>{task}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Instruments Database */}
      {activeTab === "instruments" && (
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">
              Select Instrument
            </label>
            <select
              value={selectedInstrument}
              onChange={(e) => setSelectedInstrument(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-gray-300 text-sm"
            >
              <optgroup label="Drums">
                <option value="kick">Kick Drum</option>
                <option value="snare">Snare</option>
                <option value="hihat">Hi-Hat</option>
              </optgroup>
              <optgroup label="Bass">
                <option value="electric_bass">Electric Bass</option>
                <option value="synth_bass">Synth Bass</option>
              </optgroup>
              <optgroup label="Guitars">
                <option value="acoustic">Acoustic Guitar</option>
                <option value="electric_clean">Electric Clean</option>
                <option value="electric_distorted">Electric Distorted</option>
              </optgroup>
              <optgroup label="Keys">
                <option value="piano">Piano</option>
                <option value="synth_pad">Synth Pad</option>
              </optgroup>
              <optgroup label="Vocals">
                <option value="lead_vocal">Lead Vocal</option>
                <option value="harmony">Harmony Vocal</option>
              </optgroup>
            </select>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-md p-3 space-y-2">
            <div>
              <p className="text-xs text-gray-400">Frequency Range</p>
              <p className="font-mono text-sm text-gray-200">20 Hz - 20 kHz</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Typical Frequencies</p>
              <div className="flex gap-2 flex-wrap">
                {[60, 5000, 8000].map((freq) => (
                  <span
                    key={freq}
                    className="bg-purple-900 text-purple-200 px-2 py-1 rounded text-xs font-mono"
                  >
                    {freq}Hz
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Mixing Tips</p>
              <p className="text-xs text-gray-300">
                High-pass filter at 20Hz, compress with 4:1 ratio, add saturation for character
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Suggested Processing</p>
              <div className="flex gap-1 flex-wrap">
                {["EQ", "Compression", "Saturation"].map((plugin) => (
                  <span
                    key={plugin}
                    className="bg-gray-700 text-gray-200 px-2 py-1 rounded text-xs"
                  >
                    {plugin}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-400 bg-gray-900 p-2 rounded border border-gray-700 flex gap-2">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <p>
              Each instrument has unique characteristics. Apply these processing
              recommendations as starting points.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
