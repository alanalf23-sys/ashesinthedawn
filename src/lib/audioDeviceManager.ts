/**
 * Audio Device Manager - Handles enumeration, selection, and lifecycle of audio devices
 * Provides multi-device support with hot-swap capabilities
 */

export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
  groupId: string;
  state: 'connected' | 'disconnected';
}

export type DeviceChangeCallback = (devices: AudioDevice[]) => void;

export class AudioDeviceManager {
  private selectedInputDeviceId: string | null = null;
  private selectedOutputDeviceId: string | null = null;
  private inputDevices: AudioDevice[] = [];
  private outputDevices: AudioDevice[] = [];
  private deviceChangeCallbacks: Set<DeviceChangeCallback> = new Set();
  private mediaDevices: MediaDevices | null = null;
  private initialized = false;

  /**
   * Initialize the device manager and set up device change listeners
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.mediaDevices = navigator.mediaDevices;

      if (!this.mediaDevices) {
        throw new Error('MediaDevices API not available');
      }

      // Initial device enumeration
      await this.refreshDevices();

      // Listen for device changes
      this.mediaDevices.addEventListener('devicechange', () => {
        this.handleDeviceChange();
      });

      this.initialized = true;
      console.log('Audio Device Manager initialized');
    } catch (error) {
      console.error('Failed to initialize Audio Device Manager:', error);
      throw error;
    }
  }

  /**
   * Refresh the list of available audio devices
   */
  async refreshDevices(): Promise<void> {
    if (!this.mediaDevices) {
      throw new Error('MediaDevices API not available');
    }

    try {
      const devices = await this.mediaDevices.enumerateDevices();
      this.inputDevices = devices
        .filter((d) => d.kind === 'audioinput')
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Input Device ${this.inputDevices.length + 1}`,
          kind: 'audioinput',
          groupId: d.groupId,
          state: 'connected' as const,
        }));

      this.outputDevices = devices
        .filter((d) => d.kind === 'audiooutput')
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Output Device ${this.outputDevices.length + 1}`,
          kind: 'audiooutput',
          groupId: d.groupId,
          state: 'connected' as const,
        }));

      console.log(
        `Enumerated ${this.inputDevices.length} input and ${this.outputDevices.length} output devices`
      );
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
      throw error;
    }
  }

  /**
   * Get list of all available input devices
   */
  async getInputDevices(): Promise<AudioDevice[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    return [...this.inputDevices];
  }

  /**
   * Get list of all available output devices
   */
  async getOutputDevices(): Promise<AudioDevice[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    return [...this.outputDevices];
  }

  /**
   * Get the currently selected input device
   */
  getSelectedInputDevice(): AudioDevice | null {
    if (!this.selectedInputDeviceId) return null;
    return (
      this.inputDevices.find((d) => d.deviceId === this.selectedInputDeviceId) || null
    );
  }

  /**
   * Get the currently selected output device
   */
  getSelectedOutputDevice(): AudioDevice | null {
    if (!this.selectedOutputDeviceId) return null;
    return (
      this.outputDevices.find((d) => d.deviceId === this.selectedOutputDeviceId) || null
    );
  }

  /**
   * Select a specific input device by ID
   * Returns false if device not found
   */
  selectInputDevice(deviceId: string): boolean {
    const device = this.inputDevices.find((d) => d.deviceId === deviceId);
    if (!device) {
      console.warn(`Input device not found: ${deviceId}`);
      return false;
    }

    this.selectedInputDeviceId = deviceId;
    console.log(`Selected input device: ${device.label} (${deviceId})`);
    return true;
  }

  /**
   * Select a specific output device by ID
   * Returns false if device not found
   */
  selectOutputDevice(deviceId: string): boolean {
    const device = this.outputDevices.find((d) => d.deviceId === deviceId);
    if (!device) {
      console.warn(`Output device not found: ${deviceId}`);
      return false;
    }

    this.selectedOutputDeviceId = deviceId;
    console.log(`Selected output device: ${device.label} (${deviceId})`);
    return true;
  }

  /**
   * Select input device by index (0-based)
   */
  selectInputDeviceByIndex(index: number): boolean {
    if (index < 0 || index >= this.inputDevices.length) {
      console.warn(`Invalid input device index: ${index}`);
      return false;
    }
    return this.selectInputDevice(this.inputDevices[index].deviceId);
  }

  /**
   * Select output device by index (0-based)
   */
  selectOutputDeviceByIndex(index: number): boolean {
    if (index < 0 || index >= this.outputDevices.length) {
      console.warn(`Invalid output device index: ${index}`);
      return false;
    }
    return this.selectOutputDevice(this.outputDevices[index].deviceId);
  }

  /**
   * Get detailed information about a specific device
   */
  getDeviceInfo(deviceId: string): AudioDevice | null {
    const inputDevice = this.inputDevices.find((d) => d.deviceId === deviceId);
    if (inputDevice) return inputDevice;

    const outputDevice = this.outputDevices.find((d) => d.deviceId === deviceId);
    return outputDevice || null;
  }

  /**
   * Check if a device exists and is available
   */
  isDeviceAvailable(deviceId: string): boolean {
    return (
      this.inputDevices.some((d) => d.deviceId === deviceId) ||
      this.outputDevices.some((d) => d.deviceId === deviceId)
    );
  }

  /**
   * Register callback for device changes
   */
  onDevicesChanged(callback: DeviceChangeCallback): void {
    this.deviceChangeCallbacks.add(callback);
  }

  /**
   * Unregister callback for device changes
   */
  offDevicesChanged(callback: DeviceChangeCallback): void {
    this.deviceChangeCallbacks.delete(callback);
  }

  /**
   * Get MediaStreamConstraints for the selected input device
   * Useful for getUserMedia() calls
   */
  getInputConstraints(): MediaStreamConstraints {
    return {
      audio: {
        deviceId: this.selectedInputDeviceId
          ? { exact: this.selectedInputDeviceId }
          : undefined,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false,
      },
    };
  }

  /**
   * Handle device change event
   */
  private async handleDeviceChange(): Promise<void> {
    console.log('Device change detected, refreshing device list');

    const previousInputDeviceId = this.selectedInputDeviceId;
    const previousOutputDeviceId = this.selectedOutputDeviceId;

    await this.refreshDevices();

    // If selected device is no longer available, clear selection
    if (
      previousInputDeviceId &&
      !this.inputDevices.some((d) => d.deviceId === previousInputDeviceId)
    ) {
      console.warn('Previously selected input device is no longer available');
      this.selectedInputDeviceId = null;
    }

    if (
      previousOutputDeviceId &&
      !this.outputDevices.some((d) => d.deviceId === previousOutputDeviceId)
    ) {
      console.warn('Previously selected output device is no longer available');
      this.selectedOutputDeviceId = null;
    }

    // Notify all listeners
    this.notifyDeviceChanges();
  }

  /**
   * Notify all registered callbacks of device changes
   */
  private notifyDeviceChanges(): void {
    const allDevices = [...this.inputDevices, ...this.outputDevices];
    for (const callback of this.deviceChangeCallbacks) {
      callback(allDevices);
    }
  }

  /**
   * Cleanup and remove all event listeners
   */
  dispose(): void {
    if (this.mediaDevices) {
      this.mediaDevices.removeEventListener('devicechange', () => {
        this.handleDeviceChange();
      });
    }
    this.deviceChangeCallbacks.clear();
    this.initialized = false;
  }
}

// Singleton instance
let deviceManagerInstance: AudioDeviceManager | null = null;

/**
 * Get or create the audio device manager singleton
 */
export async function getAudioDeviceManager(): Promise<AudioDeviceManager> {
  if (!deviceManagerInstance) {
    deviceManagerInstance = new AudioDeviceManager();
    await deviceManagerInstance.initialize();
  }
  return deviceManagerInstance;
}
