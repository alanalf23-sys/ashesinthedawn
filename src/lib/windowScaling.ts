/**
 * Window Scaling Utilities
 * Provides normalized window dimensions accounting for device pixel ratio,
 * zoom levels, and minimum viewport constraints
 */

export interface NormalizedDimensions {
  /** Actual window width in CSS pixels */
  width: number;
  /** Actual window height in CSS pixels */
  height: number;
  /** Device pixel ratio (1, 1.5, 2, etc.) */
  devicePixelRatio: number;
  /** Physical width in device pixels */
  physicalWidth: number;
  /** Physical height in device pixels */
  physicalHeight: number;
  /** Browser zoom level (1.0 = 100%) */
  zoomLevel: number;
}

/**
 * Get normalized window dimensions
 * Accounts for device pixel ratio, zoom, and minimum constraints
 */
export function getNormalizedDimensions(): NormalizedDimensions {
  if (typeof window === 'undefined') {
    return {
      width: 1920,
      height: 1080,
      devicePixelRatio: 1,
      physicalWidth: 1920,
      physicalHeight: 1080,
      zoomLevel: 1.0,
    };
  }

  const dpr = window.devicePixelRatio || 1;
  const zoomLevel = 100 / (window.outerWidth / window.innerWidth);

  return {
    width: Math.max(window.innerWidth, 640),
    height: Math.max(window.innerHeight, 480),
    devicePixelRatio: dpr,
    physicalWidth: Math.max(window.innerWidth * dpr, 640 * dpr),
    physicalHeight: Math.max(window.innerHeight * dpr, 480 * dpr),
    zoomLevel: zoomLevel / 100,
  };
}

/**
 * Scale a value based on device pixel ratio
 */
export function scaleByDPI(value: number, ratio?: number): number {
  const dpr = ratio ?? (typeof window !== 'undefined' ? window.devicePixelRatio : 1);
  return value * dpr;
}

/**
 * Unscale a value from device pixel ratio
 */
export function unscaleByDPI(value: number, ratio?: number): number {
  const dpr = ratio ?? (typeof window !== 'undefined' ? window.devicePixelRatio : 1);
  return value / dpr;
}

/**
 * Clamp dimensions to minimum viewport size
 */
export function clampDimensions(
  width: number,
  height: number,
  minWidth: number = 640,
  minHeight: number = 480
): { width: number; height: number } {
  return {
    width: Math.max(width, minWidth),
    height: Math.max(height, minHeight),
  };
}

/**
 * Normalize canvas dimensions for crisp rendering
 */
export function normalizeCanvasDimensions(
  canvas: HTMLCanvasElement,
  displayWidth: number,
  displayHeight: number
): void {
  const dpr = window.devicePixelRatio || 1;

  // Set display size
  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${displayHeight}px`;

  // Set actual resolution accounting for device pixel ratio
  canvas.width = displayWidth * dpr;
  canvas.height = displayHeight * dpr;

  // Scale context to match device pixel ratio
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(dpr, dpr);
  }
}

/**
 * Create a throttled resize listener
 */
export function createThrottledResizeListener(
  callback: (dimensions: NormalizedDimensions) => void,
  delay: number = 150
): () => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastDimensions: NormalizedDimensions | null = null;

  const handleResize = () => {
    if (timeoutId) clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      const dimensions = getNormalizedDimensions();

      // Only call if dimensions actually changed
      if (
        !lastDimensions ||
        lastDimensions.width !== dimensions.width ||
        lastDimensions.height !== dimensions.height
      ) {
        lastDimensions = dimensions;
        callback(dimensions);
      }
    }, delay);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize);
  }

  return () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', handleResize);
    }
  };
}
