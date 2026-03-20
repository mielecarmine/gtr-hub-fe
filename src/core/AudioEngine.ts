import { BaseEffect } from './nodes/base-classes/BaseEffect';

/**
 * Interfaccia locale per definire il costruttore del contesto audio supportato anche su Safari.
 */
interface WindowWithAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}

/**
 * Singleton AudioEngine fortemente tipizzato
 * Gestisce il ciclo di vita del Web Audio API, l'interazione con l'hardware
 * audio (scheda audio/microfono dell'utente) e la Master Chain dei pedali.
 */
export class AudioEngine {
  private static instance: AudioEngine;

  // Nodi Web Audio Core
  private context: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private inputNode: MediaStreamAudioSourceNode | null = null;

  // Master Chain (per output e visualizzazioni)
  private masterGain: GainNode | null = null;
  public analyser: AnalyserNode | null = null;

  // Catena degli effetti del simulatore
  private effectsChain: BaseEffect<Record<string, unknown>>[] = [];

  /**
   * Costruttore privato (Pattern Singleton).
   * L'inizializzazione reale avviene tramite initialize()
   */
  private constructor() { }

  /**
   * Ritorna l'istanza globale condivisa dell'AudioEngine.
   */
  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Inizializzazione differita dell'AudioContext.
   * Deve essere invocata dopo un'interazione utente (es. un click) 
   * per rispettare le policy dei browser.
   */
  public initialize(): void {
    if (this.context) return; // Evita doppie inizializzazioni

    // Crea contesto con priorità per bassa latenza col supporto a Safari
    const localWindow = window as unknown as WindowWithAudio;
    const AudioContextClass = window.AudioContext || localWindow.webkitAudioContext;

    if (!AudioContextClass) {
      throw new Error("Web Audio API non è supportata da questo browser.");
    }

    this.context = new AudioContextClass({
      latencyHint: 'interactive'
    });

    // Inizializza il Master Gain (volume finale)
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 1.0;

    // Inizializza l'analizzatore di spettro (per UI)
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 2048;

    // Setup della master chain (Routing finale)
    // MasterGain -> Analyser -> Output dispositivo (Casse/Cuffie)
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.context.destination);
  }

  /**
   * Apre il flusso microfonico / scheda audio bypassando DSP del browser.
   */
  public async connectInput(): Promise<void> {
    if (!this.context) {
      throw new Error("L'AudioEngine deve essere inizializzato prima di attivare l'input.");
    }

    try {
      // Configurazioni essenziali per chitarra: segnale "puro"
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: false
      });

      // Conversione dello stream audio in un nodo del grafo
      this.inputNode = this.context.createMediaStreamSource(this.mediaStream);

      // Quando il microfono è pronto, ricompiliamo la catena di segnale
      this.rebuildGraph();
    } catch (err) {
      console.error("Errore nell'accedere all'hardware audio:", err);
      throw err;
    }
  }

  /**
   * Aggiorna l'array interno dei pedali e ricostruisce tutti i nodi.
   * Da utilizzare in reazione a Zustand o cambiamenti UI drag&drop.
   */
  public setEffects(effects: BaseEffect<Record<string, unknown>>[]): void {
    this.effectsChain = effects;
    this.rebuildGraph();
  }

  /**
   * Ricostruisce l'intero grafo del segnale audio iterando sulla catena.
   * FLUSSO: Input -> Pedale 1 -> Pedale 2 ... -> Master Gain
   */
  public rebuildGraph(): void {
    if (!this.context || !this.masterGain) return;

    // 1. Scollega tutto esistente
    if (this.inputNode) {
      this.inputNode.disconnect();
    }

    for (const effect of this.effectsChain) {
      effect.disconnect();
    }

    // 2. Se non c'è input audio attivo, la catena è interrotta
    if (!this.inputNode) return;

    // 3. Collega in cascata progressiva (Input -> [Effetti] -> MasterGain)
    let currentNode: AudioNode = this.inputNode;

    for (const effect of this.effectsChain) {
      currentNode.connect(effect.input);
      currentNode = effect.output;
    }

    // 4. Collega l'ultimo nodo utile alla master chain finale
    currentNode.connect(this.masterGain);
  }

  /**
   * Helper per ottenere il contesto audio base
   */
  public getContext(): AudioContext {
    if (!this.context) throw new Error("AudioContext non ancora inizializzato.");
    return this.context;
  }
}
