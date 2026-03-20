import { BaseEffect } from './BaseEffect';

export interface BaseAmplifierParams extends Record<string, unknown> {
  gain: number;
  bass: number;
  mid: number;
  treble: number;
  volume: number;
  cabinetBypass: boolean;
}

/**
 * Classe astratta di base per tutte le simulazioni di amplificatori.
 * Utilizza una catena DSP interna: Input Gain -> Distortion -> Tone Stack (3-band EQ) -> Cabinet IR -> Power Amp.
 * 
 * @template TParams - Tipo dell'interfaccia che definisce i parametri dell'amplificatore
 */
export abstract class BaseAmplifier<
  TParams extends BaseAmplifierParams = BaseAmplifierParams
> extends BaseEffect<TParams> {
  protected context: AudioContext;

  public input: GainNode;
  public output: GainNode;

  // Stadi interni
  protected preAmp: GainNode;
  protected waveShaper: WaveShaperNode;
  protected lowEQ: BiquadFilterNode;
  protected midEQ: BiquadFilterNode;
  protected highEQ: BiquadFilterNode;
  protected cabinetSimulator: ConvolverNode;
  protected powerAmp: GainNode;

  // Routing bypass cabinet
  protected cabinetBypassNode: GainNode;
  protected cabinetActiveNode: GainNode;

  constructor(context: AudioContext) {
    super();
    this.context = context;

    // 1. Input Gain (Pre-amp)
    this.input = this.context.createGain();
    this.preAmp = this.context.createGain();

    // 2. Distortion Stage (WaveShaper)
    this.waveShaper = this.context.createWaveShaper();
    this.waveShaper.oversample = '4x';

    // 3. Tone Stack (EQ)
    this.lowEQ = this.context.createBiquadFilter();
    this.lowEQ.type = 'lowshelf';
    this.lowEQ.frequency.value = 100;

    this.midEQ = this.context.createBiquadFilter();
    this.midEQ.type = 'peaking';
    this.midEQ.frequency.value = 1000;
    this.midEQ.Q.value = 1.0;

    this.highEQ = this.context.createBiquadFilter();
    this.highEQ.type = 'highshelf';
    this.highEQ.frequency.value = 5000;

    // 4. Cabinet Simulator (Convolver) e bypass
    this.cabinetSimulator = this.context.createConvolver();
    
    // Nodi per routing
    this.cabinetBypassNode = this.context.createGain();
    this.cabinetActiveNode = this.context.createGain();
    this.cabinetBypassNode.gain.value = 0; // Default: cab attivo
    this.cabinetActiveNode.gain.value = 1;

    // 5. Master Volume (Power Amp)
    this.powerAmp = this.context.createGain();
    this.output = this.context.createGain();

    // -- Collegamenti DSP --
    // Input -> PreAmp -> WaveShaper -> EQ Stack
    this.input.connect(this.preAmp);
    this.preAmp.connect(this.waveShaper);
    this.waveShaper.connect(this.lowEQ);
    this.lowEQ.connect(this.midEQ);
    this.midEQ.connect(this.highEQ);

    // Split DOPO l'EQ
    this.highEQ.connect(this.cabinetSimulator);
    this.highEQ.connect(this.cabinetBypassNode);

    // Cabinet attivo 
    this.cabinetSimulator.connect(this.cabinetActiveNode);

    // Ricongiungimento
    this.cabinetActiveNode.connect(this.powerAmp);
    this.cabinetBypassNode.connect(this.powerAmp);

    // Output
    this.powerAmp.connect(this.output);
  }

  /**
   * Carica un file Impulse Response (IR) per la simulazione del cabinet.
   * @param url URL del file audio (.wav, .mp3, ecc.)
   */
  public async loadIR(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      this.cabinetSimulator.buffer = audioBuffer;
    } catch (error) {
      console.error(`Errore nel caricamento dell'IR [${url}]:`, error);
    }
  }

  /**
   * Aggiorna simultaneamente i guadagni dell'equalizzatore a 3 bande.
   */
  public setEQ(bass: number, mid: number, treble: number): void {
    const time = this.context.currentTime + 0.01;
    this.lowEQ.gain.setTargetAtTime(bass, time, 0.05);
    this.midEQ.gain.setTargetAtTime(mid, time, 0.05);
    this.highEQ.gain.setTargetAtTime(treble, time, 0.05);
  }

  /**
   * Genera una curva di soft-clipping/distorsione generica.
   */
  protected makeDistortionCurve(amount: number): Float32Array {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  public updateParams(params: Partial<TParams>): void {
    const time = this.context.currentTime + 0.01;

    // Input Gain (Pre-amp level)
    if (params.gain !== undefined) {
      // Usiamo una mappatura semplice, ad es. 0 -> 10 per esagerare l'ingresso al WaveShaper
      this.preAmp.gain.setTargetAtTime(params.gain, time, 0.05);
    }

    // Tone Stack
    if (params.bass !== undefined || params.mid !== undefined || params.treble !== undefined) {
      const b = params.bass !== undefined ? params.bass : this.lowEQ.gain.value;
      const m = params.mid !== undefined ? params.mid : this.midEQ.gain.value;
      const t = params.treble !== undefined ? params.treble : this.highEQ.gain.value;
      this.setEQ(b, m, t);
    }

    // Master Volume (Power Amp level)
    if (params.volume !== undefined) {
      this.powerAmp.gain.setTargetAtTime(params.volume, time, 0.05);
    }

    // Cab Bypass
    if (params.cabinetBypass !== undefined) {
      this.cabinetBypassNode.gain.value = params.cabinetBypass ? 1 : 0;
      this.cabinetActiveNode.gain.value = params.cabinetBypass ? 0 : 1;
    }
  }
}
