import { useState } from "react";
import { Flag, Repeat2, Music2 } from "lucide-react";
import MarkerPanel from "./MarkerPanel";
import LoopControl from "./LoopControl";
import MetronomeControl from "./MetronomeControl";

export default function Phase3Features() {
  const [activeTab, setActiveTab] = useState<"markers" | "loop" | "metronome">(
    "markers"
  );

  return (
    <div className="bg-gray-950 border border-gray-700 rounded-lg p-4 space-y-4">
      <h2 className="text-lg font-bold text-gray-100">Phase 3 Features</h2>

      {/* Tab buttons */}
      <div className="flex gap-2 border-b border-gray-700">
        <button
          onClick={() => setActiveTab("markers")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "markers"
              ? "text-blue-400 border-blue-400"
              : "text-gray-400 border-transparent hover:text-gray-300"
          }`}
        >
          <Flag className="w-4 h-4" />
          Markers
        </button>
        <button
          onClick={() => setActiveTab("loop")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "loop"
              ? "text-purple-400 border-purple-400"
              : "text-gray-400 border-transparent hover:text-gray-300"
          }`}
        >
          <Repeat2 className="w-4 h-4" />
          Loop
        </button>
        <button
          onClick={() => setActiveTab("metronome")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "metronome"
              ? "text-green-400 border-green-400"
              : "text-gray-400 border-transparent hover:text-gray-300"
          }`}
        >
          <Music2 className="w-4 h-4" />
          Metronome
        </button>
      </div>

      {/* Tab content */}
      <div className="min-h-64">
        {activeTab === "markers" && <MarkerPanel />}
        {activeTab === "loop" && <LoopControl />}
        {activeTab === "metronome" && <MetronomeControl />}
      </div>

      {/* Feature descriptions */}
      <div className="mt-6 pt-4 border-t border-gray-700 space-y-2 text-xs text-gray-400">
        {activeTab === "markers" && (
          <p>
            Create named markers at any point in your timeline. Use them to
            navigate between different sections of your project.
          </p>
        )}
        {activeTab === "loop" && (
          <p>
            Set loop regions to repeat a section of your project. Perfect for
            working on specific sections and practicing takes.
          </p>
        )}
        {activeTab === "metronome" && (
          <p>
            Enable the metronome to keep time while recording or playing back.
            Choose different beat sounds and adjust volume.
          </p>
        )}
      </div>
    </div>
  );
}
