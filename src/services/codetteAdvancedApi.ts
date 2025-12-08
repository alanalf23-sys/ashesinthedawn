// Codette Advanced API - service layer for advanced music production features

// Read API base from globalThis only to avoid import.meta usage that can cause TS errors
const API_BASE_URL: string | null = (globalThis as any)?.VITE_CODETTE_API ? String((globalThis as any).VITE_CODETTE_API).trim() : null;
export const API_ENABLED = Boolean(API_BASE_URL && API_BASE_URL.length > 0);

import codetteApi from '@/lib/codetteApi';

// Helper: if primary fails with 404 or network error, retry with alternate port (8000/8001)
async function fetchWithFallback(url: string, init?: RequestInit): Promise<Response> {
  if (!API_ENABLED) {
    // Avoid attempting network requests when API is not configured
    return Promise.reject(new Error('Codette API disabled (no VITE_CODETTE_API configured)'));
  }

  const tryPrimary = async () => fetch(url, init);

  try {
    const res = await tryPrimary();
    if (res.status === 404) {
      const alt = url.replace(':8001', ':8000').replace(':8000', ':8001');
      try {
        const altRes = await fetch(alt, init);
        return altRes;
      } catch (err) {
        return res;
      }
    }
    return res;
  } catch (err) {
    // Network error - try alternate
    try {
      const alt = url.replace(':8001', ':8000').replace(':8000', ':8001');
      const altRes = await fetch(alt, init);
      return altRes;
    } catch (err2) {
      throw err;
    }
  }
}

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
  tracks?: Array<{ name: string; type: string }> ,
  projectName?: string
): Promise<GenreDetectionResult> {
  try {
    // Try backend first via shared codetteApi client
    const data = await codetteApi.detectGenre({ bpm, timeSignature: '4/4', trackCount: (tracks || []).length, keySignature: '' });

    const genre = (data.detected_genre || 'Unknown') as string;
    const confidence = typeof data.confidence === 'number' ? data.confidence : 0.5;
    const bpmRange = (data.bpm_range as [number, number]) || [Math.max(1, bpm - 10), bpm + 10];

    return {
      success: true,
      genre,
      genre_id: genre.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      confidence,
      bpm_range: bpmRange,
      characteristics: data.instrumentation || [],
      candidates: [
        {
          genre,
          genre_id: genre.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
          confidence,
          bpm_range: bpmRange,
          characteristics: data.instrumentation || [],
        },
      ],
      input: {
        bpm,
        track_count: (tracks || []).length,
        project_name: projectName || '',
      },
    };
  } catch (error) {
    console.error('[CodetteAdvancedAPI] detectGenre error:', error);
    // Fallback heuristic based on BPM
    let candidates: GenreDetectionResult['candidates'] = [];
    let genre = 'Electronic';
    if (bpm < 80) genre = 'Ambient';
    else if (bpm < 100) genre = 'Hip Hop';
    else if (bpm < 120) genre = 'Pop';
    else if (bpm < 140) genre = 'House';
    else genre = 'Drum & Bass';

    candidates.push({ genre, genre_id: genre.toLowerCase().replace(/[^a-z0-9]+/g, '_'), confidence: 0.5, bpm_range: [Math.max(1, bpm - 10), bpm + 10], characteristics: [] });

    return {
      success: false,
      genre,
      genre_id: genre.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      confidence: 0.5,
      bpm_range: [Math.max(1, bpm - 10), bpm + 10],
      characteristics: [],
      candidates,
      input: { bpm, track_count: (tracks || []).length, project_name: projectName || '' },
    };
  }
}

/**
 * Get production checklist for specific stage
 */
export async function getProductionChecklist(
  stage: 'recording' | 'arrangement' | 'mixing' | 'mastering'
): Promise<ProductionChecklistResult> {
  // If API is disabled, return fallback quickly without attempting any network calls
  if (!API_ENABLED) {
    const fallbackItems: ProductionChecklistItem[] = [
      { id: '1', category: 'Setup', task: 'Set BPM and project template', priority: 'high', completed: false },
      { id: '2', category: 'Recording', task: 'Check input levels', priority: 'high', completed: false },
      { id: '3', category: 'Mixing', task: 'Set rough balances', priority: 'medium', completed: false },
    ];
    return {
      success: false,
      stage,
      items: fallbackItems,
      total_tasks: fallbackItems.length,
      high_priority_count: fallbackItems.filter(i => i.priority === 'high').length,
      completion_percentage: 0,
    };
  }

  try {
    const url = `${API_BASE_URL}/api/analysis/production-checklist?stage=${stage}`;
    const response = await fetchWithFallback(url, { method: 'GET' });
    if (!response.ok) throw new Error(response.statusText);
    const json = await response.json();

    // Map backend sections into flat items for our interface
    const sections = json.sections || json;
    const items: ProductionChecklistItem[] = [];
    let idCounter = 1;
    Object.entries(sections).forEach(([sectionName, tasks]: any) => {
      (tasks as string[]).forEach((t: string) => {
        items.push({ id: String(idCounter++), category: sectionName, task: t, priority: 'medium', completed: false });
      });
    });

    const total = items.length || 0;
    const highPriority = items.filter(i => i.priority === 'high').length;

    return {
      success: true,
      stage,
      items,
      total_tasks: total,
      high_priority_count: highPriority,
      completion_percentage: 0,
    };
  } catch (error) {
    console.error('[CodetteAdvancedAPI] getProductionChecklist error:', error);
    // Fallback simple checklist
    const fallbackItems: ProductionChecklistItem[] = [
      { id: '1', category: 'Setup', task: 'Set BPM and project template', priority: 'high', completed: false },
      { id: '2', category: 'Recording', task: 'Check input levels', priority: 'high', completed: false },
      { id: '3', category: 'Mixing', task: 'Set rough balances', priority: 'medium', completed: false },
    ];
    return {
      success: false,
      stage,
      items: fallbackItems,
      total_tasks: fallbackItems.length,
      high_priority_count: fallbackItems.filter(i => i.priority === 'high').length,
      completion_percentage: 0,
    };
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
    // Try shared client first
    const info = await codetteApi.getInstrumentInfo(category, instrument);
    return {
      success: true,
      category: info.category || category,
      instrument: info.instrument || instrument,
      info: {
        typical_range_hz: (info.frequency_range as [number, number]) || [20, 20000],
        target_levels: { peaks_dbfs: '-6dBFS', avg_lufs: '-14 LUFS' },
        common_issues: info.characteristics || [],
        recommended_processing: { eq: Object.keys(info.suggested_eq || {}) || [] },
        tips: info.use_cases || [],
      },
      formatted_guide: `Instrument: ${instrument} (${category})\nRange: ${(info.frequency_range || [20,20000]).join('-')} Hz`,
    };
  } catch (error) {
    console.error('[CodetteAdvancedAPI] getInstrumentGuide error:', error);
    return {
      success: false,
      category,
      instrument,
      info: { typical_range_hz: [20, 20000], target_levels: { peaks_dbfs: '-6dBFS', avg_lufs: '-14 LUFS' }, common_issues: [], recommended_processing: {}, tips: [] },
      formatted_guide: `No data available for ${instrument}`,
    };
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
    const url = `${API_BASE_URL}/api/analysis/ear-training?exercise_type=${exerciseType}&difficulty=${difficulty}`;
    const response = await fetchWithFallback(url, { method: 'GET' });
    if (!response.ok) throw new Error(response.statusText);
    const json = await response.json();

    const items: EarTrainingQuizItem[] = (json.intervals || json.quiz_items || []).map((it: any) => ({ name: it.name, semitones: it.semitones, example: it.visualization }))

    return {
      success: true,
      exercise_type: (json.exercise_type as any) || exerciseType,
      difficulty: (json.difficulty as any) || difficulty,
      quiz_items: items,
      instructions: json.instructions || 'Listen and identify the interval.',
      total_exercises: items.length,
    };
  } catch (error) {
    console.error('[CodetteAdvancedAPI] getEarTrainingExercise error:', error);
    // Fallback simple intervals
    const fallbackItems: EarTrainingQuizItem[] = [
      { name: 'Minor Third', semitones: 3, example: 'C → Eb' },
      { name: 'Perfect Fifth', semitones: 7, example: 'C → G' },
    ];
    return {
      success: false,
      exercise_type: exerciseType,
      difficulty,
      quiz_items: fallbackItems,
      instructions: 'Fallback exercises',
      total_exercises: fallbackItems.length,
    };
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
    // Prefer backend full-table if available
    const url = `${API_BASE_URL}/api/analysis/delay-sync?bpm=${bpm}`;
    const backend = await fetchWithFallback(url, { method: 'GET' });
    if (backend.ok) {
      const table = await backend.json();
      // Try to map incoming noteDivision to one of the table keys
      const keyMap: Record<string, string> = {
        whole: 'Whole Note',
        half: 'Half Note',
        quarter: 'Quarter Note',
        eighth: 'Eighth Note',
        sixteenth: '16th Note',
        dotted_quarter: 'Dotted Quarter',
        dotted_eighth: 'Dotted Eighth',
        triplet_quarter: 'Triplet Quarter',
        triplet_eighth: 'Triplet Eighth',
      };
      const name = keyMap[noteDivision] || noteDivision;
      const delayMs = Number(table[name] ?? table['Quarter Note'] ?? Math.round((60000 / bpm) * 1 * 100) / 100);
      return {
        success: true,
        bpm,
        note_division: noteDivision,
        delay_ms: delayMs,
        delay_seconds: Math.round((delayMs / 1000) * 1000) / 1000,
        beat_value: (delayMs / (60000 / bpm)),
        formula: `delay_ms = (60000 / bpm) * multiplier`,
        use_case: 'Tempo-synced delay for musical timing',
      };
    }
  } catch (err) {
    // ignore and compute locally
  }

  // Local calculation (reliable math)
  const divisionMap: Record<string, number> = {
    whole: 4,
    half: 2,
    quarter: 1,
    eighth: 0.5,
    sixteenth: 0.25,
    dotted_quarter: 1.5,
    dotted_eighth: 0.75,
    triplet_quarter: 2 / 3,
    triplet_eighth: 1 / 3,
  };

  const multiplier = divisionMap[noteDivision] ?? 1;
  const delayMs = Math.round((60000 / Math.max(1, bpm)) * multiplier * 100) / 100;
  const delaySeconds = Math.round((delayMs / 1000) * 1000) / 1000;

  return {
    success: true,
    bpm,
    note_division: noteDivision,
    delay_ms: delayMs,
    delay_seconds: delaySeconds,
    beat_value: multiplier,
    formula: `delay_ms = (60000 / bpm) * ${multiplier}`,
    use_case: 'Use for setting plugin delay time synced to project tempo',
  };
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
