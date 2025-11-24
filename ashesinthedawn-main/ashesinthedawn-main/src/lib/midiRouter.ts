import { MIDIDevice, MIDIRoute, MIDINote } from '../types';

/**
 * MIDIRouter manages MIDI device routing and note processing
 * Handles MIDI input device enumeration, port selection, and note routing
 */

export class MIDIRouter {
  private midiAccess?: MIDIAccess;
  private midiRoutes: Map<string, MIDIRoute> = new Map();
  private midiNotes: MIDINote[] = [];
  private onNoteCallback?: (note: MIDINote) => void;
  private onDeviceChangeCallback?: (devices: MIDIDevice[]) => void;
  private selectedInputDevice?: MIDIDevice;
  private selectedOutputDevice?: MIDIDevice;

  private constructor() {}

  private static instance: MIDIRouter;

  static getInstance(): MIDIRouter {
    if (!MIDIRouter.instance) {
      MIDIRouter.instance = new MIDIRouter();
    }
    return MIDIRouter.instance;
  }

  /**
   * Initialize MIDI support
   */
  async initialize(): Promise<boolean> {
    try {
      if (!navigator.requestMIDIAccess) {
        console.warn('Web MIDI API not supported in this browser');
        return false;
      }

      this.midiAccess = await navigator.requestMIDIAccess();
      console.log('Web MIDI API initialized');

      // Listen for device changes
      this.midiAccess.addEventListener('statechange', (event: Event) => {
        if ('port' in event) {
          this.handleDeviceChange(event as MIDIConnectionEvent);
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to initialize Web MIDI API:', error);
      return false;
    }
  }

  /**
   * Get all input devices
   */
  getInputDevices(): MIDIDevice[] {
    if (!this.midiAccess) return [];

    const devices: MIDIDevice[] = [];
    this.midiAccess.inputs.forEach((input) => {
      devices.push({
        deviceId: input.id,
        name: input.name || 'Unknown',
        kind: 'input',
        manufacturer: input.manufacturer || 'Unknown',
        state: input.state as 'connected' | 'disconnected',
        channel: 0,
      });
    });

    return devices;
  }

  /**
   * Get all output devices
   */
  getOutputDevices(): MIDIDevice[] {
    if (!this.midiAccess) return [];

    const devices: MIDIDevice[] = [];
    this.midiAccess.outputs.forEach((output) => {
      devices.push({
        deviceId: output.id,
        name: output.name || 'Unknown',
        kind: 'output',
        manufacturer: output.manufacturer || 'Unknown',
        state: output.state as 'connected' | 'disconnected',
        channel: 0,
      });
    });

    return devices;
  }

  /**
   * Select input device and enable note capture
   */
  selectInputDevice(deviceId: string): boolean {
    if (!this.midiAccess) return false;

    const input = this.midiAccess.inputs.get(deviceId);
    if (!input) return false;

    const device = this.getInputDevices().find(d => d.deviceId === deviceId);
    if (!device) return false;

    this.selectedInputDevice = device;

    // Set up MIDI message handler
    input.addEventListener('midimessage', (message: MIDIMessageEvent) => {
      if (message.data) {
        this.handleMIDIMessage(message.data);
      }
    });

    console.log(`Selected MIDI input device: ${device.name}`);
    return true;
  }

  /**
   * Select output device
   */
  selectOutputDevice(deviceId: string): boolean {
    if (!this.midiAccess) return false;

    const output = this.midiAccess.outputs.get(deviceId);
    if (!output) return false;

    const device = this.getOutputDevices().find(d => d.deviceId === deviceId);
    if (!device) return false;

    this.selectedOutputDevice = device;
    console.log(`Selected MIDI output device: ${device.name}`);
    return true;
  }

  /**
   * Create MIDI route from device to track
   */
  createRoute(trackId: string, midiDevice: MIDIDevice, midiChannel: number = 0): MIDIRoute {
    const routeId = `route-${trackId}-${midiDevice.deviceId}`;
    const route: MIDIRoute = {
      id: routeId,
      trackId,
      midiDevice,
      midiChannel,
      transpose: 0,
      velocity: 1,
    };

    this.midiRoutes.set(routeId, route);
    return route;
  }

  /**
   * Get route by ID
   */
  getRoute(routeId: string): MIDIRoute | undefined {
    return this.midiRoutes.get(routeId);
  }

  /**
   * Get routes for track
   */
  getRoutesForTrack(trackId: string): MIDIRoute[] {
    return Array.from(this.midiRoutes.values()).filter(r => r.trackId === trackId);
  }

  /**
   * Update route properties
   */
  updateRoute(routeId: string, updates: Partial<MIDIRoute>): boolean {
    const route = this.midiRoutes.get(routeId);
    if (!route) return false;

    Object.assign(route, updates);
    return true;
  }

  /**
   * Delete route
   */
  deleteRoute(routeId: string): boolean {
    return this.midiRoutes.delete(routeId);
  }

  /**
   * Handle incoming MIDI message
   */
  private handleMIDIMessage(data: Uint8Array): void {
    if (data.length < 3) return;

    const status = data[0] & 0xf0;
    const channel = data[0] & 0x0f;
    const pitch = data[1];
    const velocity = data[2];

    // Handle Note On (0x90) and Note Off (0x80)
    if (status === 0x90 && velocity > 0) {
      // Note On
      const midiNote: MIDINote = {
        pitch,
        velocity: velocity / 127,
        startTime: Date.now() / 1000,
        duration: 0.1, // Default duration until Note Off
        trackId: '',
      };

      this.midiNotes.push(midiNote);

      // Callback for note received
      if (this.onNoteCallback) {
        this.onNoteCallback(midiNote);
      }
    } else if (status === 0x80 || (status === 0x90 && velocity === 0)) {
      // Note Off
      const note = this.midiNotes.find(n => n.pitch === pitch);
      if (note) {
        note.duration = (Date.now() / 1000) - note.startTime;
        // Remove from active notes
        const index = this.midiNotes.indexOf(note);
        if (index > -1) {
          this.midiNotes.splice(index, 1);
        }
      }
    } else if (status === 0xb0) {
      // Control Change (CC)
      console.debug(`CC: channel=${channel}, controller=${pitch}, value=${velocity}`);
    }
  }

  /**
   * Handle device connection/disconnection
   */
  private handleDeviceChange(event: MIDIConnectionEvent): void {
    if (event.port) {
      console.log(`MIDI device ${event.port.state}: ${event.port.name}`);
    }

    // Notify listeners of device changes
    if (this.onDeviceChangeCallback) {
      const allDevices = [
        ...this.getInputDevices(),
        ...this.getOutputDevices(),
      ];
      this.onDeviceChangeCallback(allDevices);
    }
  }

  /**
   * Register callback for note events
   */
  onNote(callback: (note: MIDINote) => void): void {
    this.onNoteCallback = callback;
  }

  /**
   * Register callback for device changes
   */
  onDeviceChange(callback: (devices: MIDIDevice[]) => void): void {
    this.onDeviceChangeCallback = callback;
  }

  /**
   * Send MIDI note to output device
   */
  sendNote(pitch: number, velocity: number, duration: number = 0.5): void {
    if (!this.selectedOutputDevice || !this.midiAccess) return;

    const output = this.midiAccess.outputs.get(this.selectedOutputDevice.deviceId);
    if (!output) return;

    // Send Note On
    output.send([0x90, pitch, Math.floor(velocity * 127)]);

    // Send Note Off after duration
    setTimeout(() => {
      output.send([0x80, pitch, 0]);
    }, duration * 1000);
  }

  /**
   * Send CC (Control Change) message
   */
  sendCC(controller: number, value: number): void {
    if (!this.selectedOutputDevice || !this.midiAccess) return;

    const output = this.midiAccess.outputs.get(this.selectedOutputDevice.deviceId);
    if (!output) return;

    output.send([0xb0, controller, Math.floor(value * 127)]);
  }

  /**
   * Get selected input device
   */
  getSelectedInputDevice(): MIDIDevice | undefined {
    return this.selectedInputDevice;
  }

  /**
   * Get selected output device
   */
  getSelectedOutputDevice(): MIDIDevice | undefined {
    return this.selectedOutputDevice;
  }

  /**
   * Get all active MIDI routes
   */
  getAllRoutes(): MIDIRoute[] {
    return Array.from(this.midiRoutes.values());
  }

  /**
   * Clear all routes
   */
  clearRoutes(): void {
    this.midiRoutes.clear();
  }

  /**
   * Get state for serialization
   */
  getState(): Record<string, unknown> {
    return {
      selectedInputDevice: this.selectedInputDevice,
      selectedOutputDevice: this.selectedOutputDevice,
      routes: Array.from(this.midiRoutes.values()),
      activeNotes: this.midiNotes.length,
    };
  }
}

/**
 * Get or create singleton MIDI router
 */
export function getMIDIRouter(): MIDIRouter {
  return MIDIRouter.getInstance();
}
