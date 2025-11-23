/**
 * Codette Python Backend Integration
 * Bridges React frontend with Codette AI Python engine
 */

export interface CodetteRequest {
  id: string;
  type: 'audio_analysis' | 'chat' | 'suggestion' | 'optimization' | 'mastering';
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface CodetteResponse {
  id: string;
  status: 'success' | 'pending' | 'error';
  data: Record<string, unknown>;
  error?: string;
  processingTime: number;
}

export type CodettePerpsective = 'neuralnets' | 'newtonian' | 'davinci' | 'quantum';

export interface CodetteChatMessage {
  role: 'user' | 'codette';
  content: string;
  timestamp: number;
  perspective?: CodettePerpsective;
}

class CodettePythonIntegration {
  private baseUrl: string;
  private apiKey: string;
  private requestCache: Map<string, CodetteResponse> = new Map();
  private chatHistory: CodetteChatMessage[] = [];
  private isConnected: boolean = false;

  constructor(baseUrl: string = 'http://localhost:8000', apiKey: string = '') {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.initializeConnection();
  }

  /**
   * Initialize connection to Codette backend
   */
  private async initializeConnection(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: this.buildHeaders(),
      });
      this.isConnected = response.ok;
      console.log('Codette backend connection:', this.isConnected ? 'established' : 'failed');
    } catch (error) {
      console.warn('Codette backend not available:', error);
      this.isConnected = false;
    }
  }

  /**
   * Build request headers with API key if available
   */
  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  /**
   * Send chat message to Codette and get response
   */
  async chat(message: string, perspective?: string): Promise<CodetteChatMessage> {
    try {
      const userMessage: CodetteChatMessage = {
        role: 'user',
        content: message,
        timestamp: Date.now(),
        perspective: perspective as CodettePerpsective,
      };
      
      this.chatHistory.push(userMessage);

      const request: CodetteRequest = {
        id: `chat-${Date.now()}`,
        type: 'chat',
        payload: {
          message,
          perspective: perspective || 'neuralnets',
          context: this.chatHistory.slice(-5), // Include last 5 messages for context
        },
        timestamp: Date.now(),
      };

      const response = await this.sendRequest(request);

      const responseData = response as Record<string, string>;
      const codetteMessage: CodetteChatMessage = {
        role: 'codette',
        content: (responseData.response as string) || 'No response',
        timestamp: Date.now(),
        perspective: perspective as CodettePerpsective,
      };

      this.chatHistory.push(codetteMessage);
      return codetteMessage;
    } catch (error) {
      console.error('Chat request failed:', error);
      throw error;
    }
  }

  /**
   * Analyze audio with Codette AI
   */
  async analyzeAudioWithAI(
    trackId: string,
    audioData: number[],
    sampleRate: number = 44100
  ): Promise<Record<string, unknown>> {
    try {
      const request: CodetteRequest = {
        id: `audio-${trackId}`,
        type: 'audio_analysis',
        payload: {
          trackId,
          audioData: audioData.slice(0, 1000), // Sample audio for efficiency
          sampleRate,
          contentType: 'audio/wav',
        },
        timestamp: Date.now(),
      };

      return await this.sendRequest(request);
    } catch (error) {
      console.error('Audio analysis failed:', error);
      throw error;
    }
  }

  /**
   * Get smart suggestions from Codette
   */
  async getSuggestions(context: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const request: CodetteRequest = {
        id: `suggest-${Date.now()}`,
        type: 'suggestion',
        payload: context,
        timestamp: Date.now(),
      };

      return await this.sendRequest(request);
    } catch (error) {
      console.error('Suggestion request failed:', error);
      throw error;
    }
  }

  /**
   * Get mastering recommendations
   */
  async getMasteringAdvice(tracks: Record<string, unknown>[]): Promise<Record<string, unknown>> {
    try {
      const request: CodetteRequest = {
        id: `mastering-${Date.now()}`,
        type: 'mastering',
        payload: { tracks },
        timestamp: Date.now(),
      };

      return await this.sendRequest(request);
    } catch (error) {
      console.error('Mastering advice failed:', error);
      throw error;
    }
  }

  /**
   * Get optimization recommendations
   */
  async optimize(context: Record<string, unknown>): Promise<Record<string, unknown>> {
    try {
      const request: CodetteRequest = {
        id: `optimize-${Date.now()}`,
        type: 'optimization',
        payload: context,
        timestamp: Date.now(),
      };

      return await this.sendRequest(request);
    } catch (error) {
      console.error('Optimization failed:', error);
      throw error;
    }
  }

  /**
   * Send request to Codette backend
   */
  private async sendRequest(request: CodetteRequest): Promise<Record<string, unknown>> {
    if (!this.isConnected) {
      return this.getFallbackResponse(request);
    }

    try {
      const response = await fetch(`${this.baseUrl}/codette/process`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as CodetteResponse;
      
      // Cache successful responses
      if (data.status === 'success') {
        this.requestCache.set(request.id, data);
      }

      return data.data;
    } catch (error) {
      console.error('Request to Codette failed:', error);
      return this.getFallbackResponse(request);
    }
  }

  /**
   * Get fallback response when backend is unavailable
   */
  private getFallbackResponse(request: CodetteRequest): Record<string, unknown> {
    switch (request.type) {
      case 'chat':
        return {
          response: 'Codette is currently offline. I would suggest checking your audio levels and adjusting gain as needed.',
        };
      case 'audio_analysis':
        return {
          analysis: 'Audio analysis unavailable. Standard processing applied.',
          status: 'offline',
        };
      case 'suggestion':
        return {
          suggestions: [],
          message: 'Suggestions unavailable - backend offline',
        };
      case 'mastering':
        return {
          recommendations: [],
          target_loudness: '-14 LUFS',
        };
      case 'optimization':
        return {
          optimizations: [],
          message: 'Optimization unavailable - backend offline',
        };
      default:
        return { error: 'Unknown request type' };
    }
  }

  /**
   * Get chat history
   */
  getChatHistory(): CodetteChatMessage[] {
    return [...this.chatHistory];
  }

  /**
   * Clear chat history
   */
  clearChatHistory(): void {
    this.chatHistory = [];
  }

  /**
   * Check if backend is connected
   */
  isBackendConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get request cache
   */
  getCachedResponse(requestId: string): CodetteResponse | undefined {
    return this.requestCache.get(requestId);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.requestCache.clear();
  }

  /**
   * Reconnect to backend
   */
  async reconnect(): Promise<void> {
    await this.initializeConnection();
  }
}

// Singleton instance
let codetteIntegrationInstance: CodettePythonIntegration | null = null;

/**
 * Get or create Codette integration instance
 */
export function getCodettePythonIntegration(): CodettePythonIntegration {
  if (!codetteIntegrationInstance) {
    const baseUrl = import.meta.env.VITE_CODETTE_API_URL || 'http://localhost:8000';
    const apiKey = import.meta.env.VITE_CODETTE_API_KEY || '';
    codetteIntegrationInstance = new CodettePythonIntegration(baseUrl, apiKey);
  }
  return codetteIntegrationInstance;
}

export default CodettePythonIntegration;
