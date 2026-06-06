import type { PresetCreate, PresetOut } from '../types/preset';
import { apiClient } from './client';
import axios from 'axios';
import { db } from '../lib/db';
import { useAuthStore } from '../store/useAuthStore';

interface ValidationErrorDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export async function createPreset(preset: PresetCreate): Promise<PresetOut> {
  try {
    const response = await apiClient.post<PresetOut>('/presets/', preset);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const errorData = error.response.data;
      let errorMessage = 'Errore imprevisto durante il salvataggio del preset';
      
      if (errorData?.detail) {
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail
            .map((err: ValidationErrorDetail) => `${err.loc.join('.')}: ${err.msg}`)
            .join(', ');
        } else if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        }
      }
      
      throw {
        status: error.response.status,
        message: errorMessage,
        data: errorData,
      };
    }
    throw error;
  }
}

export async function deletePresetRemote(id: number): Promise<void> {
  try {
    await apiClient.delete(`/presets/${id}`);
  } catch (error) {
    console.error('Errore durante la cancellazione remota:', error);
    throw error;
  }
}

/**
 * Sincronizza i preset locali con stato 'pending' verso il server.
 */
export async function syncPendingPresets(): Promise<void> {
  const user = useAuthStore.getState().user;
  if (!user) return;

  const pending = await db.presets
    .where({ user_id: user.id, sync_status: 'pending' })
    .toArray();

  if (pending.length === 0) return;

  let hasChanges = false;

  for (const preset of pending) {
    try {
      const response = await createPreset({
        name: preset.name,
        description: preset.description,
        effects_chain: preset.effects_chain,
        client_id: preset.client_id,
      });

      await db.presets.update(preset.client_id, {
        sync_status: 'synced',
        remote_id: response.id,
      });
      hasChanges = true;
    } catch (error: any) {
      console.error(`Sincronizzazione fallita per il preset ${preset.client_id}:`, error);
      if (error?.status === 422) {
        await db.presets.update(preset.client_id, {
          sync_status: 'failed',
        });
        hasChanges = true;
      }
    }
  }

  if (hasChanges) {
    const store = await import('../store/usePedalStore');
    await store.usePedalStore.getState().loadPresets();
  }
}

/**
 * Sincronizza i preset del server all'interno del DB locale (IndexedDB).
 * Chiamato tipicamente all'avvio del frontend o dopo il login.
 */
export async function syncRemotePresetsToLocal(): Promise<void> {
  const user = useAuthStore.getState().user;
  if (!user) return;

  try {
    const response = await apiClient.get<PresetOut[]>('/presets/');
    const remotePresets = response.data;

    for (const remote of remotePresets) {
      const client_id = remote.client_id || crypto.randomUUID();
      const existing = await db.presets.get(client_id);
      
      if (!existing) {
        await db.presets.add({
          client_id,
          name: remote.name,
          description: remote.description,
          effects_chain: remote.effects_chain,
          sync_status: 'synced',
          remote_id: remote.id,
          user_id: user.id,
          created_at: remote.created_at || new Date().toISOString(),
        });
      } else if (existing.sync_status === 'synced' && existing.remote_id !== remote.id) {
        await db.presets.update(client_id, {
          remote_id: remote.id,
        });
      }
    }

    const store = await import('../store/usePedalStore');
    await store.usePedalStore.getState().loadPresets();
  } catch (error) {
    console.error('Errore durante il sync da remoto a locale:', error);
  }
}
