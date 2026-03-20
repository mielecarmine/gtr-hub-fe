/**
 * Classe astratta di base per tutti gli effetti audio (pedali e simulazioni).
 * Definisce l'interfaccia standard per l'ingresso/uscita del segnale e
 * il ciclo di vita dei nodi Web Audio API.
 * 
 * @template TParams - Tipo dell'interfaccia che definisce i parametri dell'effetto (es. DistortionParams).
 */
export abstract class BaseEffect<TParams extends Record<string, unknown> = Record<string, unknown>> {
  /** 
   * Nodo in ingresso per questo effetto.
   * Il segnale precedente nella catena verrà connesso qui. 
   */
  public abstract input: AudioNode;
  
  /** 
   * Nodo in uscita per questo effetto. 
   * Questo nodo sarà connesso al successivo elemento della catena audio.
   */
  public abstract output: AudioNode;

  /**
   * Aggiorna i parametri interni dell'effetto in modo performante.
   * @param params - Oggetto di configurazione tipizzato parziale.
   */
  public abstract updateParams(params: Partial<TParams>): void;

  /**
   * Connette l'uscita di questo effetto a una destinazione in ingresso.
   * Consente il routing verso un altro AudioNode o un AudioParam (es. per modulazioni).
   * 
   * @param destination - Nodo o parametro di destinazione.
   */
  public connect(destination: AudioNode | AudioParam): void {
    if (destination instanceof AudioNode) {
      this.output.connect(destination);
    } else {
      // destination è un AudioParam
      this.output.connect(destination);
    }
  }

  /**
   * Disconnette l'uscita di questo effetto in modo sicuro.
   * Deve essere chiamato prima di distruggere il nodo o rimuoverlo dal graph.
   */
  public disconnect(): void {
    this.output.disconnect();
  }
}
