/**
 * Codette Bridge Service
 * Handles HTTP communication between React frontend and Codette Python backend
 * 
 * Backend endpoints:
 * - http://localhost:5000/ (Flask web interface)
 * - http://localhost:8000/ (FastAPI if available)
 */

export interface CodetteBridgeConfig {
  backendUrl: string;
  timeout: number;
  retryAttempts: number;
}

export interface CodettePrediction {
  id: string;
  type: 'session' | 'mixing' | 'routing' | 'mastering' | 'creative' | 'gain';
  prediction: string;
  confidence: number;
  actionItems: Array<{
    action: string;
    parameter: string;
    value: number | string;
    priority: 'high' | 'medium' | 'low';
  }>;
  reasoning: string;
  timestamp: number;
}

export interface CodetteResponse {
  success: boolean;
  data: CodettePrediction | null;
  error?: string;
  duration: number;
}

class CodetteBridgeService {
  private config: CodetteBridgeConfig;
  private isHealthy: boolean = false;
  private analysisCache: Map<string, CodettePrediction> = new Map();

  constructor(config?: Partial<CodetteBridgeConfig>) {
    this.config = {
      backendUrl: process.env.REACT_APP_CODETTE_BACKEND || 'http://localhost:5000',
      timeout: parseInt(process.env.REACT_APP_CODETTE_TIMEOUT || '10000'),
      retryAttempts: parseInt(process.env.REACT_APP_CODETTE_RETRIES || '3'),
      ...config,
    };

    this.initializeConnection();
  }

  /**
   * Initialize connection to Codette backend
   */
  private async initializeConnection(): Promise<void> {
    try {
      const response = await this.healthCheck();
      this.isHealthy = response.success;
      if (this.isHealthy) {
        console.log('🌉 Codette Bridge connected successfully');
      }
    } catch (error) {
      console.warn('⚠️ Codette Backend unavailable, will use local processing', error);
      this.isHealthy = false;
    }
  }

  /**
   * Check if backend is healthy
   */
  async healthCheck(): Promise<CodetteResponse> {
    return this.makeRequest('GET', '/api/health', null, 1);
  }

  /**
   * Check if bridge is connected to backend
   */
  isConnected(): boolean {
    return this.isHealthy;
  }

  /**
   * Analyze session with Codette backend
   */
  async analyzeSession(context: {
    trackCount: number;
    totalDuration: number;
    sampleRate: number;
    trackMetrics: Array<{
      trackId: string;
      name: string;
      type: string;
      level: number;
      peak: number;
      plugins: string[];
    }>;
    masterLevel: number;
    masterPeak: number;
    hasClipping: boolean;
  }): Promise<CodettePrediction> {
    const cacheKey = `session_${JSON.stringify(context).slice(0, 100)}`;
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!;
    }

    const response = await this.makeRequest('POST', '/api/analyze/session', context);
    if (response.success && response.data) {
      this.analysisCache.set(cacheKey, response.data);
      return response.data;
    }
    throw new Error(response.error || 'Session analysis failed');
  }

  /**
   * Get mixing intelligence for a specific track
   */
  async getMixingIntelligence(trackType: string, metrics: {
    level: number;
    peak: number;
    plugins: string[];
  }): Promise<CodettePrediction> {
    const response = await this.makeRequest('POST', '/api/analyze/mixing', {
      trackType,
      metrics,
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Mixing analysis failed');
  }

  /**
   * Get routing intelligence
   */
  async getRoutingIntelligence(context: {
    trackCount: number;
    trackTypes: string[];
    hasAux: boolean;
  }): Promise<CodettePrediction> {
    const response = await this.makeRequest('POST', '/api/analyze/routing', context);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Routing analysis failed');
  }

  /**
   * Get mastering intelligence
   */
  async getMasteringIntelligence(levels: {
    masterLevel: number;
    masterPeak: number;
    hasClipping: boolean;
  }): Promise<CodettePrediction> {
    const response = await this.makeRequest('POST', '/api/analyze/mastering', levels);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Mastering analysis failed');
  }

  /**
   * Get creative suggestions
   */
  async getCreativeIntelligence(context: {
    trackTypes: string[];
    sessionDuration: number;
    trackCount: number;
  }): Promise<CodettePrediction> {
    const response = await this.makeRequest('POST', '/api/analyze/creative', context);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Creative analysis failed');
  }

  /**
   * Send gain staging recommendation request
   */
  async getGainStagingAdvice(tracks: Array<{
    id: string;
    level: number;
    peak: number;
  }>): Promise<CodettePrediction> {
    const response = await this.makeRequest('POST', '/api/analyze/gain-staging', { tracks });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Gain staging analysis failed');
  }

  /**
   * Stream real-time analysis (if backend supports it)
   */
  async *streamAnalysis(context: Record<string, unknown>): AsyncGenerator<CodettePrediction, void, unknown> {
    try {
      const response = await fetch(`${this.config.backendUrl}/api/analyze/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.trim());
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              yield data as CodettePrediction;
            } catch (e) {
              console.warn('Failed to parse stream data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Streaming not available:', error);
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest(
    method: 'GET' | 'POST',
    endpoint: string,
    body: Record<string, unknown> | null,
    retryCount: number = this.config.retryAttempts
  ): Promise<CodetteResponse> {
    const startTime = performance.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      try {
        const response = await fetch(`${this.config.backendUrl}${endpoint}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'X-Codette-Request': 'true',
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const duration = performance.now() - startTime;

        console.log(`📡 Codette ${method} ${endpoint} completed in ${duration.toFixed(0)}ms`);

        return {
          success: true,
          data: data as CodettePrediction,
          duration,
        };
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorName = error instanceof Error ? error.name : 'Unknown';

      if (retryCount > 0 && (errorName === 'AbortError' || errorMessage.includes('Failed to fetch'))) {
        console.warn(`⚠️ Request failed, retrying... (${retryCount} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.makeRequest(method, endpoint, body, retryCount - 1);
      }

      console.error(`❌ Codette request failed:`, errorMessage);

      return {
        success: false,
        data: null,
        error: errorMessage,
        duration,
      };
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.analysisCache.clear();
    console.log('🗑️ Codette analysis cache cleared');
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.analysisCache.size,
      entries: Array.from(this.analysisCache.keys()),
    };
  }
}

// Singleton instance
let bridgeInstance: CodetteBridgeService | null = null;

/**
 * Get or create Codette Bridge service instance
 */
export function getCodetteBridge(config?: Partial<CodetteBridgeConfig>): CodetteBridgeService {
  if (!bridgeInstance) {
    bridgeInstance = new CodetteBridgeService(config);
  }
  return bridgeInstance;
}

export default CodetteBridgeService;
