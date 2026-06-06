import { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SavePresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => Promise<void>;
  isSaving: boolean;
  saveSuccess: boolean;
  saveError: string | null;
}

export function SavePresetModal({
  isOpen,
  onClose,
  onSave,
  isSaving,
  saveSuccess,
  saveError
}: SavePresetModalProps) {
  const [presetName, setPresetName] = useState('');
  const [presetDesc, setPresetDesc] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setPresetName('');
      setPresetDesc('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetName.trim()) return;
    await onSave(presetName, presetDesc);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl animate-zoom-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-1 rounded-full text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          <X className="size-5" />
        </button>

        {saveSuccess ? (
          <div className="py-6 flex flex-col items-center justify-center text-center">
            <div className="p-3 bg-emerald-950/50 rounded-full border border-emerald-500/20 mb-4 animate-bounce">
              <CheckCircle2 className="size-10 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-zinc-100">Preset Salvato!</h3>
            <p className="text-xs text-zinc-400 mt-2 max-w-xs">
              La configurazione attuale è stata scritta con successo nel database SQLite.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Save className="size-5 text-red-500" />
                Salva Configurazione
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Crea un nuovo preset memorizzando l'ordine e i parametri correnti dei pedali.
              </p>
            </div>

            <div className="flex flex-col gap-1.5 mt-2">
              <label htmlFor="pname" className="text-xs text-zinc-400 font-medium">Nome Preset *</label>
              <input
                id="pname"
                type="text"
                required
                placeholder="Esempio: Crunch Blues, Lead Metal"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                maxLength={50}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
              />
              <div className="flex justify-end">
                <span className="text-[10px] text-zinc-600 font-mono">{presetName.length}/50</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="pdesc" className="text-xs text-zinc-400 font-medium">Descrizione (Opzionale)</label>
              <textarea
                id="pdesc"
                rows={3}
                placeholder="Descrivi brevemente lo scopo o le regolazioni di questo preset..."
                value={presetDesc}
                onChange={(e) => setPresetDesc(e.target.value)}
                maxLength={512}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all resize-none"
              />
              <div className="flex justify-end">
                <span className="text-[10px] text-zinc-600 font-mono">{presetDesc.length}/512</span>
              </div>
            </div>

            {/* Error Banner */}
            {saveError && (
              <div className="flex gap-2.5 p-3 rounded-lg border border-red-950 bg-red-950/20 text-red-400 text-xs items-start leading-normal">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Impossibile salvare il preset</span>
                  <span>{saveError}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-zinc-800/80">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSaving}
              >
                Annulla
              </Button>
              
              <Button
                type="submit"
                disabled={isSaving || !presetName.trim()}
                className="bg-gradient-to-r from-red-650 to-amber-600 hover:from-red-600 hover:to-amber-650 text-white font-medium px-4 shadow-lg shadow-red-600/10"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  'Conferma Salva'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
