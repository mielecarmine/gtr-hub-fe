import { BaseAmplifier } from './base-classes/BaseAmplifier';
import type { BaseAmplifierParams } from './base-classes/BaseAmplifier';

export interface BritishStackParams extends BaseAmplifierParams {
  presence: number; // Tono aggiuntivo sulle alte frequenze tipico del finale di potenza
}

/**
 * BritishStack: Emulazione di un classico amplificatore stile Marshall.
 * Caratterizzato da bassi morbidi, medi molto accentuati e distorsione aggressiva (crunch).
 */
export class BritishStack extends BaseAmplifier<BritishStackParams> {
  // Aggiungiamo un filtro per la Presence (alte frequenze post-EQ)
  private presenceEQ: BiquadFilterNode;

  constructor(context: AudioContext) {
    super(context);

    // 1. Pre-configurazione del Tone Stack Britannico
    this.lowEQ.frequency.value = 120; // Bassi con una curva leggermente più alta
    this.midEQ.frequency.value = 800; // Il classico "mid-hump" britannico
    this.midEQ.Q.value = 1.2;
    this.highEQ.frequency.value = 4500; // Alti per dare "mordente"

    // 2. Inizializzazione controllo Presence
    this.presenceEQ = this.context.createBiquadFilter();
    this.presenceEQ.type = 'peaking';
    this.presenceEQ.frequency.value = 3000;
    this.presenceEQ.Q.value = 0.8;

    // Modifichiamo il routing per includere la Presence prima della separazione del cabinet
    this.highEQ.disconnect();
    this.highEQ.connect(this.presenceEQ);

    // Lo split ora avviene dal nodo presenceEQ
    this.presenceEQ.connect(this.cabinetSimulator);
    this.presenceEQ.connect(this.cabinetBypassNode);

    // 3. Setup Distorsione: applichiamo una curva "british crunch" più asimmetrica ed organica
    this.waveShaper.curve = this.makeBritishDistortionCurve(100);
  }

  /**
   * Genera una curva di distorsione asimmetrica.
   * Modifica leggermente la risposta in positivo/negativo per introdurre
   * armoniche pari e simulare saturazione valvolare stile EL34.
   */
  private makeBritishDistortionCurve(amount: number): NonNullable<WaveShaperNode['curve']> {
    const k = typeof amount === 'number' && amount > 0 ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples) as NonNullable<WaveShaperNode['curve']>;
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      const absX = Math.abs(x);
      // Asimmetria: attenuiamo il segnale negativo del 10%
      const asymmetry = x > 0 ? 1 : 0.9;
      curve[i] = (((3 + k) * x * 20 * deg) / (Math.PI + k * absX)) * asymmetry;
    }
    return curve;
  }

  /**
   * Gestisce sia i parametri standard che il paramtero Presence specifico del BritishStack.
   */
  public override updateParams(params: Partial<BritishStackParams>): void {
    // Chiamata al metodo padre per i parametri comuni (gain, bass, mid, treble, volume, bypass)
    super.updateParams(params);

    const time = this.context.currentTime + 0.01;

    // Gestione specifica del parametro presence
    if (params.presence !== undefined) {
      this.presenceEQ.gain.setTargetAtTime(params.presence, time, 0.05);
    }
  }
}
