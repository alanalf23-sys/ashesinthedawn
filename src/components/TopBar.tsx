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
    <div className="h-16 bg-gradient-to-r from-daw-dark-900 via-daw-dark-800 to-daw-dark-900 border-b border-daw-dark-600 flex items-center justify-between px-4">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <Activity className="w-6 h-6 text-daw-blue-400" />
          <span className="text-xl font-bold text-daw-dark-100">CoreLogic Studio</span>
        </div>
        {currentProject && (
          <span className="text-sm text-daw-dark-400">{currentProject.name}</span>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 bg-daw-dark-800 rounded-lg px-4 py-2 border border-daw-dark-600">
          <button
            onClick={togglePlay}
            className={`p-2 rounded transition-all ${isPlaying ? 'btn-primary' : 'btn-secondary'}`}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button
            className="btn-secondary p-2 rounded"
            onClick={stop}
          >
            <Square className="w-5 h-5" />
          </button>
          <button
            onClick={toggleRecord}
            className={`p-2 rounded transition-all ${isRecording ? 'btn-danger animate-pulse' : 'btn-secondary'}`}
          >
            <Circle className="w-5 h-5" />
          </button>
        </div>

        <div className="text-daw-dark-100 font-mono text-lg bg-daw-dark-800 px-4 py-2 rounded-lg border border-daw-dark-600">
          {formatTime(currentTime)}
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-daw-xs text-daw-dark-400">LogicCore:</span>
            <select
              value={logicCoreMode}
              onChange={(e) => setLogicCoreMode(e.target.value as 'ON' | 'SILENT' | 'OFF')}
              className="input-daw text-xs"
            >
              <option value="ON">ON</option>
              <option value="SILENT">SILENT</option>
              <option value="OFF">OFF</option>
            </select>
          </div>

          <button
            onClick={toggleVoiceControl}
            className={`p-2 rounded transition-all ${voiceControlActive ? 'bg-green-600 text-white shadow-md' : 'btn-secondary'}`}
            title="Voice Control"
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center space-x-3 bg-daw-dark-800 rounded-lg px-4 py-2 border border-daw-dark-600">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-daw-dark-400" />
            <span className="text-daw-xs text-daw-dark-300">{cpuUsage}%</span>
          </div>
          <div className="flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-daw-dark-400" />
            <span className="text-daw-xs text-daw-dark-300">2.4GB</span>
          </div>
        </div>
      </div>
    </div>
  );
}
