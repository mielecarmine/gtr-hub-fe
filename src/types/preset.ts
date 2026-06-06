export type PedalType = 'distortion' | 'delay' | 'reverb' | 'amplifier' | 'chorus';

export type PedalParamValue = number | boolean | string;

export interface PedalSchema {
  id: string;
  type: PedalType;
  order_index: number;
  bypass: boolean;
  params: Record<string, PedalParamValue>;
}

export interface PresetCreate {
  name: string;
  description?: string | null;
  effects_chain: PedalSchema[];
  client_id?: string | null;
}

export interface PresetOut {
  id: number;
  name: string;
  description: string | null;
  effects_chain: PedalSchema[];
  user_id: number;
  created_at: string;
  client_id?: string | null;
}
