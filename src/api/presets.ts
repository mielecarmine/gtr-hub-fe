import type { PresetCreate, PresetOut } from '../types/preset';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface ValidationErrorDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

interface FastAPIErrorResponse {
  detail: string | ValidationErrorDetail[];
}

/**
 * Invia un nuovo preset al backend FastAPI per la validazione e il salvataggio.
 * Gestisce l'errore 422 in caso di payload malformato.
 */
export async function createPreset(preset: PresetCreate): Promise<PresetOut> {
  const response = await fetch(`${API_URL}/presets/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preset),
  });

  if (!response.ok) {
    let errorData: FastAPIErrorResponse | null = null;
    try {
      errorData = await response.json() as FastAPIErrorResponse;
    } catch {
      // Nessun JSON da decodificare
    }

    // Gestione dettagliata degli errori (es: FastAPI 422 ValidationError o DB 400 Bad Request)
    let errorMessage = 'Errore imprevisto durante il salvataggio del preset';
    if (errorData) {
      if (Array.isArray(errorData.detail)) {
        // FastAPI 422 ValidationError format
        errorMessage = errorData.detail
          .map((err: ValidationErrorDetail) => `${err.loc.join('.')}: ${err.msg}`)
          .join(', ');
      } else if (typeof errorData.detail === 'string') {
        errorMessage = errorData.detail;
      }
    }

    throw {
      status: response.status,
      message: errorMessage,
      data: errorData,
    };
  }

  return response.json();
}
