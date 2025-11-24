/**
 * Realtime Buffer Manager - Handles circular/ring buffers for real-time audio I/O
 * Provides zero-copy audio processing with underrun/overrun detection
 */

export type BufferUnderrunCallback = (latencySamples: number) => void;
export type BufferOverrunCallback = (excessSamples: number) => void;

export class RealtimeBufferManager {
  private buffers: Map<number, Float32Array> = new Map(); // Channel -> buffer
  private writePointers: Map<number, number> = new Map(); // Channel -> write position
  private readPointers: Map<number, number> = new Map(); // Channel -> read position
  private bufferSize: number;
  private channels: number;
  private underrunCount = 0;
  private overrunCount = 0;
  private underrunCallbacks: Set<BufferUnderrunCallback> = new Set();
  private overrunCallbacks: Set<BufferOverrunCallback> = new Set();
  private sampleRate: number;

  constructor(bufferSizeInSamples: number = 8192, channelCount: number = 2, sampleRate: number = 48000) {
    this.bufferSize = bufferSizeInSamples;
    this.channels = channelCount;
    this.sampleRate = sampleRate;

    // Initialize buffers for each channel
    for (let ch = 0; ch < channelCount; ch++) {
      this.buffers.set(ch, new Float32Array(bufferSizeInSamples));
      this.writePointers.set(ch, 0);
      this.readPointers.set(ch, 0);
    }

    console.log(
      `Realtime Buffer Manager initialized: ${bufferSizeInSamples} samples, ${channelCount} channels @ ${sampleRate}Hz`
    );
  }

  /**
   * Write audio data to the ring buffer
   * Returns true if successful, false if overrun detected
   */
  writeAudio(data: Float32Array, channel: number): boolean {
    if (channel < 0 || channel >= this.channels) {
      console.warn(`Invalid channel: ${channel}`);
      return false;
    }

    const buffer = this.buffers.get(channel);
    if (!buffer) return false;

    const writePtr = this.writePointers.get(channel) || 0;
    const readPtr = this.readPointers.get(channel) || 0;

    // Check for overrun: if write pointer catches up to read pointer
    const nextWritePtr = (writePtr + data.length) % this.bufferSize;
    if (nextWritePtr === readPtr || (writePtr < readPtr && nextWritePtr > readPtr)) {
      this.overrunCount++;
      const excessSamples = data.length;
      this.notifyOverrun(excessSamples);
      console.warn(`Buffer overrun on channel ${channel}: ${excessSamples} samples lost`);
      return false;
    }

    // Write data to buffer (handle wrap-around)
    if (writePtr + data.length <= this.bufferSize) {
      // No wrap-around needed
      buffer.set(data, writePtr);
    } else {
      // Wrap-around: split write into two parts
      const firstPart = this.bufferSize - writePtr;
      buffer.set(data.subarray(0, firstPart), writePtr);
      buffer.set(data.subarray(firstPart), 0);
    }

    this.writePointers.set(channel, nextWritePtr);
    return true;
  }

  /**
   * Read audio data from the ring buffer
   * Returns requested samples or fewer if underrun occurs
   */
  readAudio(samples: number, channel: number): Float32Array {
    if (channel < 0 || channel >= this.channels) {
      console.warn(`Invalid channel: ${channel}`);
      return new Float32Array(samples);
    }

    const buffer = this.buffers.get(channel);
    if (!buffer) return new Float32Array(samples);

    const readPtr = this.readPointers.get(channel) || 0;

    // Check for underrun: if read pointer catches up to write pointer
    const availableSamples = this.getAvailableSamples(channel);
    if (availableSamples < samples) {
      this.underrunCount++;
      const latency = this.getLatencySamples(channel);
      this.notifyUnderrun(latency);
      console.warn(
        `Buffer underrun on channel ${channel}: requested ${samples}, only ${availableSamples} available`
      );
    }

    const samplesToRead = Math.min(samples, availableSamples);
    const output = new Float32Array(samplesToRead);

    // Read data from buffer (handle wrap-around)
    if (readPtr + samplesToRead <= this.bufferSize) {
      // No wrap-around needed
      output.set(buffer.subarray(readPtr, readPtr + samplesToRead));
    } else {
      // Wrap-around: split read into two parts
      const firstPart = this.bufferSize - readPtr;
      output.set(buffer.subarray(readPtr), 0);
      output.set(buffer.subarray(0, samplesToRead - firstPart), firstPart);
    }

    const nextReadPtr = (readPtr + samplesToRead) % this.bufferSize;
    this.readPointers.set(channel, nextReadPtr);

    return output;
  }

  /**
   * Get number of samples available to read
   */
  getAvailableSamples(channel: number): number {
    if (channel < 0 || channel >= this.channels) return 0;

    const writePtr = this.writePointers.get(channel) || 0;
    const readPtr = this.readPointers.get(channel) || 0;

    if (writePtr >= readPtr) {
      return writePtr - readPtr;
    } else {
      return this.bufferSize - readPtr + writePtr;
    }
  }

  /**
   * Get latency in samples (distance from read pointer to write pointer)
   */
  getLatencySamples(channel: number): number {
    return this.getAvailableSamples(channel);
  }

  /**
   * Get latency in milliseconds
   */
  getLatencyMs(channel: number): number {
    const samples = this.getLatencySamples(channel);
    return (samples / this.sampleRate) * 1000;
  }

  /**
   * Get total buffer size in samples
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
   * Get number of channels
   */
  getChannelCount(): number {
    return this.channels;
  }

  /**
   * Get sample rate
   */
  getSampleRate(): number {
    return this.sampleRate;
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
   * Reset all pointers (clear buffer)
   */
  reset(): void {
    for (let ch = 0; ch < this.channels; ch++) {
      this.writePointers.set(ch, 0);
      this.readPointers.set(ch, 0);
    }
    console.log('Buffer pointers reset');
  }

  /**
   * Reset error counters
   */
  resetErrorCounters(): void {
    this.underrunCount = 0;
    this.overrunCount = 0;
  }

  /**
   * Resize the buffer
   */
  resize(newSize: number): void {
    if (newSize < 512 || newSize > 65536) {
      console.warn(`Invalid buffer size: ${newSize}. Must be between 512 and 65536.`);
      return;
    }

    for (let ch = 0; ch < this.channels; ch++) {
      const newBuffer = new Float32Array(newSize);
      const oldBuffer = this.buffers.get(ch);

      if (oldBuffer) {
        // Copy existing data up to new size
        const copyLength = Math.min(oldBuffer.length, newSize);
        newBuffer.set(oldBuffer.subarray(0, copyLength));
      }

      this.buffers.set(ch, newBuffer);
    }

    this.bufferSize = newSize;
    this.reset();
    console.log(`Buffer resized to ${newSize} samples`);
  }

  /**
   * Register callback for underrun events
   */
  onUnderrun(callback: BufferUnderrunCallback): void {
    this.underrunCallbacks.add(callback);
  }

  /**
   * Unregister callback for underrun events
   */
  offUnderrun(callback: BufferUnderrunCallback): void {
    this.underrunCallbacks.delete(callback);
  }

  /**
   * Register callback for overrun events
   */
  onOverrun(callback: BufferOverrunCallback): void {
    this.overrunCallbacks.add(callback);
  }

  /**
   * Unregister callback for overrun events
   */
  offOverrun(callback: BufferOverrunCallback): void {
    this.overrunCallbacks.delete(callback);
  }

  /**
   * Get detailed buffer status for all channels
   */
  getBufferStatus(): Array<{
    channel: number;
    availableSamples: number;
    latencyMs: number;
    writePtr: number;
    readPtr: number;
  }> {
    const status = [];
    for (let ch = 0; ch < this.channels; ch++) {
      status.push({
        channel: ch,
        availableSamples: this.getAvailableSamples(ch),
        latencyMs: this.getLatencyMs(ch),
        writePtr: this.writePointers.get(ch) || 0,
        readPtr: this.readPointers.get(ch) || 0,
      });
    }
    return status;
  }

  /**
   * Notify all underrun callbacks
   */
  private notifyUnderrun(latencySamples: number): void {
    for (const callback of this.underrunCallbacks) {
      callback(latencySamples);
    }
  }

  /**
   * Notify all overrun callbacks
   */
  private notifyOverrun(excessSamples: number): void {
    for (const callback of this.overrunCallbacks) {
      callback(excessSamples);
    }
  }

  /**
   * Cleanup and reset all resources
   */
  dispose(): void {
    this.buffers.clear();
    this.writePointers.clear();
    this.readPointers.clear();
    this.underrunCallbacks.clear();
    this.overrunCallbacks.clear();
    console.log('Realtime Buffer Manager disposed');
  }
}
