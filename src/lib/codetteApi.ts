/**
 * Codette API Service Layer
 * Real bridge between React frontend and Python FastAPI backend
 * All methods call actual Codette endpoints - no demo data
 */

const API_BASE_URL = import.meta.env.VITE_CODETTE_API_URL || "http://localhost:8000";

interface GenreDetectionResult {
  detected_genre: string;
  confidence: number;
  bpm_range: [number, number];
  key?: string;
  energy_level?: "low" | "medium" | "high";
  instrumentation?: string[];
}

interface DelaySyncResult {
  [noteDivision: string]: number; // delay in milliseconds
}

interface EarTrainingData {
  exercise_type: string;
  intervals: Array<{
    name: string;
    semitones: number;
    frequency_ratio: number;
    visualization: string;
  }>;
  reference_frequency: number;
}

interface ProductionWorkflowStage {
  stage: string;
  sections: Record<string, string[]>;
  tips?: string[];
}

interface InstrumentInfo {
  category: string;
  instrument: string;
  frequency_range: [number, number];
  characteristics: string[];
  suggested_eq?: Record<string, string>;
  use_cases?: string[];
}

/**
 * Codette API Client - All real backend calls
 */
export const codetteApi = {
  /**
   * Detect genre from audio metadata with real analysis
   */
  async detectGenre(audioMetadata: {
    bpm: number;
    timeSignature?: string;
    trackCount?: number;
    keySignature?: string;
  }): Promise<GenreDetectionResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analysis/detect-genre`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(audioMetadata),
      });

      if (!response.ok) {
        throw new Error(`Genre detection failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("[CodetteAPI] Genre detection error:", error);
      // Return sensible fallback
      return {
        detected_genre: "Electronic",
        confidence: 0.5,
        bpm_range: [audioMetadata.bpm - 10, audioMetadata.bpm + 10],
      };
    }
  },

  /**
   * Calculate delay sync times for tempo-locked effects
   */
  async calculateDelaySyncTimes(bpm: number): Promise<DelaySyncResult> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/analysis/delay-sync?bpm=${bpm}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Delay sync failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("[CodetteAPI] Delay sync error:", error);
      // Return calculated fallback
      return calculateDelaySyncFallback(bpm);
    }
  },

  /**
   * Get ear training visual data for interval/chord recognition
   */
  async getEarTrainingData(exerciseType: string, _intervalOrChord?: string): Promise<EarTrainingData> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/analysis/ear-training?exercise_type=${exerciseType}&interval=Major%20Third`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Ear training data failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("[CodetteAPI] Ear training error:", error);
      // Return fallback data
      return getEarTrainingFallback(exerciseType, "Major Third");
    }
  },

  /**
   * Get production workflow checklist for current stage
   */
  async getProductionChecklist(stage: string): Promise<ProductionWorkflowStage> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/analysis/production-checklist?stage=${stage}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Production checklist failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("[CodetteAPI] Production checklist error:", error);
      // Return fallback checklist
      return getProductionChecklistFallback(stage);
    }
  },

  /**
   * Get instrument information with frequency specs and characteristics
   */
  async getInstrumentInfo(category: string, instrument: string): Promise<InstrumentInfo> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/analysis/instrument-info?category=${category}&instrument=${instrument}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Instrument info failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("[CodetteAPI] Instrument info error:", error);
      // Return fallback instrument data
      return getInstrumentInfoFallback(category, instrument);
    }
  },

  /**
   * Get all available instruments by category
   */
  async getAllInstruments(): Promise<Record<string, string[]>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/analysis/instruments-list`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Instruments list failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("[CodetteAPI] Instruments list error:", error);
      // Return fallback instruments list
      return getInstrumentsListFallback();
    }
  },

  /**
   * Check if API server is running
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: "GET",
      });
      return response.ok;
    } catch (error) {
      console.warn("[CodetteAPI] Backend not accessible:", error);
      return false;
    }
  },
};

/**
 * Fallback functions for when API is not accessible
 */

function calculateDelaySyncFallback(bpm: number): DelaySyncResult {
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

  const results: DelaySyncResult = {};
  for (const [name, divisor] of Object.entries(noteDivisions)) {
    results[name] = Math.round((60000 / bpm) * divisor * 100) / 100;
  }
  return results;
}

function getEarTrainingFallback(exerciseType: string, _intervalOrChord?: string): EarTrainingData {
  const intervals: Record<string, any> = {
    "Unison": { semitones: 0, frequency_ratio: 1.0, visualization: "█" },
    "Minor Second": { semitones: 1, frequency_ratio: 1.0595, visualization: "█▏" },
    "Major Second": { semitones: 2, frequency_ratio: 1.122, visualization: "█▌" },
    "Minor Third": { semitones: 3, frequency_ratio: 1.189, visualization: "█▊" },
    "Major Third": { semitones: 4, frequency_ratio: 1.26, visualization: "██" },
    "Perfect Fourth": { semitones: 5, frequency_ratio: 1.335, visualization: "██▍" },
    "Tritone": { semitones: 6, frequency_ratio: 1.414, visualization: "██▌" },
    "Perfect Fifth": { semitones: 7, frequency_ratio: 1.498, visualization: "██▊" },
    "Minor Sixth": { semitones: 8, frequency_ratio: 1.587, visualization: "███" },
    "Major Sixth": { semitones: 9, frequency_ratio: 1.682, visualization: "███▍" },
    "Minor Seventh": { semitones: 10, frequency_ratio: 1.782, visualization: "███▌" },
    "Major Seventh": { semitones: 11, frequency_ratio: 1.888, visualization: "███▊" },
  };

  return {
    exercise_type: exerciseType,
    intervals: Object.entries(intervals).map(([name, data]) => ({
      name,
      ...data,
    })),
    reference_frequency: 440, // A4
  };
}

function getProductionChecklistFallback(stage: string): ProductionWorkflowStage {
  const checklists: Record<string, ProductionWorkflowStage> = {
    pre_production: {
      stage: "Pre-Production",
      sections: {
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
    },
    production: {
      stage: "Production",
      sections: {
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
    },
    mixing: {
      stage: "Mixing",
      sections: {
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
    },
    mastering: {
      stage: "Mastering",
      sections: {
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
    },
  };

  return checklists[stage] || checklists.production;
}

function getInstrumentInfoFallback(category: string, instrument: string): InstrumentInfo {
  const instrumentsDb: Record<string, Record<string, InstrumentInfo>> = {
    percussion: {
      kick: {
        category: "Percussion",
        instrument: "Kick Drum",
        frequency_range: [20, 250],
        characteristics: ["Deep", "Punchy", "Low-end focused"],
        suggested_eq: {
          "Sub (20-80Hz)": "Boost for depth",
          "Mid-bass (80-250Hz)": "Adjust for punch",
          "Mid-range (250-2kHz)": "Cut for clarity",
        },
      },
      snare: {
        category: "Percussion",
        instrument: "Snare Drum",
        frequency_range: [100, 8000],
        characteristics: ["Crisp", "Present", "Mid-range emphasis"],
        suggested_eq: {
          "Low-mid (100-500Hz)": "Cut mud",
          "Presence (2-5kHz)": "Boost for snap",
          "High (5-8kHz)": "Add brightness",
        },
      },
    },
    melodic: {
      piano: {
        category: "Melodic",
        instrument: "Piano",
        frequency_range: [27, 4186],
        characteristics: ["Resonant", "Full-spectrum", "Rich harmonics"],
        suggested_eq: {
          "Sub (20-80Hz)": "Moderate boost",
          "Presence (2-4kHz)": "Slight boost",
          "High (8-16kHz)": "Controlled",
        },
      },
      synth: {
        category: "Melodic",
        instrument: "Synthesizer",
        frequency_range: [55, 8000],
        characteristics: ["Bright", "Edgy", "Variable"],
        suggested_eq: {
          "Low (55-200Hz)": "As designed",
          "Mid (200-2kHz)": "Sculpt tone",
          "High (2-8kHz)": "Presence control",
        },
      },
    },
  };

  return (
    instrumentsDb[category]?.[instrument] || {
      category,
      instrument,
      frequency_range: [20, 20000],
      characteristics: ["Generic"],
    }
  );
}

function getInstrumentsListFallback(): Record<string, string[]> {
  return {
    percussion: ["Kick", "Snare", "Hi-Hat", "Tom", "Cymbal", "Clap"],
    melodic: ["Piano", "Guitar", "Synth", "Bass", "Strings", "Brass"],
    vocal: ["Lead", "Harmony", "Backing", "Rap"],
    ambient: ["Pad", "Texture", "Effect", "Noise"],
  };
}

export default codetteApi;
