/**
 * VU Meter GFX Controller
 * 
 * Converted from JSFX: VU Meter by Liteon
 * (C) 2008-2009, Lubomir I. Ivanov - Released under GPL
 * 
 * All original formulas preserved exactly:
 * - sc = 6/log(2) for dB scale conversion
 * - xlt = floor(exp(log(1.055)*2.1*ool)*285) for exponential x-position
 * - Needle Y calculation: l=sqrt(sqr(r)+sqr(212-x)), h=((l-r)*r/l), m=sqrt(sqr(l-r)-sqr(h))
 * - RMS: rmsl = floor(sc*log(sqrt(suml/cs))*100)/100
 * - Fallback decay: fallback = rel/2*samplesblock/1024, fbi = exp(x/512)*fallback
 */

import { useEffect, useRef, useCallback } from 'react';
import styles from './VUMeterGfx.module.css';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface VUMeterState {
  // Constants from @init
  sc: number;           // dB scale: 6/log(2)
  rp: number;           // Right channel y padding: 261
  r: number;            // Needle radius: 200
  
  // Needle positions (left channel)
  xl: number;
  yl: number;
  xlt: number;
  ylt: number;
  old_xl: number;
  
  // Needle positions (right channel)
  xr: number;
  yr: number;
  xrt: number;
  yrt: number;
  old_xr: number;
  
  // Output levels (dB)
  olt: number;
  ort: number;
  
  // RMS calculations
  suml: number;
  sumr: number;
  cs: number;
  rmsl: number;
  rmsr: number;
  rmsl_gfx: number;
  rmsr_gfx: number;
  rms_i: number;
  i_max: number;
  
  // Timing
  st: number;
  hold: number;
  bscnt: number;
  
  // Peak values
  pvl: number;
  pvr: number;
}

interface VUMeterGfxProps {
  /** Audio level data for left channel (0-1 normalized) */
  leftLevel?: number;
  /** Audio level data for right channel (0-1 normalized) */
  rightLevel?: number;
  /** Response time in milliseconds (1-300, default 50) */
  responseMs?: number;
  /** Release speed (1-10, default 5) */
  release?: number;
  /** Sample rate (default 44100) */
  sampleRate?: number;
  /** Canvas width (default 425) */
  width?: number;
  /** Canvas height (default 520) */
  height?: number;
  /** CSS class name */
  className?: string;
}

// =============================================================================
// HELPER FUNCTIONS - Exact formula implementations from original JSFX
// =============================================================================

/** Square function (matching JSFX sqr) */
const sqr = (x: number): number => x * x;

/**
 * Calculate needle Y position from X and radius
 * Original formula from @block:
 *   l=sqrt(sqr(r)+sqr(212-x));
 *   h=((l-r)*r/l);
 *   m=sqrt(sqr(l-r)-sqr(h));
 *   y=35+h;
 *   x < 212 ? x=x+m : x=x-m;
 */
const calculateNeedlePosition = (x: number, r: number): { x: number; y: number } => {
  const l = Math.sqrt(sqr(r) + sqr(212 - x));
  const h = ((l - r) * r) / l;
  const m = Math.sqrt(Math.max(0, sqr(l - r) - sqr(h)));
  const y = 35 + h;
  const adjustedX = x < 212 ? x + m : x - m;
  return { x: adjustedX, y };
};

/**
 * Calculate X position from exponential dB scale
 * Original formula: xlt = floor(exp(log(1.055)*2.1*ool)*285)
 */
const calculateXFromDb = (db: number): number => {
  return Math.floor(Math.exp(Math.log(1.055) * 2.1 * db) * 285);
};

// =============================================================================
// GFX RENDERER CLASS - Exact rendering from original @gfx section
// =============================================================================

class VUMeterRenderer {
  private ctx: CanvasRenderingContext2D;
  private gsc: number = 1;
  private igsc: number = 1;
  private gxo: number = 0;
  private gfx_x: number = 0;
  private gfx_y: number = 0;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  /**
   * Initialize scaling from original @gfx:
   * gsc = min(gfx_w/425, gfx_h/520)
   * gxo = max(0, gfx_w/2 - gfx_h*425/520/2)
   */
  initScale(width: number, height: number): void {
    this.gsc = Math.min(width / 425, height / 520);
    this.igsc = 1.0 / this.gsc;
    this.gxo = Math.max(0, width / 2 - (height * 425) / 520 / 2);
  }

  setColor(r: number, g: number, b: number, a: number = 1): void {
    this.ctx.fillStyle = `rgba(${Math.floor(r * 255)}, ${Math.floor(g * 255)}, ${Math.floor(b * 255)}, ${a})`;
    this.ctx.strokeStyle = this.ctx.fillStyle;
  }

  setPos(x: number, y: number): void {
    this.gfx_x = x;
    this.gfx_y = y;
  }

  /** Scaled line drawing from original gfx_lineto override */
  lineTo(x: number, y: number, _aa: number): void {
    if (this.gsc <= 0.5) return;
    
    const startX = this.gfx_x * this.gsc + this.gxo;
    const startY = this.gfx_y * this.gsc;
    const endX = x * this.gsc + this.gxo;
    const endY = y * this.gsc;

    this.ctx.lineWidth = Math.max(1, this.gsc);
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();

    this.gfx_x = x;
    this.gfx_y = y;
  }

  /** Scaled rectangle drawing from original gfx_rectto override */
  rectTo(x: number, y: number): void {
    if (this.gsc <= 0.5) return;

    const startX = this.gfx_x * this.gsc + this.gxo;
    const startY = this.gfx_y * this.gsc;
    const endX = x * this.gsc + this.gxo;
    const endY = y * this.gsc;

    this.ctx.fillRect(startX, startY, endX - startX, endY - startY);
    this.gfx_x = x;
    this.gfx_y = y;
  }

  /** Draw number with scaling from original gfx_drawnumber override */
  drawNumber(value: number, decimals: number): void {
    if (this.gsc <= 0.5) return;
    
    const effectiveDecimals = this.gsc < 0.7 && decimals > 1 ? 1 : decimals;
    const text = value.toFixed(effectiveDecimals);
    
    const x = this.gfx_x * this.gsc + this.gxo;
    const y = this.gfx_y * this.gsc;
    
    this.ctx.font = `${Math.floor(11 * this.gsc)}px monospace`;
    this.ctx.fillText(text, x, y + 10 * this.gsc);
  }

  /** Draw character from original gfx_drawchar override */
  drawChar(char: string): void {
    if (this.gsc <= 0.5) return;

    const x = this.gfx_x * this.gsc + this.gxo;
    const y = this.gfx_y * this.gsc;
    
    this.ctx.font = `${Math.floor(11 * this.gsc)}px monospace`;
    this.ctx.fillText(char, x, y + 10 * this.gsc);
    this.gfx_x += 8;
  }

  drawString(text: string): void {
    for (const char of text) {
      this.drawChar(char);
    }
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function VUMeterGfx({
  leftLevel = 0,
  rightLevel = 0,
  responseMs = 50,
  release = 5,
  sampleRate = 44100,
  width = 425,
  height = 520,
  className = '',
}: VUMeterGfxProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const stateRef = useRef<VUMeterState | null>(null);
  const rendererRef = useRef<VUMeterRenderer | null>(null);

  // Initialize state from original @init section
  const initState = useCallback((): VUMeterState => {
    const sc = 6 / Math.log(2);
    const st = (responseMs * sampleRate) / 1000;
    const hold = (0.001 * responseMs * sampleRate) * 36;

    return {
      sc,
      rp: 261,
      r: 200,
      xl: 66, xr: 66,
      yl: 74, yr: 74,
      xlt: 74, xrt: 74,
      ylt: 74, yrt: 74,
      old_xl: 66, old_xr: 66,
      olt: -Infinity, ort: -Infinity,
      suml: 0, sumr: 0,
      cs: 0,
      rmsl: -Infinity, rmsr: -Infinity,
      rmsl_gfx: -Infinity, rmsr_gfx: -Infinity,
      rms_i: 0,
      i_max: 36,
      st, hold,
      bscnt: 0,
      pvl: 0, pvr: 0,
    };
  }, [responseMs, sampleRate]);

  // Process audio block from original @block section
  const processBlock = useCallback((state: VUMeterState, samplesBlock: number, rel: number): void => {
    const { sc, r } = state;

    // RMS calculation: rmsl = floor(sc*log(sqrt(suml/cs))*100)/100
    if (state.cs > 0) {
      const rmsValL = Math.sqrt(state.suml / state.cs);
      const rmsValR = Math.sqrt(state.sumr / state.cs);
      state.rmsl = rmsValL > 0 ? Math.floor(sc * Math.log(rmsValL) * 100) / 100 : -Infinity;
      state.rmsr = rmsValR > 0 ? Math.floor(sc * Math.log(rmsValR) * 100) / 100 : -Infinity;
    }

    // Update GFX RMS at interval
    if (state.rms_i >= state.i_max) {
      state.rmsl_gfx = state.rmsl;
      state.rmsr_gfx = state.rmsr;
      state.rms_i = 0;
    }
    state.rms_i += 1;

    // Process when bscnt > st
    if (state.bscnt > state.st) {
      // Get output levels in dB: ool = log(pvl)*sc
      const ool = state.pvl > 0 ? Math.log(state.pvl) * sc : -Infinity;
      const oor = state.pvr > 0 ? Math.log(state.pvr) * sc : -Infinity;

      // Get x from exp scale: xlt = floor(exp(log(1.055)*2.1*ool)*285)
      state.xlt = calculateXFromDb(ool);
      state.xrt = calculateXFromDb(oor);

      // Calculate y from x and radius for left channel
      const leftPos = calculateNeedlePosition(state.xlt, r);
      state.ylt = leftPos.y;
      state.xlt = leftPos.x;

      // Calculate y from x and radius for right channel
      const rightPos = calculateNeedlePosition(state.xrt, r);
      state.yrt = rightPos.y;
      state.xrt = rightPos.x;

      // Update x,y,out if new value is higher
      if (state.old_xl < state.xlt) {
        state.xl = Math.min(Math.max(state.xlt, 66), 375);
        state.yl = state.ylt;
        state.olt = ool;
      }
      if (state.old_xr < state.xrt) {
        state.xr = Math.min(Math.max(state.xrt, 66), 375);
        state.yr = state.yrt;
        state.ort = oor;
      }

      state.bscnt = 0;
      state.pvl = 0;
      state.pvr = 0;
    }

    // Indicator fall-back: fallback = rel/2*samplesblock/1024
    const fallback = (rel / 2) * (samplesBlock / 1024);
    const fbi_l = Math.exp(state.xl / 512) * fallback;
    const fbi_r = Math.exp(state.xr / 512) * fallback;

    if (state.xl > 66) state.xl -= fbi_l;
    if (state.xr > 66) state.xr -= fbi_r;

    state.old_xl = state.xl;
    state.old_xr = state.xr;
    state.bscnt += samplesBlock;

    // Limit x
    state.xl = Math.min(Math.max(state.xl, 66), 375);
    state.xr = Math.min(Math.max(state.xr, 66), 375);

    // Get y after fall-back
    const leftFinal = calculateNeedlePosition(state.xl, r);
    state.yl = Math.floor(leftFinal.y);

    const rightFinal = calculateNeedlePosition(state.xr, r);
    state.yr = Math.floor(rightFinal.y);
  }, []);

  // Process sample from original @sample section
  const processSample = useCallback((state: VUMeterState, spl0: number, spl1: number): void => {
    // pvl = max(pvl, abs(spl0))
    state.pvl = Math.max(state.pvl, Math.abs(spl0));
    state.pvr = Math.max(state.pvr, Math.abs(spl1));

    // RMS accumulation
    if (state.cs >= state.hold) {
      state.cs = 0;
      state.suml = 0;
      state.sumr = 0;
    } else {
      state.cs += 1;
      state.suml += sqr(Math.abs(spl0));
      state.sumr += sqr(Math.abs(spl1));
    }
  }, []);

  // Draw VU meter from original @gfx section - exact reproduction
  const draw = useCallback((
    renderer: VUMeterRenderer,
    state: VUMeterState,
    canvasWidth: number,
    canvasHeight: number
  ): void => {
    const ctx = renderer.getContext();
    const { rp, xl, xr, yl, yr, olt, ort, rmsl_gfx, rmsr_gfx } = state;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    renderer.initScale(canvasWidth, canvasHeight);

    // ================================================================
    // LEFT CHANNEL METER
    // ================================================================

    // Red scale (0, +3 markers)
    renderer.setColor(1, 0, 0, 1);
    renderer.setPos(283, 28);
    renderer.drawNumber(0, 0);
    renderer.setPos(370, 55);
    renderer.drawNumber(3, 0);
    renderer.setPos(405, 57);
    renderer.drawChar('+');

    // Red scale lines
    renderer.setPos(283, 38);
    renderer.lineTo(269, 76, 0.5);
    renderer.setPos(311, 43);
    renderer.lineTo(293, 80, 1);
    renderer.setPos(342, 51);
    renderer.lineTo(318, 85, 1);
    renderer.setPos(370, 65);
    renderer.lineTo(344, 93, 0.5);

    // White scale
    renderer.setColor(1, 1, 1, 1);
    renderer.setPos(12, 60);
    renderer.drawChar('-');
    renderer.setPos(41, 53);
    renderer.drawNumber(20, 0);
    renderer.setPos(80, 37);
    renderer.drawNumber(10, 0);
    renderer.setPos(125, 29);
    renderer.drawNumber(7, 0);
    renderer.setPos(157, 25);
    renderer.drawNumber(5, 0);
    renderer.setPos(198, 24);
    renderer.drawNumber(3, 0);

    // White scale lines
    renderer.setPos(56, 63);
    renderer.lineTo(82, 92, 0.5);
    renderer.setPos(95, 47);
    renderer.lineTo(119, 82, 0.5);
    renderer.setPos(130, 39);
    renderer.lineTo(146, 77, 0.5);
    renderer.setPos(145, 37);
    renderer.lineTo(158, 75, 1);
    renderer.setPos(162, 35);
    renderer.lineTo(171, 74, 0.5);
    renderer.setPos(180, 34);
    renderer.lineTo(187, 74, 1);
    renderer.setPos(202, 34);
    renderer.lineTo(204, 72, 0.5);
    renderer.setPos(227, 34);
    renderer.lineTo(223, 73, 1);
    renderer.setPos(253, 35);
    renderer.lineTo(245, 73, 1);

    // VU box border
    renderer.setColor(0.75, 0.75, 0.75, 1);
    renderer.setPos(198, 108);
    renderer.rectTo(241, 139);

    // VU box
    renderer.setColor(0.5, 0.1, 0.1, 1);
    renderer.setPos(200, 110);
    renderer.rectTo(239, 137);

    // VU text
    renderer.setColor(0.85, 0.85, 0.85, 1);
    renderer.setPos(212, 120);
    renderer.drawString('VU');

    // Left meter needle (red if clipping, white otherwise)
    if (olt > 0) {
      renderer.setColor(1, 0, 0, 1);
    } else {
      renderer.setColor(1, 1, 1, 1);
    }
    // Draw 3-pixel wide needle
    renderer.setPos(212, 236);
    renderer.lineTo(xl, yl, 1);
    renderer.setPos(211, 236);
    renderer.lineTo(xl - 1, yl, 1);
    renderer.setPos(210, 236);
    renderer.lineTo(xl - 2, yl, 1);

    // Big border
    renderer.setColor(0.55, 0.55, 0.55, 1);
    renderer.setPos(0, 179);
    renderer.rectTo(425, 180);

    // Big box 1 (blue background)
    renderer.setColor(0.1, 0.2, 0.39, 1);
    renderer.setPos(0, 180);
    renderer.rectTo(425, 261);

    // Big box 2 (highlight)
    renderer.setColor(1, 1, 1, 0.1);
    renderer.setPos(0, 180);
    renderer.rectTo(425, 190);

    // Big box 3 (shadow)
    renderer.setColor(0, 0, 0, 0.3);
    renderer.setPos(0, 245);
    renderer.rectTo(425, 261);

    // Text boxes
    renderer.setColor(0, 0, 0, 1);
    renderer.setPos(350, 210);
    renderer.rectTo(415, 227);
    renderer.setPos(250, 210);
    renderer.rectTo(315, 227);

    // Channel labels
    renderer.setColor(1, 1, 1, 1);
    renderer.setPos(20, 215);
    renderer.drawString('LEFT');
    renderer.setPos(215, 215);
    renderer.drawString('RMS');
    renderer.setPos(333, 215);
    renderer.drawChar('P');

    // RMS display
    renderer.setPos(255, 215);
    if (rmsl_gfx > -300) {
      if (rmsl_gfx > 0.0) {
        renderer.setColor(1, 0, 0, 1);
        renderer.drawChar('+');
      }
      renderer.drawNumber(rmsl_gfx, 2);
    } else {
      renderer.drawString('-INF');
    }

    // Peak display
    renderer.setColor(1, 1, 1, 1);
    renderer.setPos(355, 215);
    if (olt > -300) {
      if (olt >= 0.0) {
        renderer.drawChar('+');
        renderer.setColor(1, 0, 0, 1);
      }
      renderer.drawNumber(olt, 2);
    } else {
      renderer.drawString('-INF');
    }

    // ================================================================
    // RIGHT CHANNEL METER (offset by rp = 261)
    // ================================================================

    // Red scale
    renderer.setColor(1, 0, 0, 1);
    renderer.setPos(283, rp + 28);
    renderer.drawNumber(0, 0);
    renderer.setPos(370, rp + 55);
    renderer.drawNumber(3, 0);
    renderer.setPos(405, rp + 57);
    renderer.drawChar('+');

    // Red scale lines
    renderer.setPos(283, rp + 38);
    renderer.lineTo(269, rp + 76, 0.5);
    renderer.setPos(311, rp + 43);
    renderer.lineTo(293, rp + 80, 1);
    renderer.setPos(342, rp + 51);
    renderer.lineTo(318, rp + 85, 1);
    renderer.setPos(370, rp + 65);
    renderer.lineTo(344, rp + 93, 0.5);

    // White scale
    renderer.setColor(1, 1, 1, 1);
    renderer.setPos(12, rp + 60);
    renderer.drawChar('-');
    renderer.setPos(41, rp + 53);
    renderer.drawNumber(20, 0);
    renderer.setPos(80, rp + 37);
    renderer.drawNumber(10, 0);
    renderer.setPos(125, rp + 29);
    renderer.drawNumber(7, 0);
    renderer.setPos(157, rp + 25);
    renderer.drawNumber(5, 0);
    renderer.setPos(198, rp + 24);
    renderer.drawNumber(3, 0);

    // White scale lines
    renderer.setPos(56, rp + 63);
    renderer.lineTo(82, rp + 92, 0.5);
    renderer.setPos(95, rp + 47);
    renderer.lineTo(119, rp + 82, 0.5);
    renderer.setPos(130, rp + 39);
    renderer.lineTo(146, rp + 77, 0.5);
    renderer.setPos(145, rp + 37);
    renderer.lineTo(158, rp + 75, 1);
    renderer.setPos(162, rp + 35);
    renderer.lineTo(171, rp + 74, 0.5);
    renderer.setPos(180, rp + 34);
    renderer.lineTo(187, rp + 74, 1);
    renderer.setPos(202, rp + 34);
    renderer.lineTo(204, rp + 72, 0.5);
    renderer.setPos(227, rp + 34);
    renderer.lineTo(223, rp + 73, 1);
    renderer.setPos(253, rp + 35);
    renderer.lineTo(245, rp + 73, 1);

    // VU box border
    renderer.setColor(0.75, 0.75, 0.75, 1);
    renderer.setPos(198, rp + 108);
    renderer.rectTo(241, rp + 139);

    // VU box
    renderer.setColor(0.5, 0.1, 0.1, 1);
    renderer.setPos(200, rp + 110);
    renderer.rectTo(239, rp + 137);

    // VU text
    renderer.setColor(0.85, 0.85, 0.85, 1);
    renderer.setPos(212, rp + 120);
    renderer.drawString('VU');

    // Right meter needle
    if (ort > 0) {
      renderer.setColor(1, 0, 0, 1);
    } else {
      renderer.setColor(1, 1, 1, 1);
    }
    renderer.setPos(212, rp + 236);
    renderer.lineTo(xr, rp + yr, 1);
    renderer.setPos(211, rp + 236);
    renderer.lineTo(xr - 1, rp + yr, 1);
    renderer.setPos(210, rp + 236);
    renderer.lineTo(xr - 2, rp + yr, 1);

    // Big border
    renderer.setColor(0.55, 0.55, 0.55, 1);
    renderer.setPos(0, rp + 179);
    renderer.rectTo(425, rp + 180);

    // Big box 1
    renderer.setColor(0.1, 0.2, 0.39, 1);
    renderer.setPos(0, rp + 180);
    renderer.rectTo(425, rp + 261);

    // Big box 2
    renderer.setColor(1, 1, 1, 0.1);
    renderer.setPos(0, rp + 180);
    renderer.rectTo(425, rp + 190);

    // Big box 3
    renderer.setColor(0, 0, 0, 0.3);
    renderer.setPos(0, rp + 245);
    renderer.rectTo(425, rp + 261);

    // Text boxes
    renderer.setColor(0, 0, 0, 1);
    renderer.setPos(350, rp + 210);
    renderer.rectTo(415, rp + 227);
    renderer.setPos(250, rp + 210);
    renderer.rectTo(315, rp + 227);

    // Channel labels
    renderer.setColor(1, 1, 1, 1);
    renderer.setPos(20, rp + 215);
    renderer.drawString('RIGHT');
    renderer.setPos(215, rp + 215);
    renderer.drawString('RMS');

    // RMS display
    renderer.setPos(255, rp + 215);
    if (rmsr_gfx > -300) {
      if (rmsr_gfx > 0.0) {
        renderer.setColor(1, 0, 0, 1);
        renderer.drawChar('+');
      }
      renderer.drawNumber(rmsr_gfx, 2);
    } else {
      renderer.drawString('-INF');
    }

    // Peak display
    renderer.setColor(1, 1, 1, 1);
    renderer.setPos(355, rp + 215);
    if (ort > -300) {
      if (ort >= 0.0) {
        renderer.drawChar('+');
        renderer.setColor(1, 0, 0, 1);
      }
      renderer.drawNumber(ort, 2);
    } else {
      renderer.drawString('-INF');
    }
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    stateRef.current = initState();
    rendererRef.current = new VUMeterRenderer(ctx);

    const animate = () => {
      if (!stateRef.current || !rendererRef.current) return;

      // Process samples (simulate ~512 samples per frame at 60fps)
      const samplesPerFrame = Math.floor(sampleRate / 60);
      for (let i = 0; i < samplesPerFrame; i++) {
        processSample(stateRef.current, leftLevel, rightLevel);
      }

      // Process block
      processBlock(stateRef.current, samplesPerFrame, release);

      // Draw
      draw(rendererRef.current, stateRef.current, canvas.width, canvas.height);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [leftLevel, rightLevel, release, sampleRate, initState, processSample, processBlock, draw]);

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
  }, [width, height]);

  return (
    <div className={`${styles.vuMeterGfx} ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={styles.vuMeterCanvas}
      />
    </div>
  );
}

export default VUMeterGfx;
