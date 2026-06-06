import { create } from 'zustand';
import type { PedalSchema, PedalType, PedalParamValue } from '../types/preset';
import { db, type LocalPreset } from '../lib/db';
import { useAuthStore } from './useAuthStore';
import { deletePresetRemote, syncPendingPresets } from '../api/presets';

interface PedalStoreState {
  effectsChain: PedalSchema[];
  isSaving: boolean;
  saveError: string | null;
  saveSuccess: boolean;
  
  // Offline-First Presets state
  presets: LocalPreset[];
  isLoadingPresets: boolean;
  
  // Actions
  addPedal: (type: PedalType) => void;
  removePedal: (id: string) => void;
  updatePedalParam: (id: string, key: string, value: PedalParamValue) => void;
  toggleBypass: (id: string) => void;
  clearChain: () => void;
  saveCurrentPreset: (name: string, description?: string) => Promise<void>;
  resetStatus: () => void;
  
  // Offline-First Preset actions
  loadPresets: () => Promise<void>;
  deletePreset: (clientId: string) => Promise<void>;
  loadPresetToChain: (clientId: string) => void;
  
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

  presets: [],
  isLoadingPresets: false,

  loadPresets: async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ presets: [] });
      return;
    }
    set({ isLoadingPresets: true });
    try {
      const presets = await db.presets.where('user_id').equals(user.id).reverse().toArray();
      set({ presets, isLoadingPresets: false });
    } catch (err) {
      console.error('Failed to load local presets:', err);
      set({ isLoadingPresets: false });
    }
  },

  deletePreset: async (clientId) => {
    const preset = await db.presets.get(clientId);
    if (!preset) return;

    // Cancella localmente
    await db.presets.delete(clientId);
    
    // Aggiorna lo store
    await get().loadPresets();

    // Se sincronizzato ed online, prova a cancellare da remoto in background
    if (preset.sync_status === 'synced' && preset.remote_id) {
      try {
        await deletePresetRemote(preset.remote_id);
      } catch (err) {
        console.error('Failed to delete remote preset:', err);
      }
    }
  },

  loadPresetToChain: (clientId) => {
    const preset = get().presets.find((p) => p.client_id === clientId);
    if (preset) {
      set({ effectsChain: [...preset.effects_chain], saveSuccess: false, saveError: null });
    }
  },

  saveCurrentPreset: async (name: string, description?: string) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ saveError: 'Utente non autenticato' });
      return;
    }

    if (get().isSaving) return;

    set({ isSaving: true, saveError: null, saveSuccess: false });

    try {
      const client_id = crypto.randomUUID();
      const newPreset: LocalPreset = {
        client_id,
        name,
        description: description || null,
        effects_chain: get().effectsChain,
        sync_status: 'pending',
        remote_id: null,
        user_id: user.id,
        created_at: new Date().toISOString(),
      };

      // 1. Salva nel DB locale (IndexedDB)
      await db.presets.add(newPreset);

      // 2. Aggiorna lo stato in Zustand immediatamente per visualizzazione istantanea
      await get().loadPresets();

      set({ isSaving: false, saveSuccess: true });

      // 3. Esegui la sincronizzazione in background (senza bloccare la UI)
      void syncPendingPresets();
    } catch (err: unknown) {
      const error = err as { message?: string };
      set({
        isSaving: false,
        saveError: error.message || 'Si è verificato un errore durante il salvataggio locale',
      });
      throw err;
    }
  },
}));
