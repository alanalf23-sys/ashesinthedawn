import { BusNode, RoutingDestination, SidechainConfig } from '../types';

/**
 * AudioRouter manages track/bus routing, sends, and sidechains
 * Handles multi-output routing and complex mixing scenarios
 */

export class BusManager {
  private buses: Map<string, BusNode> = new Map();
  private busCounter: number = 0;

  /**
   * Create a new bus
   */
  createBus(name: string = `Bus ${this.busCounter + 1}`, color: string = '#4F46E5'): BusNode {
    this.busCounter++;
    const busId = `bus-${this.busCounter}`;

    const bus: BusNode = {
      id: busId,
      name: name || `Bus ${this.busCounter}`,
      color,
      tracks: [],
      volume: 0, // dB
      pan: 0, // -1 to 1
      muted: false,
      soloed: false,
    };

    this.buses.set(busId, bus);
    console.log(`Created bus: ${bus.name} (${busId})`);
    return bus;
  }

  /**
   * Get bus by ID
   */
  getBus(busId: string): BusNode | undefined {
    return this.buses.get(busId);
  }

  /**
   * Get all buses
   */
  getAllBuses(): BusNode[] {
    return Array.from(this.buses.values());
  }

  /**
   * Delete bus
   */
  deleteBus(busId: string): boolean {
    const bus = this.buses.get(busId);
    if (!bus) return false;

    // Reroute all tracks to master
    for (const trackId of bus.tracks) {
      // Remove from bus
      bus.tracks = bus.tracks.filter(t => t !== trackId);
    }

    return this.buses.delete(busId);
  }

  /**
   * Rename bus
   */
  renameBus(busId: string, newName: string): boolean {
    const bus = this.buses.get(busId);
    if (!bus) return false;
    bus.name = newName;
    return true;
  }

  /**
   * Add track to bus
   */
  addTrackToBus(trackId: string, busId: string): boolean {
    const bus = this.buses.get(busId);
    if (!bus) return false;

    if (!bus.tracks.includes(trackId)) {
      bus.tracks.push(trackId);
    }

    return true;
  }

  /**
   * Remove track from bus
   */
  removeTrackFromBus(trackId: string, busId: string): boolean {
    const bus = this.buses.get(busId);
    if (!bus) return false;

    bus.tracks = bus.tracks.filter(t => t !== trackId);
    return true;
  }

  /**
   * Get tracks in bus
   */
  getTracksInBus(busId: string): string[] {
    const bus = this.buses.get(busId);
    return bus ? [...bus.tracks] : [];
  }

  /**
   * Get bus containing track
   */
  getBusContainingTrack(trackId: string): BusNode | undefined {
    for (const bus of this.buses.values()) {
      if (bus.tracks.includes(trackId)) {
        return bus;
      }
    }
    return undefined;
  }

  /**
   * Set bus volume
   */
  setBusVolume(busId: string, volumeDb: number): boolean {
    const bus = this.buses.get(busId);
    if (!bus) return false;
    bus.volume = volumeDb;
    return true;
  }

  /**
   * Set bus pan
   */
  setBusPan(busId: string, pan: number): boolean {
    const bus = this.buses.get(busId);
    if (!bus) return false;
    bus.pan = Math.max(-1, Math.min(1, pan));
    return true;
  }

  /**
   * Mute/unmute bus
   */
  setMute(busId: string, muted: boolean): boolean {
    const bus = this.buses.get(busId);
    if (!bus) return false;
    bus.muted = muted;
    return true;
  }

  /**
   * Solo/unsolo bus
   */
  setSolo(busId: string, soloed: boolean): boolean {
    const bus = this.buses.get(busId);
    if (!bus) return false;
    bus.soloed = soloed;
    return true;
  }

  /**
   * Get state for serialization
   */
  getState(): Record<string, unknown> {
    return {
      buses: Array.from(this.buses.values()),
      busCounter: this.busCounter,
    };
  }

  /**
   * Clear all buses
   */
  clear(): void {
    this.buses.clear();
    this.busCounter = 0;
  }
}

/**
 * RoutingEngine manages track routing destinations
 */
export class RoutingEngine {
  private routes: Map<string, RoutingDestination[]> = new Map();

  /**
   * Add route from track to destination
   */
  addRoute(fromTrackId: string, destination: RoutingDestination): void {
    if (!this.routes.has(fromTrackId)) {
      this.routes.set(fromTrackId, []);
    }

    const destinations = this.routes.get(fromTrackId)!;

    // Check if destination already exists
    const existing = destinations.find(
      d => d.type === destination.type && d.destinationId === destination.destinationId
    );

    if (!existing) {
      destinations.push(destination);
    }
  }

  /**
   * Remove route
   */
  removeRoute(fromTrackId: string, destinationType: string, destinationId: string): boolean {
    const destinations = this.routes.get(fromTrackId);
    if (!destinations) return false;

    const index = destinations.findIndex(
      d => d.type === destinationType && d.destinationId === destinationId
    );

    if (index === -1) return false;

    destinations.splice(index, 1);

    if (destinations.length === 0) {
      this.routes.delete(fromTrackId);
    }

    return true;
  }

  /**
   * Get routes for track
   */
  getRoutesForTrack(trackId: string): RoutingDestination[] {
    return this.routes.get(trackId) ? [...this.routes.get(trackId)!] : [];
  }

  /**
   * Get all routes
   */
  getAllRoutes(): Array<{ fromTrackId: string; toDestinations: RoutingDestination[] }> {
    const result: Array<{ fromTrackId: string; toDestinations: RoutingDestination[] }> = [];

    for (const [fromTrackId, destinations] of this.routes.entries()) {
      result.push({
        fromTrackId,
        toDestinations: destinations,
      });
    }

    return result;
  }

  /**
   * Check if routing would create a cycle
   */
  wouldCreateCycle(fromTrackId: string, toTrackId: string): boolean {
    // Simple cycle detection: check if toTrackId can reach fromTrackId
    const visited = new Set<string>();
    return this.canReach(toTrackId, fromTrackId, visited);
  }

  /**
   * DFS to check if one track can reach another
   */
  private canReach(from: string, to: string, visited: Set<string>): boolean {
    if (from === to) return true;
    if (visited.has(from)) return false;

    visited.add(from);

    const destinations = this.routes.get(from) || [];
    for (const dest of destinations) {
      if (dest.type === 'track' && this.canReach(dest.destinationId, to, visited)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Clear all routes
   */
  clear(): void {
    this.routes.clear();
  }

  /**
   * Get state for serialization
   */
  getState(): Record<string, unknown> {
    return {
      routes: Object.fromEntries(this.routes),
    };
  }
}

/**
 * SidechainManager handles sidechain routing and compression
 */
export class SidechainManager {
  private sidechains: Map<string, SidechainConfig> = new Map();

  /**
   * Create sidechain route
   */
  createSidechain(
    compressorTrackId: string,
    sourceTrackId: string,
    frequency: number = 0,
    filterType: 'lowpass' | 'highpass' | 'bandpass' | 'none' = 'none'
  ): SidechainConfig {
    const sidechainId = `sidechain-${compressorTrackId}-${sourceTrackId}`;

    const config: SidechainConfig = {
      id: sidechainId,
      compressorTrackId,
      sourceTrackId,
      frequency,
      filterType,
      enabled: true,
    };

    this.sidechains.set(sidechainId, config);
    console.log(`Created sidechain: ${sourceTrackId} → ${compressorTrackId}`);
    return config;
  }

  /**
   * Get sidechain by ID
   */
  getSidechain(sidechainId: string): SidechainConfig | undefined {
    return this.sidechains.get(sidechainId);
  }

  /**
   * Get sidechains for compressor track
   */
  getSidechainsForTrack(compressorTrackId: string): SidechainConfig[] {
    return Array.from(this.sidechains.values()).filter(
      s => s.compressorTrackId === compressorTrackId
    );
  }

  /**
   * Get all sidechains
   */
  getAllSidechains(): SidechainConfig[] {
    return Array.from(this.sidechains.values());
  }

  /**
   * Delete sidechain
   */
  deleteSidechain(sidechainId: string): boolean {
    return this.sidechains.delete(sidechainId);
  }

  /**
   * Update sidechain
   */
  updateSidechain(sidechainId: string, updates: Partial<SidechainConfig>): boolean {
    const sidechain = this.sidechains.get(sidechainId);
    if (!sidechain) return false;

    Object.assign(sidechain, updates);
    return true;
  }

  /**
   * Enable/disable sidechain
   */
  setSidechainEnabled(sidechainId: string, enabled: boolean): boolean {
    const sidechain = this.sidechains.get(sidechainId);
    if (!sidechain) return false;

    sidechain.enabled = enabled;
    return true;
  }

  /**
   * Check if track has sidechain input
   */
  hasActiveSidechain(trackId: string): boolean {
    return Array.from(this.sidechains.values()).some(
      s => s.compressorTrackId === trackId && s.enabled
    );
  }

  /**
   * Get sidechain source for track
   */
  getSidechainSource(trackId: string): string | undefined {
    const sidechains = this.getSidechainsForTrack(trackId);
    const active = sidechains.find(s => s.enabled);
    return active ? active.sourceTrackId : undefined;
  }

  /**
   * Clear all sidechains
   */
  clear(): void {
    this.sidechains.clear();
  }

  /**
   * Get state for serialization
   */
  getState(): Record<string, unknown> {
    return {
      sidechains: Array.from(this.sidechains.values()),
    };
  }
}

/**
 * Get or create singleton managers
 */
export function getBusManager(): BusManager {
  return new BusManager();
}

export function getRoutingEngine(): RoutingEngine {
  return new RoutingEngine();
}

export function getSidechainManager(): SidechainManager {
  return new SidechainManager();
}
