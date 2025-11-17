import { Play, Pause, Square, Circle, Mic, Activity, Cpu, HardDrive } from 'lucide-react';
import { useDAW } from '../contexts/DAWContext';

export default function TopBar() {
  const {
    currentProject,
    isPlaying,
    isRecording,
    currentTime,
    logicCoreMode,
    voiceControlActive,
    cpuUsage,
    togglePlay,
    toggleRecord,
    stop,
    setLogicCoreMode,
    toggleVoiceControl,
  } = useDAW();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-16 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 flex items-center justify-between px-4">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <Activity className="w-6 h-6 text-blue-400" />
          <span className="text-xl font-bold text-white">CoreLogic Studio</span>
        </div>
        {currentProject && (
          <span className="text-sm text-gray-400">{currentProject.name}</span>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 bg-gray-800 rounded-lg px-4 py-2">
          <button
            onClick={togglePlay}
            className={`p-2 rounded ${isPlaying ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button
            className="p-2 rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
            onClick={stop}
          >
            <Square className="w-5 h-5" />
          </button>
          <button
            onClick={toggleRecord}
            className={`p-2 rounded ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            <Circle className="w-5 h-5" />
          </button>
        </div>

        <div className="text-white font-mono text-lg bg-gray-800 px-4 py-2 rounded-lg">
          {formatTime(currentTime)}
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">LogicCore:</span>
            <select
              value={logicCoreMode}
              onChange={(e) => setLogicCoreMode(e.target.value as 'ON' | 'SILENT' | 'OFF')}
              className="bg-gray-800 text-white text-xs rounded px-2 py-1 border border-gray-600"
            >
              <option value="ON">ON</option>
              <option value="SILENT">SILENT</option>
              <option value="OFF">OFF</option>
            </select>
          </div>

          <button
            onClick={toggleVoiceControl}
            className={`p-2 rounded ${voiceControlActive ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            title="Voice Control"
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center space-x-3 bg-gray-800 rounded-lg px-4 py-2">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-300">{cpuUsage}%</span>
          </div>
          <div className="flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-300">2.4GB</span>
          </div>
        </div>
      </div>
    </div>
  );
}
