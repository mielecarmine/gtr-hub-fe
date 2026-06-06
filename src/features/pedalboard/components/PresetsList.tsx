import { useEffect } from 'react';
import { usePedalStore } from '@/store/usePedalStore';
import { Trash2, FolderOpen, CloudLightning, Check, AlertTriangle, RefreshCw } from 'lucide-react';

export function PresetsList() {
  const { 
    presets, 
    loadPresets, 
    deletePreset, 
    loadPresetToChain, 
    isLoadingPresets 
  } = usePedalStore();

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  if (isLoadingPresets) {
    return (
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md flex flex-col items-center justify-center py-8">
        <RefreshCw className="size-6 text-zinc-500 animate-spin mb-2" />
        <span className="text-xs text-zinc-400">Caricamento preset...</span>
      </div>
    );
  }

  return (
    <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md flex-1 flex flex-col min-h-[300px]">
      <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <FolderOpen className="size-4 text-red-500" />
        I Miei Preset ({presets.length})
      </h2>

      {presets.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-800/80 rounded-xl bg-zinc-950/20">
          <p className="text-xs text-zinc-500 max-w-[180px]">
            Nessun preset salvato. Crea una pedaliera e clicca su "Salva Preset"!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 overflow-y-auto max-h-[350px] pr-1">
          {presets.map((preset) => (
            <div
              key={preset.client_id}
              className="group relative p-4 rounded-xl border border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900/40 hover:border-zinc-700/80 transition-all duration-200"
            >
              {/* Info & Title */}
              <div className="flex items-start justify-between gap-4 mb-2">
                <div 
                  onClick={() => loadPresetToChain(preset.client_id)}
                  className="cursor-pointer flex-1"
                >
                  <h4 className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">
                    {preset.name}
                  </h4>
                  {preset.description && (
                    <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
                      {preset.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Status Indicator */}
                  {preset.sync_status === 'pending' && (
                    <span 
                      className="flex items-center gap-1 text-[10px] text-amber-500 font-medium px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20"
                      title="Sincronizzazione in coda..."
                    >
                      <CloudLightning className="size-3 animate-pulse" />
                      <span>In coda</span>
                    </span>
                  )}
                  {preset.sync_status === 'synced' && (
                    <span 
                      className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20"
                      title="Sincronizzato sul Cloud"
                    >
                      <Check className="size-3" />
                      <span>Sincronizzato</span>
                    </span>
                  )}
                  {preset.sync_status === 'failed' && (
                    <span 
                      className="flex items-center gap-1 text-[10px] text-red-400 font-medium px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20"
                      title="Validazione fallita (422) o Errore. Controlla la catena."
                    >
                      <AlertTriangle className="size-3" />
                      <span>Errore</span>
                    </span>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => deletePreset(preset.client_id)}
                    type="button"
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/5 transition-all"
                    title="Elimina preset"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Chain preview */}
              <div 
                onClick={() => loadPresetToChain(preset.client_id)}
                className="cursor-pointer mt-2.5 pt-2.5 border-t border-zinc-900 flex flex-wrap gap-1 items-center"
              >
                {preset.effects_chain.length === 0 ? (
                  <span className="text-[10px] text-zinc-600 font-mono">Bypass Totale</span>
                ) : (
                  preset.effects_chain.map((pedal, idx) => (
                    <div key={pedal.id} className="flex items-center">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md font-mono bg-zinc-900 text-zinc-400 capitalize border border-zinc-800/50">
                        {pedal.type}
                      </span>
                      {idx < preset.effects_chain.length - 1 && (
                        <span className="text-[10px] text-zinc-700 mx-1 font-mono">→</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
