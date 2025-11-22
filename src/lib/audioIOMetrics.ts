/**
 * Audio I/O Metrics - Tracks performance metrics for real-time audio I/O
 * Monitors latency, buffer performance, and system usage
 */

export interface IOMetricsSnapshot {
  currentLatencyMs: number;
  averageLatencyMs: number;
  maxLatencyMs: number;
  minLatencyMs: number;
  underrunCount: number;
  overrunCount: number;
  cpuUsage: number;
  sampleRate: number;
  bufferSize: number;
  timestamp: number;
}

export class AudioIOMetrics {
  private latencyHistory: number[] = [];
  private latencyHistoryMax = 300; // Keep last 300 measurements (5 seconds @ 60Hz)
  private currentLatencyMs = 0;
  private underrunCount = 0;
  private overrunCount = 0;
  private cpuUsage = 0;
  private sampleRate: number;
  private bufferSize: number;
  private startTime: number = Date.now();

  constructor(sampleRate: number = 48000, bufferSize: number = 256) {
    this.sampleRate = sampleRate;
    this.bufferSize = bufferSize;
    console.log(`Audio I/O Metrics initialized: ${sampleRate}Hz, ${bufferSize} samples`);
  }

  /**
   * Update current latency measurement
   */
  setCurrentLatency(latencyMs: number): void {
    this.currentLatencyMs = Math.max(0, latencyMs);
    this.latencyHistory.push(this.currentLatencyMs);

    // Keep history size manageable
    if (this.latencyHistory.length > this.latencyHistoryMax) {
      this.latencyHistory.shift();
    }
  }

  /**
   * Get current latency in milliseconds
   */
  getCurrentLatencyMs(): number {
    return this.currentLatencyMs;
  }

  /**
   * Get average latency from history
   */
  getAverageLatencyMs(): number {
    if (this.latencyHistory.length === 0) return 0;
    const sum = this.latencyHistory.reduce((a, b) => a + b, 0);
    return sum / this.latencyHistory.length;
  }

  /**
   * Get maximum latency from history
   */
  getMaxLatencyMs(): number {
    return this.latencyHistory.length > 0 ? Math.max(...this.latencyHistory) : 0;
  }

  /**
   * Get minimum latency from history
   */
  getMinLatencyMs(): number {
    return this.latencyHistory.length > 0 ? Math.min(...this.latencyHistory) : 0;
  }

  /**
   * Increment underrun counter
   */
  recordUnderrun(): void {
    this.underrunCount++;
  }

  /**
   * Increment overrun counter
   */
  recordOverrun(): void {
    this.overrunCount++;
  }

  /**
   * Get total underrun count
   */
  getUnderrunCount(): number {
    return this.underrunCount;
  }

  /**
   * Get total overrun count
   */
  getOverrunCount(): number {
    return this.overrunCount;
  }

  /**
   * Get total xrun count (underruns + overruns)
   */
  getXrunCount(): number {
    return this.underrunCount + this.overrunCount;
  }

  /**
   * Update CPU usage percentage (0-100)
   */
  setCpuUsage(cpuUsage: number): void {
    this.cpuUsage = Math.max(0, Math.min(100, cpuUsage));
  }

  /**
   * Get current CPU usage percentage
   */
  getCpuUsage(): number {
    return this.cpuUsage;
  }

  /**
   * Get sample rate
   */
  getSampleRate(): number {
    return this.sampleRate;
  }

  /**
   * Get buffer size in samples
   */
  getBufferSize(): number {
    return this.bufferSize;
  }

  /**
   * Get buffer size in milliseconds
   */
  getBufferSizeMs(): number {
    return (this.bufferSize / this.sampleRate) * 1000;
  }

  /**
   * Get session duration in seconds
   */
  getSessionDuration(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  /**
   * Reset all counters
   */
  resetCounters(): void {
    this.underrunCount = 0;
    this.overrunCount = 0;
    this.latencyHistory = [];
    console.log('Audio I/O metrics counters reset');
  }

  /**
   * Start a new session
   */
  startSession(): void {
    this.startTime = Date.now();
    this.resetCounters();
    console.log('Audio I/O session started');
  }

  /**
   * Get a snapshot of all metrics
   */
  getSnapshot(): IOMetricsSnapshot {
    return {
      currentLatencyMs: this.getCurrentLatencyMs(),
      averageLatencyMs: this.getAverageLatencyMs(),
      maxLatencyMs: this.getMaxLatencyMs(),
      minLatencyMs: this.getMinLatencyMs(),
      underrunCount: this.getUnderrunCount(),
      overrunCount: this.getOverrunCount(),
      cpuUsage: this.getCpuUsage(),
      sampleRate: this.getSampleRate(),
      bufferSize: this.getBufferSize(),
      timestamp: Date.now(),
    };
  }

  /**
   * Get a detailed metrics report
   */
  getReport(): string {
    const snapshot = this.getSnapshot();
    return `
Audio I/O Metrics Report
========================
Session Duration: ${this.getSessionDuration()}s
Current Latency: ${snapshot.currentLatencyMs.toFixed(2)}ms
Average Latency: ${snapshot.averageLatencyMs.toFixed(2)}ms
Max Latency: ${snapshot.maxLatencyMs.toFixed(2)}ms
Min Latency: ${snapshot.minLatencyMs.toFixed(2)}ms
Underruns: ${snapshot.underrunCount}
Overruns: ${snapshot.overrunCount}
Total Xruns: ${this.getXrunCount()}
CPU Usage: ${snapshot.cpuUsage.toFixed(1)}%
Sample Rate: ${snapshot.sampleRate}Hz
Buffer Size: ${snapshot.bufferSize} samples (${this.getBufferSizeMs().toFixed(2)}ms)
Timestamp: ${new Date(snapshot.timestamp).toISOString()}
========================
    `.trim();
  }

  /**
   * Check if metrics indicate problems
   */
  hasProblems(): boolean {
    const averageLatency = this.getAverageLatencyMs();
    const xrunCount = this.getXrunCount();
    const cpuUsage = this.getCpuUsage();

    // Problems if:
    // - Average latency > 15ms (should be < 10ms)
    // - Any xruns have occurred
    // - CPU usage > 80%
    return averageLatency > 15 || xrunCount > 0 || cpuUsage > 80;
  }

  /**
   * Get health status string
   */
  getHealthStatus(): 'excellent' | 'good' | 'fair' | 'poor' {
    const averageLatency = this.getAverageLatencyMs();
    const xrunCount = this.getXrunCount();
    const cpuUsage = this.getCpuUsage();

    if (xrunCount > 5 || cpuUsage > 90 || averageLatency > 20) {
      return 'poor';
    }
    if (xrunCount > 2 || cpuUsage > 80 || averageLatency > 15) {
      return 'fair';
    }
    if (cpuUsage > 50 || averageLatency > 10) {
      return 'good';
    }
    return 'excellent';
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.latencyHistory = [];
    console.log('Audio I/O Metrics disposed');
  }
}
