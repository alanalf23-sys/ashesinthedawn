// Blown Capacitor Compressor - TypeScript implementation (approximation of JSFX logic)
// Exports a class that processes stereo Float32Array blocks in place.

export type RatioOption = '4' | '8' | '12' | '20' | 'All' | number;

export interface BlownCapParams {
  thresholdDb: number; // slider1: -60 .. 0
  ratioOption: RatioOption; // slider2 selection
  makeupDb: number; // slider3
  attackUs: number; // slider4 microseconds
  releaseMs: number; // slider5 milliseconds
  mixPercent: number; // slider6 0..100
  sampleRate: number;
  softKnee?: boolean;
  autoGain?: number;
}

export class BlownCapCompressor {
  private params: BlownCapParams;

  // Internal state
  private runave = 0; // running average of squared peak
  private runratio = 1;
  private rundb = 0;
  private averatio = 1;
  private maxover = 0;
  private gr_meter = 1;
  private ext_gr_meter = 0;

  // Cached coefficients
  private rmscoef = 0.999; // approximate smoothing for RMS
  private ratatcoef = 0;
  private ratrelcoef = 0;
  private atcoef = 0;
  private relcoef = 0;

  // constants
  private readonly log2db = 8.685889638065036; // 20 / ln(10)
  private readonly db2log = 0.11512925464970228; // ln(10) / 20

  constructor(params: BlownCapParams) {
    this.params = { softKnee: false, autoGain: 0, ...params };
    this.resetState();
    this.updateCoefficients();
  }

  setParams(p: Partial<BlownCapParams>) {
    this.params = { ...this.params, ...p };
    this.updateCoefficients();
  }

  getParams(): BlownCapParams {
    return { ...this.params };
  }

  resetState() {
    this.runave = 0;
    this.runratio = 1;
    this.rundb = 0;
    this.averatio = 1;
    this.maxover = 0;
    this.gr_meter = 1;
    this.ext_gr_meter = 0;
  }

  private updateCoefficients() {
    const srate = this.params.sampleRate || 44100;
    // ratatcoef/ratrelcoef control smoothing of ratio envelope (based on JSFX approximations)
    this.ratatcoef = Math.exp(-1 / (0.00001 * srate));
    this.ratrelcoef = Math.exp(-1 / (0.5 * srate));

    const attime = Math.max(1e-9, this.params.attackUs / 1_000_000); // seconds
    const reltime = Math.max(1e-9, this.params.releaseMs / 1000);
    this.atcoef = Math.exp(-1 / (attime * srate));
    this.relcoef = Math.exp(-1 / (reltime * srate));

    // RMS smoothing coefficient - small value for per-sample smoothing
    // approximate to similar behaviour
    this.rmscoef = 0.9995;
  }

  // Map ratio option to numeric ratio
  private mapRatio(): { ratio: number; allin: boolean } {
    const ro = this.params.ratioOption;
    if (ro === 'All') return { ratio: 20, allin: true };
    if (ro === '4' || ro === 4) return { ratio: 4, allin: false };
    if (ro === '8' || ro === 8) return { ratio: 8, allin: false };
    if (ro === '12' || ro === 12) return { ratio: 12, allin: false };
    if (ro === '20' || ro === 20) return { ratio: 20, allin: false };
    // numeric fallback
    const n = Number(ro);
    return { ratio: isFinite(n) ? n : 4, allin: false };
  }

  // Process stereo block (in-place) - left and right Float32Array same length
  processBlock(left: Float32Array, right: Float32Array) {
    const len = Math.min(left.length, right.length);
    const srate = this.params.sampleRate || 44100;

    const threshDb = this.params.thresholdDb;
    const threshv = Math.exp(threshDb * this.db2log);
    const softknee = !!this.params.softKnee;
    const capscBase = this.log2db;
    const autoGain = this.params.autoGain || 0;

    // ratio mapping
    const { ratio, allin } = this.mapRatio();

    const makeupv = Math.exp((this.params.makeupDb + autoGain) * this.db2log);
    const mix = Math.max(0, Math.min(1, this.params.mixPercent / 100));

    for (let i = 0; i < len; i++) {
      const ospl0 = left[i];
      const ospl1 = right[i];
      const aspl0 = Math.abs(ospl0);
      const aspl1 = Math.abs(ospl1);
      let maxspl = Math.max(aspl0, aspl1);
      // use squared level as in JSFX
      maxspl = maxspl * maxspl;

      // runave smoothing
      this.runave = maxspl + this.rmscoef * (this.runave - maxspl);
      const det = Math.sqrt(Math.max(0, this.runave));

      // mimic capsc * log(det/cthreshv) -> overdb
      const cthresh = softknee ? (threshDb - 3) : threshDb;
      const cthreshv = Math.exp(cthresh * this.db2log);

      const capsc = capscBase;
      let overdb = Math.max(0, capsc * Math.log(det / cthreshv));

      // ratio smoothing and tracking
      if (overdb - this.rundb > 5) {
        this.averatio = 4;
      }

      if (overdb > this.rundb) {
        this.rundb = overdb + this.atcoef * (this.rundb - overdb);
        this.runratio = this.averatio + this.ratatcoef * (this.runratio - this.averatio);
      } else {
        this.rundb = overdb + this.relcoef * (this.rundb - overdb);
        this.runratio = this.averatio + this.ratrelcoef * (this.runratio - this.averatio);
      }

      overdb = this.rundb;
      this.averatio = this.runratio;

      // cratio selection (all-in behavior uses dynamic averatio)
      let cratio = allin ? (12 + this.averatio) : ratio;

      // compute gain reduction in dB (gr)
      const gr = -overdb * (cratio - 1) / cratio; // negative dB reduction
      const grv = Math.exp(gr * this.db2log);

      // meter smoothing
      this.runmax = Math.max(this.maxover, 0);
      // emulate runmax as in JSFX (approx)
      this.maxover = this.maxover * this.relcoef + overdb * (1 - this.relcoef);

      // update gr_meter
      if (grv < this.gr_meter) this.gr_meter = grv;
      else {
        this.gr_meter *= Math.exp(1 / srate);
        if (this.gr_meter > 1) this.gr_meter = 1;
      }

      this.ext_gr_meter = gr;

      // apply gain reduction + makeup + mix
      const out0 = ospl0 * grv * makeupv * mix + ospl0 * (1 - mix);
      const out1 = ospl1 * grv * makeupv * mix + ospl1 * (1 - mix);

      left[i] = out0;
      right[i] = out1;
    }
  }

  // expose approximate gain reduction meter in dB
  getGainReductionDb(): number {
    // ext_gr_meter stores negative dB reduction value in 'gr' variable
    // return positive reduction (dB)
    return Math.max(0, -this.ext_gr_meter);
  }
}
