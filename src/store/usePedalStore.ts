import { create } from 'zustand';
import type { PedalSchema, PedalType, PedalParamValue, PresetCreate } from '../types/preset';
import { createPreset } from '../api/presets';

interface PedalStoreState {
  effectsChain: PedalSchema[];
  isSaving: boolean;
  saveError: string | null;
  saveSuccess: boolean;
  
  // Actions
  addPedal: (type: PedalType) => void;
  removePedal: (id: string) => void;
  updatePedalParam: (id: string, key: string, value: PedalParamValue) => void;
  toggleBypass: (id: string) => void;
  clearChain: () => void;
  saveCurrentPreset: (name: string, description?: string) => Promise<void>;
  resetStatus: () => void;
  
  // Metodo helper di test per inserire volutamente un payload non valido
  setInvalidChainForTesting: () => void;
}

// Parametri di default per i pedali
const DEFAULT_PARAMS: Record<PedalType, Record<string, PedalParamValue>> = {
  distortion: { gain: 5.0, tone: 5.0, level: 7.0 },
  delay: { time: 350, feedback: 40, mix: 30 },
  reverb: { decay: 2.5, mix: 20, tone: 5.0 },
  amplifier: { gain: 3.0, bass: 5.0, middle: 5.0, treble: 5.0 },
  chorus: { rate: 1.5, depth: 50, mix: 40 },
};

export const usePedalStore = create<PedalStoreState>((set, get) => ({
  effectsChain: [],
  isSaving: false,
  saveError: null,
  saveSuccess: false,

  addPedal: (type) => {
    const chain = get().effectsChain;
    const newPedal: PedalSchema = {
      id: `${type}-${Date.now()}`,
      type,
      order_index: chain.length,
      bypass: false,
      params: { ...DEFAULT_PARAMS[type] },
    };
    set({ effectsChain: [...chain, newPedal], saveSuccess: false, saveError: null });
  },

  removePedal: (id) => {
    const chain = get().effectsChain;
    const filtered = chain.filter((pedal) => pedal.id !== id);
    // Riorganizza order_index per mantenerlo sequenziale
    const reindexed = filtered.map((pedal, index) => ({
      ...pedal,
      order_index: index,
    }));
    set({ effectsChain: reindexed, saveSuccess: false, saveError: null });
  },

  updatePedalParam: (id, key, value) => {
    const chain = get().effectsChain;
    const updated = chain.map((pedal) => {
      if (pedal.id === id) {
        return {
          ...pedal,
          params: {
            ...pedal.params,
            [key]: value,
          },
        };
      }
      return pedal;
    });
    set({ effectsChain: updated });
  },

  toggleBypass: (id) => {
    const chain = get().effectsChain;
    const updated = chain.map((pedal) => {
      if (pedal.id === id) {
        return {
          ...pedal,
          bypass: !pedal.bypass,
        };
      }
      return pedal;
    });
    set({ effectsChain: updated });
  },

  clearChain: () => set({ effectsChain: [], saveSuccess: false, saveError: null }),

  resetStatus: () => set({ saveError: null, saveSuccess: false }),

  setInvalidChainForTesting: () => {
    // Forza un pedale non valido per simulare l'errore 422 dal backend (es: tipo pedale non esistente 'flanger')
    const invalidPedal = {
      id: 'invalid-pedal',
      type: 'flanger' as unknown as PedalType, // Tipo non ammesso dal Literal del BE
      order_index: 0,
      bypass: false,
      params: { depth: { nested: 'not allowed' } as unknown as PedalParamValue } // Struttura annidata non consentita
    };
    set({ effectsChain: [invalidPedal], saveSuccess: false, saveError: null });
  },

  saveCurrentPreset: async (name: string, description?: string) => {
    if (get().isSaving) return;

    set({ isSaving: true, saveError: null, saveSuccess: false });

    try {
      const preset: PresetCreate = {
        name,
        description: description || null,
        effects_chain: get().effectsChain,
      };

      await createPreset(preset);

      set({ isSaving: false, saveSuccess: true });
    } catch (err: unknown) {
      const error = err as { message?: string };
      set({
        isSaving: false,
        saveError: error.message || 'Si è verificato un errore durante la connessione al server',
      });
      throw err;
    }
  },
}));
