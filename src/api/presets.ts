import type { PresetCreate, PresetOut } from '../types/preset';
import { apiClient } from './client';
import axios from 'axios';

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
