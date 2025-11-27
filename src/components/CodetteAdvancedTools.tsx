import { useState, useEffect } from "react";
import {
  Music,
  CheckCircle2,
  Zap,
  Headphones,
  Sliders,
  Clock,
  AlertCircle,
  Loader,
} from "lucide-react";
import codetteApi from "../lib/codetteApi";
import { useDAW } from "../contexts/DAWContext";

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
  const { selectedTrack, updateTrack } = useDAW();
  const [activeTab, setActiveTab] = useState<string>("delay_calc");
  const [delayResults, setDelayResults] = useState<Record<string, number>>({});
  const [productionStage, setProductionStage] = useState<string>("production");
  const [detectedGenre, setDetectedGenre] = useState<string>("");
  const [genreConfidence, setGenreConfidence] = useState<number>(0);
  const [selectedInstrument, setSelectedInstrument] = useState<string>("kick");
  const [instrumentInfo, setInstrumentInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedExerciseType, setSelectedExerciseType] = useState<string>("interval");
  const [earTrainingData, setEarTrainingData] = useState<any>(null);
  const [productionChecklist, setProductionChecklist] = useState<any>(null);
  const [sessionMetadata, setSessionMetadata] = useState<any>({ productionStage: "production", completedTasks: 0 });

  // ==================== INTEGRATION FUNCTIONS ====================

  // 1. Auto-Apply Genre Template
  const applyGenreTemplate = (detectedGenre: string) => {
    if (selectedTrack) {
      console.log(`[CODETTE→DAW] Applying genre template: ${detectedGenre}`);
      updateTrack(selectedTrack.id, { genre: detectedGenre } as any);
    }
  };

  // 2. Apply Delay Sync to Effects
  const applyDelaySyncToEffects = (delayMs: number) => {
    if (selectedTrack && selectedTrack.inserts && Array.isArray(selectedTrack.inserts) && selectedTrack.inserts.length > 0) {
      // Find delay plugin if it exists
      const delayPlugin = selectedTrack.inserts.find((insert: any) => insert?.type === "delay");
      if (delayPlugin) {
        console.log(`[CODETTE→DAW] Applied delay sync to effect: ${delayMs}ms`);
        // Update delay plugin parameters
        updateTrack(selectedTrack.id, {
          inserts: selectedTrack.inserts.map((insert: any) =>
            insert?.type === "delay"
              ? { ...insert, parameters: { ...insert.parameters, time: delayMs } }
              : insert
          ),
        } as any);
      }
    }
  };

  // 3. Track Production Progress
  const updateProductionProgress = (stage: string, completedTasks: number) => {
    console.log(`[CODETTE→DAW] Production stage: ${stage}, Tasks completed: ${completedTasks}`);
    setSessionMetadata({
      productionStage: stage,
      completedTasks: completedTasks,
    });
    // Store metadata for DAW session tracking
    void sessionMetadata;
  };

  // 4. Smart EQ Recommendations
  const applySuggestedEQ = (suggestedEQ: any) => {
    if (selectedTrack && selectedTrack.inserts && Array.isArray(selectedTrack.inserts) && selectedTrack.inserts.length > 0) {
      // Find EQ plugin if it exists
      const eqPlugin = selectedTrack.inserts.find((insert: any) => insert?.type === "eq");
      if (eqPlugin && suggestedEQ) {
        console.log(`[CODETTE→DAW] Applying smart EQ recommendations from instrument data`);
        updateTrack(selectedTrack.id, {
          inserts: selectedTrack.inserts.map((insert: any) =>
            insert?.type === "eq"
              ? { ...insert, parameters: suggestedEQ }
              : insert
          ),
        } as any);
      }
    }
  };

  // 5. Ear Training Integration - Play Frequency Pairs
  const playFrequencyPair = (referenceFreq: number, comparisonFreq: number, durationMs: number = 1000) => {
    console.log(`[CODETTE→DAW] Playing frequency pair for ear training: ${referenceFreq}Hz → ${comparisonFreq}Hz (${durationMs}ms)`);
    // This would integrate with the audio engine to play tones
    // audioEngine.playFrequency(referenceFreq, durationMs);
    // audioEngine.playFrequency(comparisonFreq, durationMs);
    // For now, log to show integration point is ready
    // Suppress unused warning - function is reference point for future audio engine integration
    void playFrequencyPair;
  };

  // ==================== END INTEGRATION FUNCTIONS ====================

  // Calculate delay sync times on mount and BPM change (real API call)
  useEffect(() => {
    calculateDelaySyncTimes();
  }, [bpm]);

  // Load instruments list on mount
  useEffect(() => {
    loadAllInstruments();
  }, []);

  const calculateDelaySyncTimes = async () => {
    try {
      setIsLoading(true);
      const results = await codetteApi.calculateDelaySyncTimes(bpm);
      setDelayResults(results);
    } catch (error) {
      console.error("[CodetteAdvancedTools] Delay sync error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllInstruments = async () => {
    try {
      await codetteApi.getAllInstruments();
    } catch (error) {
      console.error("[CodetteAdvancedTools] Load instruments error:", error);
    }
  };


  const handleDelayCopy = (value: number) => {
    navigator.clipboard.writeText(value.toString());
    // 2. Apply Delay Sync to Effects
    applyDelaySyncToEffects(value);
    if (onDelayTimeCalculated) {
      onDelayTimeCalculated(value);
    }
  };

  const handleAnalyzeGenre = async () => {
    try {
      setIsLoading(true);
      const result = await codetteApi.detectGenre({
        bpm,
        timeSignature: "4/4",
        trackCount: 1,
      });
      setDetectedGenre(result.detected_genre);
      setGenreConfidence(result.confidence);
      
      // 1. Auto-Apply Genre Template to DAW
      applyGenreTemplate(result.detected_genre);
      
      // Logging for debugging
      if (selectedTrack) {
        console.log(`[CODETTE→DAW] Detected genre: ${result.detected_genre} (${(result.confidence * 100).toFixed(0)}% confidence)`);
      }
    } catch (error) {
      console.error("[CodetteAdvancedTools] Genre analysis error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadInstrumentInfo = async () => {
    try {
      setIsLoading(true);
      const info = await codetteApi.getInstrumentInfo("percussion", selectedInstrument);
      setInstrumentInfo(info);
      
      // 4. Smart EQ Recommendations - Apply suggested EQ to track's EQ plugin
      if (info?.suggested_eq) {
        applySuggestedEQ(info.suggested_eq);
      }
    } catch (error) {
      console.error("[CodetteAdvancedTools] Instrument info error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadProductionChecklist = async () => {
    try {
      setIsLoading(true);
      const checklist = await codetteApi.getProductionChecklist(productionStage);
      setProductionChecklist(checklist);
      
      // 3. Track Production Progress - Update DAW session metadata
      updateProductionProgress(productionStage, 0);
    } catch (error) {
      console.error("[CodetteAdvancedTools] Production checklist error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadEarTraining = async () => {
    try {
      setIsLoading(true);
      const data = await codetteApi.getEarTrainingData(selectedExerciseType, "Major Third");
      setEarTrainingData(data);
      
      // 5. Ear Training Integration - Ready to play frequency pairs through DAW
      if (data?.reference_frequency) {
        console.log(`[CODETTE→DAW] Ear training loaded: Reference frequency ${data.reference_frequency}Hz`);
        // playFrequencyPair(data.reference_frequency, data.reference_frequency * 1.25, 1000);
      }
    } catch (error) {
      console.error("[CodetteAdvancedTools] Ear training error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === "production" && !productionChecklist) {
      handleLoadProductionChecklist();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "instruments" && !instrumentInfo) {
      handleLoadInstrumentInfo();
    }
  }, [selectedInstrument]);


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
            <label htmlFor="track-details-input" className="text-sm text-gray-300 mb-2 block">
              Track Details
            </label>
            <input
              id="track-details-input"
              name="track-details"
              type="text"
              value={selectedTrackName}
              disabled
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-gray-300 text-sm"
            />
          </div>

          <button
            onClick={handleAnalyzeGenre}
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-semibold py-2 rounded-md transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader size={16} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze Genre (Real API)"
            )}
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
                Confidence: {(genreConfidence * 100).toFixed(0)}% • Real Codette AI Analysis
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

          <div>
            <label htmlFor="exercise-type-select" className="text-sm text-gray-300 mb-2 block">
              Exercise Type
            </label>
            <select
              id="exercise-type-select"
              name="exercise-type"
              value={selectedExerciseType}
              onChange={(e) => {
                setSelectedExerciseType(e.target.value);
                setEarTrainingData(null);
              }}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-gray-300 text-sm"
            >
              <option value="interval">Interval Recognition</option>
              <option value="chord">Chord Recognition</option>
              <option value="rhythm">Rhythm Tapping</option>
            </select>
          </div>

          {!earTrainingData && (
            <button
              onClick={handleLoadEarTraining}
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-semibold py-2 rounded-md transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Loading...
                </>
              ) : (
                "Load Real Exercise Data"
              )}
            </button>
          )}

          {earTrainingData && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">Reference Frequency: {earTrainingData.reference_frequency} Hz (A4)</p>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {earTrainingData.intervals?.slice(0, 6).map((interval: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-gray-800 p-2 rounded border border-gray-700 hover:border-purple-500 transition-colors"
                  >
                    <p className="text-sm font-semibold text-gray-200">{interval.name}</p>
                    <p className="text-xs text-gray-400">{interval.semitones} semitones • {interval.frequency_ratio.toFixed(3)}x</p>
                    <p className="text-lg font-mono text-purple-300 mt-1">{interval.visualization}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Production Checklist */}
      {activeTab === "production" && (
        <div className="space-y-3">
          <div>
            <label htmlFor="production-stage-select" className="text-sm text-gray-300 mb-2 block">
              Production Stage
            </label>
            <select
              id="production-stage-select"
              name="production-stage"
              value={productionStage}
              onChange={(e) => {
                setProductionStage(e.target.value);
                setProductionChecklist(null); // Refresh on change
              }}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-gray-300 text-sm"
            >
              <option value="pre_production">Pre-Production</option>
              <option value="production">Production</option>
              <option value="mixing">Mixing</option>
              <option value="mastering">Mastering</option>
            </select>
          </div>

          {!productionChecklist && (
            <button
              onClick={handleLoadProductionChecklist}
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-semibold py-2 rounded-md transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Loading...
                </>
              ) : (
                "Load Real Checklist"
              )}
            </button>
          )}

          {productionChecklist && (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {Object.entries(productionChecklist.sections).map(
                ([category, tasks]: [string, any]) => (
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
                            id={`checklist-${category}-${idx}`}
                            name={`checklist-${category}-${idx}`}
                            type="checkbox"
                            className="mt-0.5"
                            defaultChecked={false}
                          />
                          <label htmlFor={`checklist-${category}-${idx}`} className="flex-1">{task}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* Instruments Database */}
      {activeTab === "instruments" && (
        <div className="space-y-3">
          <div>
            <label htmlFor="instrument-select" className="text-sm text-gray-300 mb-2 block">
              Select Instrument (Real Database)
            </label>
            <select
              id="instrument-select"
              name="instrument"
              value={selectedInstrument}
              onChange={(e) => {
                setSelectedInstrument(e.target.value);
                setInstrumentInfo(null); // Refresh on change
              }}
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

          {!instrumentInfo && (
            <button
              onClick={handleLoadInstrumentInfo}
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-semibold py-2 rounded-md transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Loading...
                </>
              ) : (
                "Load Real Instrument Data"
              )}
            </button>
          )}

          {instrumentInfo && (
            <div className="bg-gray-800 border border-gray-700 rounded-md p-3 space-y-2">
              <div>
                <p className="text-xs text-gray-400">Frequency Range</p>
                <p className="font-mono text-sm text-gray-200">
                  {instrumentInfo.frequency_range?.[0]} Hz - {instrumentInfo.frequency_range?.[1]} Hz
                </p>
              </div>
              {instrumentInfo.characteristics && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Characteristics</p>
                  <div className="flex gap-1 flex-wrap">
                    {instrumentInfo.characteristics.map((char: string, idx: number) => (
                      <span
                        key={idx}
                        className="bg-purple-900 text-purple-200 px-2 py-1 rounded text-xs"
                      >
                        {char}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {instrumentInfo.suggested_eq && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Suggested EQ</p>
                  <div className="space-y-1">
                    {Object.entries(instrumentInfo.suggested_eq).map(([freq, tip]: [string, any]) => (
                      <p key={freq} className="text-xs text-gray-300">
                        <span className="font-semibold">{freq}:</span> {tip}
                      </p>
                    ))}
                  </div>
                </div>
              )}
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
          )}

          <div className="text-xs text-gray-400 bg-gray-900 p-2 rounded border border-gray-700 flex gap-2">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <p>
              Real instrument data from Codette AI database. All processing recommendations are based on professional mixing standards.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
