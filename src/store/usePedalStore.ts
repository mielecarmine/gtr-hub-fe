import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
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
  addPedal: (type: PedalType, insertAt?: number) => void;
  removePedal: (id: string) => void;
  movePedal: (sourceIndex: number, destinationIndex: number) => void;
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

export const usePedalStore = create<PedalStoreState>()(
  devtools(
    (set, get) => ({
  effectsChain: [],
  isSaving: false,
  saveError: null,
  saveSuccess: false,

  addPedal: (type, insertAt) => {
    const chain = get().effectsChain;
    const newPedal: PedalSchema = {
      id: `${type}-${Date.now()}`,
      type,
      order_index: 0,
      bypass: false,
      params: { ...DEFAULT_PARAMS[type] },
    };

    const newChain = [...chain];
    if (insertAt !== undefined && insertAt >= 0 && insertAt <= newChain.length) {
      newChain.splice(insertAt, 0, newPedal);
    } else {
      newChain.push(newPedal);
    }

    const reindexed = newChain.map((pedal, index) => ({
      ...pedal,
      order_index: index,
    }));

    set({ effectsChain: reindexed, saveSuccess: false, saveError: null }, false, 'pedal/addPedal');
  },

  removePedal: (id) => {
    const chain = get().effectsChain;
    const filtered = chain.filter((pedal) => pedal.id !== id);
    // Riorganizza order_index per mantenerlo sequenziale
    const reindexed = filtered.map((pedal, index) => ({
      ...pedal,
      order_index: index,
    }));
    set({ effectsChain: reindexed, saveSuccess: false, saveError: null }, false, 'pedal/removePedal');
  },

  movePedal: (sourceIndex, destinationIndex) => {
    const chain = get().effectsChain;
    if (
      sourceIndex < 0 || sourceIndex >= chain.length ||
      destinationIndex < 0 || destinationIndex >= chain.length ||
      sourceIndex === destinationIndex
    ) {
      return;
    }

    const newChain = [...chain];
    const [movedPedal] = newChain.splice(sourceIndex, 1);
    newChain.splice(destinationIndex, 0, movedPedal);

    const reindexed = newChain.map((pedal, index) => ({
      ...pedal,
      order_index: index,
    }));

    set({ effectsChain: reindexed }, false, 'pedal/movePedal');
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
    set({ effectsChain: updated }, false, 'pedal/updatePedalParam');
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
    set({ effectsChain: updated }, false, 'pedal/toggleBypass');
  },

  clearChain: () => set({ effectsChain: [], saveSuccess: false, saveError: null }, false, 'pedal/clearChain'),

  resetStatus: () => set({ saveError: null, saveSuccess: false }, false, 'pedal/resetStatus'),

  setInvalidChainForTesting: () => {
    // Forza un pedale non valido per simulare l'errore 422 dal backend (es: tipo pedale non esistente 'flanger')
    const invalidPedal = {
      id: 'invalid-pedal',
      type: 'flanger' as unknown as PedalType, // Tipo non ammesso dal Literal del BE
      order_index: 0,
      bypass: false,
      params: { depth: { nested: 'not allowed' } as unknown as PedalParamValue } // Struttura annidata non consentita
    };
    set({ effectsChain: [invalidPedal], saveSuccess: false, saveError: null }, false, 'pedal/setInvalidChainForTesting');
  },

  presets: [],
  isLoadingPresets: false,

  loadPresets: async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ presets: [] }, false, 'pedal/loadPresets/clear');
      return;
    }
    set({ isLoadingPresets: true }, false, 'pedal/loadPresets/start');
    try {
      const presets = await db.presets.where('user_id').equals(user.id).reverse().toArray();
      set({ presets, isLoadingPresets: false }, false, 'pedal/loadPresets/success');
    } catch (err) {
      console.error('Failed to load local presets:', err);
      set({ isLoadingPresets: false }, false, 'pedal/loadPresets/error');
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
      set({ effectsChain: [...preset.effects_chain], saveSuccess: false, saveError: null }, false, 'pedal/loadPresetToChain');
    }
  },

  saveCurrentPreset: async (name: string, description?: string) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ saveError: 'Utente non autenticato' }, false, 'pedal/saveCurrentPreset/unauth');
      return;
    }

    if (get().isSaving) return;

    set({ isSaving: true, saveError: null, saveSuccess: false }, false, 'pedal/saveCurrentPreset/start');

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

      set({ isSaving: false, saveSuccess: true }, false, 'pedal/saveCurrentPreset/success');

      // 3. Esegui la sincronizzazione in background (senza bloccare la UI)
      void syncPendingPresets();
    } catch (err: unknown) {
      const error = err as { message?: string };
      set({
        isSaving: false,
        saveError: error.message || 'Si è verificato un errore durante il salvataggio locale',
      }, false, 'pedal/saveCurrentPreset/error');
      throw err;
    }
  },
  }),
  { name: 'PedalStore' }
)
);
