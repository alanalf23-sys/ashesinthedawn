/**
 * Codette Advanced API - OpenAI Assistant Function Calls
 * Service layer for 5 advanced music production features
 */

const API_BASE_URL = import.meta.env.VITE_CODETTE_API || 'http://localhost:8000';

// TypeScript Interfaces

export interface GenreDetectionResult {
  success: boolean;
  genre: string;
  genre_id: string;
  confidence: number;
  bpm_range: [number, number];
  characteristics: string[];
  candidates: Array<{
    genre: string;
    genre_id: string;
    confidence: number;
    bpm_range: [number, number];
    characteristics: string[];
  }>;
  input: {
    bpm: number;
    track_count: number;
    project_name: string;
  };
}

export interface ProductionChecklistItem {
  id: string;
  category: string;
  task: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

export interface ProductionChecklistResult {
  success: boolean;
  stage: 'recording' | 'arrangement' | 'mixing' | 'mastering';
  items: ProductionChecklistItem[];
  total_tasks: number;
  high_priority_count: number;
  completion_percentage: number;
}

export interface InstrumentProcessingInfo {
  typical_range_hz?: [number, number];
  target_levels?: {
    peaks_dbfs: string;
    avg_lufs: string;
  };
  common_issues?: string[];
  recommended_processing?: {
    eq?: string[];
    compression?: string[];
    effects?: string[];
  };
  tips?: string[];
}

export interface InstrumentGuideResult {
  success: boolean;
  category: string;
  instrument: string;
  info: InstrumentProcessingInfo;
  formatted_guide: string;
}

export interface EarTrainingQuizItem {
  name: string;
  semitones?: number;
  example?: string;
  // Additional fields for chords/rhythm
  notes?: string[];
  pattern?: string;
}

export interface EarTrainingResult {
  success: boolean;
  exercise_type: 'interval' | 'chord' | 'rhythm';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  quiz_items: EarTrainingQuizItem[];
  instructions: string;
  total_exercises: number;
}

export interface DelaySyncResult {
  success: boolean;
  bpm: number;
  note_division: string;
  delay_ms: number;
  delay_seconds: number;
  beat_value: number;
  formula: string;
  use_case: string;
}

// API Functions

/**
 * Detect music genre based on BPM, tracks, and project context
 */
export async function detectGenre(
  bpm: number,
  tracks?: Array<{ name: string; type: string }>,
  projectName?: string
): Promise<GenreDetectionResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analysis/detect-genre`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bpm,
        tracks: tracks || [],
        project_name: projectName || '',
      }),
    });

    if (!response.ok) {
      throw new Error(`Genre detection failed: ${response.statusText}`);
    }

    const result: GenreDetectionResult = await response.json();
    return result;
  } catch (error) {
    console.error('[CodetteAdvancedAPI] detectGenre error:', error);
    throw error;
  }
}

/**
 * Get production checklist for specific stage
 */
export async function getProductionChecklist(
  stage: 'recording' | 'arrangement' | 'mixing' | 'mastering'
): Promise<ProductionChecklistResult> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/analysis/production-checklist?stage=${stage}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      throw new Error(`Production checklist failed: ${response.statusText}`);
    }

    const result: ProductionChecklistResult = await response.json();
    return result;
  } catch (error) {
    console.error('[CodetteAdvancedAPI] getProductionChecklist error:', error);
    throw error;
  }
}

/**
 * Get instrument processing guide
 */
export async function getInstrumentGuide(
  category: 'vocals' | 'drums' | 'guitars' | 'bass' | 'keys' | 'strings' | 'brass' | 'woodwinds',
  instrument: string
): Promise<InstrumentGuideResult> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/analysis/instrument-info?category=${category}&instrument=${instrument}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      throw new Error(`Instrument guide failed: ${response.statusText}`);
    }

    const result: InstrumentGuideResult = await response.json();
    return result;
  } catch (error) {
    console.error('[CodetteAdvancedAPI] getInstrumentGuide error:', error);
    throw error;
  }
}

/**
 * Get ear training exercise
 */
export async function getEarTrainingExercise(
  exerciseType: 'interval' | 'chord' | 'rhythm',
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): Promise<EarTrainingResult> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/analysis/ear-training?exercise_type=${exerciseType}&difficulty=${difficulty}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      throw new Error(`Ear training failed: ${response.statusText}`);
    }

    const result: EarTrainingResult = await response.json();
    return result;
  } catch (error) {
    console.error('[CodetteAdvancedAPI] getEarTrainingExercise error:', error);
    throw error;
  }
}

/**
 * Calculate tempo-synced delay times
 */
export async function calculateDelaySync(
  bpm: number,
  noteDivision: 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth' | 'dotted_quarter' | 'dotted_eighth' | 'triplet_quarter' | 'triplet_eighth'
): Promise<DelaySyncResult> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/analysis/delay-sync?bpm=${bpm}&note_division=${noteDivision}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      throw new Error(`Delay sync calculation failed: ${response.statusText}`);
    }

    const result: DelaySyncResult = await response.json();
    return result;
  } catch (error) {
    console.error('[CodetteAdvancedAPI] calculateDelaySync error:', error);
    throw error;
  }
}

/**
 * Error handling helper
 */
export function isAPIError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Format API error for display
 */
export function formatAPIError(error: unknown): string {
  if (isAPIError(error)) {
    return error.message;
  }
  return 'An unknown error occurred';
}
