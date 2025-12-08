// Blown Capacitor style compressor - TypeScript implementation
// Ported from provided JSFX-like specification to a realtime-friendly class

export interface BlownCapParams {
  thresholdDb: number; // dB
  rpos?: number; // slider2 raw position (0..9)
  makeupDb: number; // dB
  attackUs: number; // microseconds
  releaseMs: number; // milliseconds
  mixPercent: number; // 0-100
  sampleRate: number;
  softKnee?: boolean;
  autogain?: number;
}

export default class BlownCapCompressor {
  private srate: number;
  private db2log = Math.log(10) / 20; // ln(10)/20
  private log2db = 20 / Math.LN10; // 20/ln(10)

  // parameters
  thresholdDb = 0;
  thresholdLinear = 1;
  rpos = 8; // raw slider position default
  ratioChoice = 20; // numeric ratio default
  makeupDb = 0;
  makeupLinear = 1;
  attackSec = 0.00001;
  releaseSec = 0.1;
  mix = 1;
  softKnee = false;
  autogain = 0;

  // behavior flags
  allIn = false;
  private capscMultiplier = 1; // used when "broken capacitor" selected

  // internal state
  private runave = 0; // smoothed squared peak
  private rundb = 0; // smoothed dB detector value
  private runratio = 4; // smoothed ratio
  private averatio = 4; // target ratio
  private maxover = 0;
  private gr_meter = 1;

  // coefficients
  private atcoef = 0.99;
  private relcoef = 0.999;
  private ratatcoef = 0.9999;
  private ratrelcoef = 0.9999;
  private gr_meter_decay = Math.exp(1 / (1 * 44100));

  constructor(params?: Partial<BlownCapParams>) {
    this.srate = params?.sampleRate || 44100;
    this.setFromSliders({
      slider1: params?.thresholdDb ?? 0,
      slider2: params?.rpos ?? 8,
      slider3: params?.makeupDb ?? 0,
      slider4: params?.attackUs ?? 20,
      slider5: params?.releaseMs ?? 250,
      slider6: params?.mixPercent ?? 100,
      softknee: params?.softKnee ?? false,
      autogain: params?.autogain ?? 0,
      sampleRate: this.srate,
    });
  }

  /**
   * Set parameters directly
   */
  setParams(p: Partial<BlownCapParams>) {
    this.setFromSliders({
      slider1: p.thresholdDb ?? this.thresholdDb,
      slider2: p.rpos ?? this.rpos,
      slider3: p.makeupDb ?? this.makeupDb,
      slider4: p.attackUs ?? this.attackSec * 1e6,
      slider5: p.releaseMs ?? this.releaseSec * 1000,
      slider6: p.mixPercent ?? this.mix * 100,
      softknee: p.softKnee ?? this.softKnee,
      autogain: p.autogain ?? this.autogain,
      sampleRate: p.sampleRate ?? this.srate,
    });
  }

  /**
   * Map slider inputs (as per provided UI mapping) to internal params
   * slider1: threshold (dB)
   * slider2: rpos (0..9) mapping with deprecated options
   * slider3: makeup (dB)
   * slider4: attack (uS)
   * slider5: release (mS)
   * slider6: mix (%)
   */
  setFromSliders(opts: { slider1: number; slider2: number; slider3: number; slider4: number; slider5: number; slider6: number; softknee?: boolean; autogain?: number; sampleRate?: number }) {
    const { slider1, slider2, slider3, slider4, slider5, slider6, softknee = false, autogain = 0, sampleRate } = opts;
    if (sampleRate && sampleRate !== this.srate) this.srate = sampleRate;

    this.thresholdDb = slider1;
    this.thresholdLinear = Math.exp(this.thresholdDb * this.db2log);

    // rpos mapping as in JSFX: values 0..9 with first entries 'deprecated' causing capsc multiplier
    let rpos = Math.floor(slider2);
    this.rpos = rpos;
    let capscMultiplier = 1;
    if (rpos > 4) {
      rpos = rpos - 5; // use the mapped indexes
      capscMultiplier = 1;
    } else {
      // broken capacitor options - apply multiplier
      capscMultiplier = 2.08136898;
    }

    // map rpos 0..4 to ratios 4,8,12,20,All
    if (rpos === 0) this.ratioChoice = 4;
    else if (rpos === 1) this.ratioChoice = 8;
    else if (rpos === 2) this.ratioChoice = 12;
    else if (rpos === 3) this.ratioChoice = 20;
    else if (rpos === 4) { this.ratioChoice = 20; this.allIn = true; } else { this.ratioChoice = 20; this.allIn = false; }

    this.capscMultiplier = capscMultiplier;

    this.makeupDb = slider3;
    this.autogain = autogain || 0;
    this.makeupLinear = Math.exp((this.makeupDb + this.autogain) * this.db2log);

    this.attackSec = Math.max(1e-6, slider4 / 1e6);
    this.releaseSec = Math.max(0.001, slider5 / 1000);

    this.atcoef = Math.exp(-1 / (this.attackSec * this.srate));
    this.relcoef = Math.exp(-1 / (this.releaseSec * this.srate));
    this.ratatcoef = Math.exp(-1 / (0.00001 * this.srate));
    this.ratrelcoef = Math.exp(-1 / (0.5 * this.srate));
    this.gr_meter_decay = Math.exp(1 / (1 * this.srate));

    this.mix = Math.max(0, Math.min(1, slider6 / 100));
    this.softKnee = softknee;
  }

  reset() {
    this.runave = 0;
    this.rundb = 0;
    this.runratio = 4;
    this.averatio = 4;
    this.maxover = 0;
    this.gr_meter = 1;
  }

  /**
   * Process interleaved or separate channel buffers in place.
   * left and right must be Float32Array of same length.
   */
  processBuffer(left: Float32Array, right: Float32Array): void {
    const n = Math.min(left.length, right.length);
    const capscBase = this.log2db; // used in original formula
    const capsc = capscBase * this.capscMultiplier;
    const cthresh = this.softKnee ? (this.thresholdDb - 3) : this.thresholdDb;
    const cthreshv = Math.exp(cthresh * this.db2log);

    for (let i = 0; i < n; i++) {
      const ospl0 = left[i];
      const ospl1 = right[i];
      const aspl0 = Math.abs(ospl0);
      const aspl1 = Math.abs(ospl1);
      let maxspl = Math.max(aspl0, aspl1);
      const maxspl2 = maxspl * maxspl;

      // simple RMS-style smoothing of squared peak
      const rmsTime = 0.01; // 10ms smoothing
      const rmsCoef = Math.exp(-1 / (rmsTime * this.srate));
      this.runave = maxspl2 + rmsCoef * (this.runave - maxspl2);

      const det = Math.sqrt(Math.max(0, this.runave));

      let overdb = 0;
      if (det > 0 && cthreshv > 0) {
        overdb = Math.max(0, capsc * Math.log(det / cthreshv));
      } else {
        overdb = 0;
      }

      // ratio smoothing logic
      if (overdb - this.rundb > 5) this.averatio = 4;

      if (overdb > this.rundb) {
        this.rundb = overdb + this.atcoef * (this.rundb - overdb);
        this.runratio = this.averatio + this.ratatcoef * (this.runratio - this.averatio);
      } else {
        this.rundb = overdb + this.relcoef * (this.rundb - overdb);
        this.runratio = this.averatio + this.ratrelcoef * (this.runratio - this.averatio);
      }

      // exterior ratio decision
      let cratio = this.ratioChoice;
      if (this.allIn) {
        cratio = 12 + this.averatio; // mimic original all-in behavior
      }

      // compute gain reduction in dB and linear
      const gr = -this.rundb * (cratio - 1) / (cratio || 1);
      let grv = Math.exp(gr * this.db2log);
      if (!isFinite(grv) || grv <= 0) grv = 1;

      // meter smoothing
      this.gr_meter *= this.gr_meter_decay;
      if (grv < this.gr_meter) this.gr_meter = grv;
      if (this.gr_meter > 1) this.gr_meter = 1;

      const makeupv = this.makeupLinear;

      // apply gain and mix
      const wetL = ospl0 * grv * makeupv;
      const wetR = ospl1 * grv * makeupv;

      left[i] = wetL * this.mix + ospl0 * (1 - this.mix);
      right[i] = wetR * this.mix + ospl1 * (1 - this.mix);

      // track maxover for potential visualization
      this.maxover = Math.max(this.maxover * this.relcoef, this.rundb);
    }
  }

  /** Process interleaved stereo Float32Array in place (LRLR...) */
  processInterleaved(buffer: Float32Array): void {
    const len = Math.floor(buffer.length / 2);
    const left = new Float32Array(len);
    const right = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      left[i] = buffer[i * 2];
      right[i] = buffer[i * 2 + 1];
    }
    this.processBuffer(left, right);
    for (let i = 0; i < len; i++) {
      buffer[i * 2] = left[i];
      buffer[i * 2 + 1] = right[i];
    }
  }

  getMeter(): { gainReductionLinear: number; gainReductionDb: number } {
    const grLinear = this.gr_meter;
    const grDb = 20 * Math.log10(Math.max(1e-12, grLinear));
    return { gainReductionLinear: grLinear, gainReductionDb: grDb };
  }
}
