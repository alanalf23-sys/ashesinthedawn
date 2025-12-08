/**
 * Codette API Client - Frontend Integration
 * Comprehensive TypeScript client for all 50+ Codette Server endpoints
 * Includes request/response typing, error handling, and caching
 * 
 * Generated from OpenAPI spec validation against codette_server_unified.py
 */

// ============================================================================
// TYPE DEFINITIONS - Request/Response Models
// ============================================================================

export interface ChatRequest {
  message: string;
  perspective?: 'mix_engineering' | 'production' | 'composition';
  context?: Record<string, any>;
  conversation_id?: string;
  daw_context?: Record<string, any>;
}

export interface ChatResponse {
  response: string;
  perspective: string;
  confidence?: number;
  timestamp?: string;
  source?: string;
  ml_score?: Record<string, number>;
}

export interface AudioAnalysisRequest {
  audio_data?: Record<string, any>;
  analysis_type?: 'spectrum' | 'frequency' | 'waveform';
  track_data?: Record<string, any>;
  track_id?: string;
}

export interface AudioAnalysisResponse {
  trackId: string;
  analysis: Record<string, any>;
  status: string;
  timestamp?: string;
}

export interface SuggestionRequest {
  context: Record<string, any>;
  limit?: number;
}

export interface SuggestionResponse {
  suggestions: Record<string, any>[];
  confidence?: number;
  timestamp?: string;
}

export interface ProcessRequest {
  id: string;
  type: string;
  payload: Record<string, any>;
  timestamp: number;
}

export interface ProcessResponse {
  id: string;
  status: string;
  data: Record<string, any>;
  processingTime: number;
}

export interface TransportState {
  playing: boolean;
  time_seconds: number;
  sample_pos: number;
  bpm: number;
  beat_pos: number;
  loop_enabled: boolean;
  loop_start_seconds: number;
  loop_end_seconds: number;
}

export interface TransportCommandResponse {
  success: boolean;
  message: string;
  state?: TransportState;
}

export interface CloudSyncRequest {
  project_id: string;
  project_data?: Record<string, any>;
  device_id: string;
  operation: 'save' | 'load' | 'merge';
  conflict_resolution?: 'local' | 'remote' | 'merge';
}

export interface DeviceRegistration {
  device_name: string;
  device_type: 'desktop' | 'laptop' | 'tablet';
  platform: 'windows' | 'macos' | 'linux';
  user_id?: string;
  capabilities?: Record<string, boolean>;
}

export interface CollaborationOperation {
  operation_type: string;
  user_id: string;
  device_id: string;
  project_id: string;
  data: Record<string, any>;
}

export interface VSTPlugin {
  id: string;
  name: string;
  path: string;
  parameters: PluginParameter[];
}

export interface PluginParameter {
  id: string;
  name: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  isAutomatable: boolean;
}

export interface AudioDevice {
  id: string;
  name: string;
  kind: 'audioinput' | 'audiooutput';
  channels?: number;
  sampleRate?: number;
}

export interface MessageEmbeddingRequest {
  message: string;
  conversation_id?: string;
  role?: 'user' | 'assistant';
  metadata?: Record<string, any>;
}

export interface MessageEmbeddingResponse {
  success: boolean;
  message_id?: string;
  embedding?: number[];
  similar_messages?: Record<string, any>[];
  timestamp?: string;
}

export interface EmbedRow {
  id: string;
  text: string;
}

export interface UpsertRequest {
  rows: EmbedRow[];
}

export interface UpsertResponse {
  success: boolean;
  processed: number;
  updated: number;
  message: string;
}

export interface CacheStats {
  total_entries: number;
  memory_usage_mb: number;
  hit_rate: number;
  miss_rate: number;
  eviction_rate: number;
}

export interface CacheMetrics {
  stats: CacheStats;
  top_keys: string[];
  backend: 'memory' | 'redis';
  response_times: Record<string, number>;
}

export interface GenreDetectRequest {
  bpm?: number;
  tracks?: Array<{ name?: string; type?: string }>;
  project_name?: string;
}

// ============================================================================
// API CLIENT - Singleton Pattern
// ============================================================================

class CodetteApiClient {
  private baseUrl: string;
  private timeout: number = 30000;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000;

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Make HTTP request with error handling and retry logic
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    data?: Record<string, any>,
    options: { timeout?: number; retries?: number } = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const timeout = options.timeout || this.timeout;
    const maxRetries = options.retries || this.retryAttempts;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const requestInit: RequestInit = {
          method,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
          requestInit.body = JSON.stringify(data);
        }

        const response = await fetch(url, requestInit);
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        return result as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          continue;
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  // =========================================================================
  // HEALTH & STATUS ENDPOINTS
  // =========================================================================

  async getHealth(): Promise<{ status: string }> {
    return this.request<{ status: string }>('GET', '/health');
  }

  async getApiHealth(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('GET', '/api/health');
  }

  async getStatus(): Promise<Record<string, any>> {
    return this.request<Record<string, any>>('GET', '/codette/status');
  }

  // =========================================================================
  // CHAT & AI ENDPOINTS
  // =========================================================================

  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>('POST', '/codette/chat', request);
  }

  async analyzeAudio(request: AudioAnalysisRequest): Promise<AudioAnalysisResponse> {
    return this.request<AudioAnalysisResponse>('POST', '/codette/analyze', request);
  }

  async getSuggestions(request: SuggestionRequest): Promise<SuggestionResponse> {
    return this.request<SuggestionResponse>('POST', '/codette/suggest', request);
  }

  async processRequest(request: ProcessRequest): Promise<ProcessResponse> {
    return this.request<ProcessResponse>('POST', '/codette/process', request);
  }

  // =========================================================================
  // TRAINING ENDPOINTS
  // =========================================================================

  async getTrainingContext(): Promise<Record<string, any>> {
    return this.request<Record<string, any>>('GET', '/api/training/context');
  }

  async getTrainingHealth(): Promise<Record<string, any>> {
    return this.request<Record<string, any>>('GET', '/api/training/health');
  }

  // =========================================================================
  // EMBEDDINGS ENDPOINTS
  // =========================================================================

  async storeMessageEmbedding(request: MessageEmbeddingRequest): Promise<MessageEmbeddingResponse> {
    return this.request<MessageEmbeddingResponse>('POST', '/codette/embeddings/store', request);
  }

  async searchSimilarMessages(request: MessageEmbeddingRequest): Promise<Record<string, any>> {
    return this.request<Record<string, any>>('POST', '/codette/embeddings/search', request);
  }

  async getEmbeddingStats(): Promise<Record<string, any>> {
    return this.request<Record<string, any>>('GET', '/codette/embeddings/stats');
  }

  async upsertEmbeddings(request: UpsertRequest): Promise<UpsertResponse> {
    return this.request<UpsertResponse>('POST', '/api/upsert-embeddings', request);
  }

  // =========================================================================
  // CACHE ENDPOINTS
  // =========================================================================

  async getCacheStats(): Promise<CacheStats> {
    return this.request<CacheStats>('GET', '/codette/cache/stats');
  }

  async getCacheMetrics(): Promise<CacheMetrics> {
    return this.request<CacheMetrics>('GET', '/codette/cache/metrics');
  }

  async getCacheStatus(): Promise<{ backend: 'memory' | 'redis'; connected: boolean }> {
    return this.request<{ backend: 'memory' | 'redis'; connected: boolean }>('GET', '/codette/cache/status');
  }

  async clearCache(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('POST', '/codette/cache/clear');
  }

  // =========================================================================
  // ANALYTICS ENDPOINTS
  // =========================================================================

  async getAnalyticsDashboard(): Promise<Record<string, any>> {
    return this.request<Record<string, any>>('GET', '/codette/analytics/dashboard');
  }

  // =========================================================================
  // TRANSPORT & STATUS ENDPOINTS
  // =========================================================================

  /**
   * The backend exposes transport state via the websocket status endpoint and
   * via codette status routes. There are no dedicated REST transport control
   * endpoints in the current backend. Expose methods to fetch transport state
   * and websocket status so the frontend can use WS for control and poll if
   * needed.
   */
  async getWebsocketStatus(): Promise<Record<string, any>> {
    return this.request<Record<string, any>>('GET', '/ws/status');
  }

  async getCodetteStatus(): Promise<Record<string, any>> {
    return this.request<Record<string, any>>('GET', '/codette/status');
  }

  async getHealthStatus(): Promise<Record<string, any>> {
    return this.request<Record<string, any>>('GET', '/health');
  }

  // =========================================================================
  // MIXING SUGGESTIONS
  // =========================================================================

  async getMixingSuggestions(payload: {
    track_type: string;
    audio_data?: number[] | null;
    sample_rate?: number;
    track_info: Record<string, any>;
    context: Record<string, any>;
  }): Promise<Record<string, any>> {
    return this.request<Record<string, any>>('POST', '/codette/mixing-suggestions', payload);
  }

  // =========================================================================
  // GENRE & ANALYSIS ENDPOINTS
  // =========================================================================

  async detectGenre(request: GenreDetectRequest): Promise<Record<string, any>> {
    return this.request<Record<string, any>>('POST', '/api/analysis/detect-genre', request);
  }

  async getFrequencyQuiz(difficulty: string = 'beginner'): Promise<Record<string, any>> {
    return this.request<Record<string, any>>('GET', `/api/analysis/frequency-quiz?difficulty=${encodeURIComponent(difficulty)}`);
  }

  // =========================================================================
  // MIX CREATION (Agent-driven)
  // =========================================================================

  async createMixFromTracks(request: { track_identifiers: string[]; project_path?: string; options?: Record<string, any> }) {
    return this.request<Record<string, any>>('POST', '/api/mixes/create_from_tracks', request);
  }

  // =========================================================================
  // DAW EFFECTS ENDPOINTS
  // =========================================================================

  async listEffects(): Promise<Array<{ id: string; name: string; category: string }>> {
    return this.request<Array<{ id: string; name: string; category: string }>>('GET', '/daw/effects/list');
  }

  async getEffectInfo(effectId: string): Promise<Record<string, any>> {
    return this.request<Record<string, any>>('GET', `/daw/effects/${effectId}`);
  }

  async processAudio(data: Record<string, any>): Promise<Record<string, any>> {
    return this.request<Record<string, any>>('POST', '/daw/effects/process', data);
  }

  // =========================================================================
  // GENRE ENDPOINTS
  // =========================================================================

  async getAvailableGenres(): Promise<string[]> {
    return this.request<string[]>('GET', '/codette/genres');
  }

  async getGenreCharacteristics(genreId: string): Promise<Record<string, any>> {
    return this.request<Record<string, any>>('GET', `/codette/genre/${genreId}`);
  }

  // =========================================================================
  // CLOUD SYNC ENDPOINTS
  // =========================================================================

  async saveProjectToCloud(request: CloudSyncRequest): Promise<{ success: boolean; project_id: string }> {
    return this.request<{ success: boolean; project_id: string }>('POST', '/api/cloud-sync/save', request);
  }

  async loadProjectFromCloud(projectId: string, deviceId: string): Promise<Record<string, any>> {
    return this.request<Record<string, any>>(
      'GET',
      `/api/cloud-sync/load/${projectId}?device_id=${deviceId}`
    );
  }

  async listCloudProjects(): Promise<Array<{ id: string; name: string; updated_at: string }>> {
    return this.request<Array<{ id: string; name: string; updated_at: string }>>('GET', '/api/cloud-sync/list');
  }

  // =========================================================================
  // DEVICE ENDPOINTS
  // =========================================================================

  async registerDevice(request: DeviceRegistration): Promise<{ device_id: string }> {
    return this.request<{ device_id: string }>('POST', '/api/devices/register', request);
  }

  async listUserDevices(userId: string): Promise<Array<{ id: string; name: string; platform: string }>> {
    return this.request<Array<{ id: string; name: string; platform: string }>>('GET', `/api/devices/${userId}`);
  }

  async syncSettingsAcrossDevices(userId: string, settings: Record<string, any>): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('POST', `/api/devices/sync-settings?user_id=${userId}`, settings);
  }

  // =========================================================================
  // COLLABORATION ENDPOINTS
  // =========================================================================

  async joinCollaborationSession(
    projectId: string,
    userId: string,
    userName: string
  ): Promise<{ session_id: string; users: string[] }> {
    return this.request<{ session_id: string; users: string[] }>(
      'POST',
      `/api/collaboration/join?project_id=${projectId}&user_id=${userId}&user_name=${userName}`
    );
  }

  async submitCollaborationOperation(request: CollaborationOperation): Promise<{ success: boolean; version: number }> {
    return this.request<{ success: boolean; version: number }>('POST', '/api/collaboration/operation', request);
  }

  async getCollaborationSession(projectId: string): Promise<{ users: string[]; operations: any[] }> {
    return this.request<{ users: string[]; operations: any[] }>('GET', `/api/collaboration/session/${projectId}`);
  }

  // =========================================================================
  // VST ENDPOINTS
  // =========================================================================

  async loadVSTPlugin(pluginPath: string, pluginName: string): Promise<VSTPlugin> {
    return this.request<VSTPlugin>(
      'POST',
      `/api/vst/load?plugin_path=${encodeURIComponent(pluginPath)}&plugin_name=${encodeURIComponent(pluginName)}`
    );
  }

  async listVSTPlugins(): Promise<VSTPlugin[]> {
    return this.request<VSTPlugin[]>('GET', '/api/vst/list');
  }

  async setVSTParameter(pluginId: string, parameterId: string, value: number): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(
      'POST',
      `/api/vst/parameter?plugin_id=${pluginId}&parameter_id=${parameterId}&value=${value}`
    );
  }

  // =========================================================================
  // AUDIO I/O ENDPOINTS
  // =========================================================================

  async getAudioDevices(): Promise<AudioDevice[]> {
    return this.request<AudioDevice[]>('GET', '/api/audio/devices');
  }

  async measureAudioLatency(): Promise<{ latency_ms: number; stability: number }> {
    return this.request<{ latency_ms: number; stability: number }>('POST', '/api/audio/measure-latency');
  }

  async getAudioSettings(): Promise<Record<string, any>> {
    return this.request<Record<string, any>>('GET', '/api/audio/settings');
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let clientInstance: CodetteApiClient | null = null;

export function getApiClient(baseUrl?: string): CodetteApiClient {
  if (!clientInstance) {
    clientInstance = new CodetteApiClient(baseUrl);
  }
  return clientInstance;
}

export default CodetteApiClient;
