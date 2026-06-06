import { BaseEffect } from './base-classes/BaseEffect';

/** Interfaccia fortemente tipizzata dei parametri del pedale */
export interface DistortionParams extends Record<string, unknown> {
  /** Intensità della distorsione (0.0 a 100.0) */
  amount: number;
  /** Volume in ingresso pre-clipping (0.0+) */
  gain: number;
  /** Volume in uscita post-clipping (0.0 a 1.0+) */
  master: number;
}

/**
 * DistortionNode
 * Simula il calore armonico di un amplificatore usando un'onda distorta (clipping sigmoideo).
 * Implementazione Web Audio API altamente performante e fortemente tipizzata.
 * 
 * Flusso del segnale: input(GainNode) -> waveShaper(WaveShaperNode) -> output(GainNode)
 */
export class DistortionNode extends BaseEffect<DistortionParams> {
  public input: GainNode;
  public output: GainNode;

  private waveShaper: WaveShaperNode;

  // Salviamo lo stato della curva per evitare ricalcoli costosi
  private currentAmount: number = -1;

  constructor(context: AudioContext, params?: Partial<DistortionParams>) {
    super();

    // Creazione nodi
    this.input = context.createGain();       // Funge da controllo di volume in ingresso
    this.waveShaper = context.createWaveShaper();
    this.waveShaper.oversample = '4x';       // Evita aliasing ad alte frequenze (Overdrive analogico)
    this.output = context.createGain();      // Modula l'uscita

    // Routing interno
    this.input.connect(this.waveShaper);
    this.waveShaper.connect(this.output);

    // Default Iniziale se params non provvisto interamente
    this.updateParams({
      amount: params?.amount ?? 50,
      gain: params?.gain ?? 1.0,
      master: params?.master ?? 1.0
    });
  }

  /**
   * Aggiorna programmaticamente i parametri.
   * Per i volumi usa automazioni per evitare click e pop (setTargetAtTime).
   * L'array Float32 del WaveShaper viene riallocato SOLO quando amount cambia.
   */
  public updateParams(params: Partial<DistortionParams>): void {
    if (params.gain !== undefined) {
      // Transizione fluida su scala temporale per evitare click
      this.input.gain.setTargetAtTime(
        params.gain, this.input.context.currentTime, 0.01
      );
    }

    if (params.master !== undefined) {
      this.output.gain.setTargetAtTime(
        params.master, this.output.context.currentTime, 0.01
      );
    }

    if (params.amount !== undefined && params.amount !== this.currentAmount) {
      this.currentAmount = params.amount;
      // Il calcolo curva è pesante, quindi ricalcola solo se cambiato
      // Nota: usiamo "as any" o "as unknown as Float32Array" come workaround per l'errore di TS
      // in quanto TS 5.5+ considera i Float32Array come ArrayBufferLike (incluso SharedArrayBuffer)
      // ma il lib.dom.d.ts del Web Audio API si aspetta specificamente ArrayBuffer.
      this.waveShaper.curve = this.makeDistortionCurve(this.currentAmount);
    }
  }

  /**
   * Genera una curva per la "WaveShaping" ispirata alla saturazione analogica valvolare
   * Formula di tangente iperbolica modificata.
   * 
   * @param amount Intensità (es. valori tra 10-100 per Drive udibile)
   * @returns Array Float32 con coefficienti di clipping.
   */
  private makeDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
    const k = typeof amount === 'number' ? amount : 50;
    // La risoluzione a 44.1kHz offre una curva morbida senza spreco di memoria aggiuntiva
    const SAMPLE_RATE = this.input.context.sampleRate || 44100;
    const buffer = new ArrayBuffer(SAMPLE_RATE * 4);
    const curve = new Float32Array(buffer);
    const deg = Math.PI / 180;

    // Per iterazioni calde conviene evitare chiamate functione Math all'interno di un grosso array
    const pi = Math.PI;

    for (let i = 0; i < SAMPLE_RATE; ++i) {
      const x = (i * 2) / SAMPLE_RATE - 1; // Normalize da -1 a 1
      // Curva di clipping sigmoidea adattata per soft-clipping di chitarre
      curve[i] = ((3 + k) * x * 20 * deg) / (pi + k * Math.abs(x));
    }

    return curve;
  }
}
