import Dexie, { type Table } from 'dexie';
import type { PedalSchema } from '../types/preset';

export interface LocalPreset {
  client_id: string; // Primary Key
  name: string;
  description: string | null;
  effects_chain: PedalSchema[];
  sync_status: 'pending' | 'synced' | 'failed';
  remote_id: number | null;
  user_id: number;
  created_at: string;
}

export class AppDatabase extends Dexie {
  presets!: Table<LocalPreset, string>; // client_id è la chiave primaria stringa (UUID)

  constructor() {
    super('GtrHubDatabase');
    this.version(1).stores({
      presets: 'client_id, user_id, sync_status', // campi indicizzati
    });
  }
}

export const db = new AppDatabase();
