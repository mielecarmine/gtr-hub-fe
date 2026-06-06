import { useState, useEffect } from 'react';
import { usePedalStore } from './store/usePedalStore';
import type { PedalType } from './types/preset';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Trash2, 
  Save, 
  Volume2, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Guitar, 
  Loader2,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function App() {
  const {
    effectsChain,
    isSaving,
    saveError,
    saveSuccess,
    addPedal,
    removePedal,
    updatePedalParam,
    toggleBypass,
    clearChain,
    saveCurrentPreset,
    resetStatus,
    setInvalidChainForTesting,
  } = usePedalStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDesc, setPresetDesc] = useState('');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [checkTrigger, setCheckTrigger] = useState(0);

  useEffect(() => {
    let active = true;
    const checkBackend = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
        const healthUrl = apiBase.endsWith('/api/v1') 
          ? apiBase.replace('/api/v1', '/health') 
          : `${apiBase}/health`;
          
        const res = await fetch(healthUrl);
        if (active) {
          if (res.ok) {
            setBackendStatus('online');
          } else {
            setBackendStatus('offline');
          }
        }
      } catch {
        if (active) {
          setBackendStatus('offline');
        }
      }
    };

    checkBackend();

    return () => {
      active = false;
    };
  }, [checkTrigger]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetName.trim()) return;

    try {
      await saveCurrentPreset(presetName, presetDesc);
      // Pulisce il form dopo il salvataggio
      setPresetName('');
      setPresetDesc('');
      // Chiude il modal dopo 1.5 secondi per mostrare l'animazione di successo
      setTimeout(() => {
        setIsModalOpen(false);
        resetStatus();
      }, 1500);
    } catch {
      // L'errore viene catturato e gestito dallo store
    }
  };

  const getPedalColor = (type: PedalType) => {
    switch (type) {
      case 'distortion':
        return 'from-amber-650 to-red-700 border-red-500/30 shadow-red-900/10';
      case 'delay':
        return 'from-teal-650 to-emerald-700 border-teal-500/30 shadow-teal-900/10';
      case 'reverb':
        return 'from-indigo-655 to-violet-700 border-indigo-500/30 shadow-indigo-900/10';
      case 'amplifier':
        return 'from-zinc-700 to-slate-800 border-zinc-600/30 shadow-zinc-900/10';
      case 'chorus':
        return 'from-pink-650 to-purple-700 border-pink-500/30 shadow-pink-900/10';
      default:
        return 'from-zinc-600 to-zinc-700 border-zinc-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-red-500/30 selection:text-red-200">
      {/* TopBar */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#09090b]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-red-650 to-amber-500 rounded-xl shadow-lg shadow-red-500/10">
              <Guitar className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
                GTR Hub <span className="text-xs text-red-500 font-mono font-medium tracking-normal px-2 py-0.5 border border-red-500/20 rounded bg-red-950/20 ml-2">Sprint 4</span>
              </h1>
              <p className="text-[10px] text-zinc-500">Pedalboard Preset Manager</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => { setBackendStatus('checking'); setCheckTrigger((prev) => prev + 1); }}
              type="button"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-zinc-800 hover:border-zinc-700 transition-colors text-xs text-zinc-400 bg-zinc-900/50"
              title="Riavvia controllo server"
            >
              {backendStatus === 'checking' && (
                <>
                  <RefreshCw className="size-3 animate-spin text-amber-500" />
                  <span>Checking BE...</span>
                </>
              )}
              {backendStatus === 'online' && (
                <>
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>BE Online</span>
                </>
              )}
              {backendStatus === 'offline' && (
                <>
                  <span className="size-2 rounded-full bg-red-500 animate-pulse" />
                  <span>BE Offline</span>
                </>
              )}
            </button>

            <Button 
              onClick={() => { resetStatus(); setIsModalOpen(true); }}
              disabled={effectsChain.length === 0}
              className="relative overflow-hidden group/btn bg-gradient-to-r from-red-650 to-amber-600 hover:from-red-600 hover:to-amber-650 text-white font-medium border-0 shadow-lg shadow-red-650/15 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save className="size-4 mr-2 group-hover/btn:scale-110 transition-transform" />
              Salva Preset
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Panel - Pedal Addition */}
        <section className="w-full lg:w-72 flex flex-col gap-6">
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="size-4 text-amber-500" />
              Libreria Pedali
            </h2>
            <div className="flex flex-col gap-2.5">
              {(['distortion', 'delay', 'reverb', 'amplifier', 'chorus'] as PedalType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => addPedal(type)}
                  className="w-full text-left px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900/60 hover:border-zinc-700/80 transition-all duration-200 group flex items-center justify-between"
                >
                  <span className="capitalize text-zinc-300 group-hover:text-white font-medium flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-zinc-700 group-hover:bg-red-500 transition-colors" />
                    {type}
                  </span>
                  <Plus className="size-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                </button>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-zinc-800/80 flex flex-col gap-2">
              <button
                onClick={setInvalidChainForTesting}
                type="button"
                className="w-full py-2.5 px-3 rounded-lg border border-red-950 bg-red-950/10 hover:bg-red-950/30 text-red-400 hover:text-red-300 text-xs font-semibold tracking-wide transition-all text-center flex items-center justify-center gap-2"
                title="Genera una catena contenente un pedale non valido per simulare l'errore 422 dal server"
              >
                <AlertTriangle className="size-3.5 animate-pulse" />
                Genera Errore Validazione (Test 422)
              </button>
              
              {effectsChain.length > 0 && (
                <button
                  onClick={clearChain}
                  type="button"
                  className="w-full py-2 px-3 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 text-xs font-medium rounded-lg transition-colors text-center"
                >
                  Svuota Pedaliera
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Central Panel - Active Chain */}
        <section className="flex-1 flex flex-col gap-6">
          <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-2xl p-6 min-h-[400px] flex flex-col backdrop-blur-sm relative overflow-hidden">
            {/* Background glowing effects */}
            <div className="absolute top-10 left-10 size-48 bg-red-650/5 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 size-48 bg-amber-500/5 rounded-full blur-3xl" />

            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4 mb-6 z-10">
              <div>
                <h2 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
                  <Volume2 className="size-5 text-red-500" />
                  La Tua Pedaliera
                </h2>
                <p className="text-xs text-zinc-500">I pedali vengono elaborati nell'ordine visualizzato (da sinistra a destra)</p>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                {effectsChain.length} {effectsChain.length === 1 ? 'pedale' : 'pedali'}
              </span>
            </div>

            {effectsChain.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 z-10">
                <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 mb-4 text-zinc-650">
                  <Guitar className="size-12 animate-pulse" />
                </div>
                <h3 className="text-zinc-300 font-semibold mb-1">Nessun pedale attivo</h3>
                <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                  Aggiungi effetti dalla libreria a sinistra per iniziare a plasmare il tuo suono chitarristico.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 z-10">
                {effectsChain.map((pedal, index) => (
                  <div
                    key={pedal.id}
                    className={`relative rounded-xl border bg-zinc-950/80 p-5 flex flex-col justify-between transition-all duration-300 shadow-xl bg-gradient-to-tr ${
                      pedal.bypass ? 'opacity-40 grayscale-[40%]' : ''
                    } ${getPedalColor(pedal.type)}`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono text-zinc-200 bg-black/20 px-1.5 py-0.5 rounded">#{index}</span>
                          <h4 className="font-bold text-zinc-100 capitalize">{pedal.type}</h4>
                        </div>
                        <span className="text-[10px] text-zinc-300/60 font-mono block mt-1">{pedal.id}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Bypass button */}
                        <button
                          onClick={() => toggleBypass(pedal.id)}
                          type="button"
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider transition-colors ${
                            pedal.bypass 
                              ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-750' 
                              : 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-950/60'
                          }`}
                        >
                          {pedal.bypass ? 'BYPASS' : 'ACTIVE'}
                        </button>
                        
                        {/* Delete button */}
                        <button
                          onClick={() => removePedal(pedal.id)}
                          type="button"
                          className="p-1 rounded bg-black/20 border border-transparent text-zinc-300 hover:text-red-400 hover:bg-black/40 transition-colors"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Parameters Controls */}
                    <div className="flex flex-col gap-3">
                      {Object.entries(pedal.params).map(([paramName, val]) => (
                        <div key={paramName} className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-300 font-medium capitalize">{paramName}</span>
                            <span className="text-zinc-100 font-mono">
                              {typeof val === 'boolean' ? (val ? 'ON' : 'OFF') : val}
                            </span>
                          </div>
                          
                          {typeof val === 'number' ? (
                            <input
                              type="range"
                              min={paramName === 'time' ? 10 : 0}
                              max={paramName === 'time' ? 1000 : 10}
                              step={paramName === 'time' ? 10 : 0.1}
                              value={val}
                              onChange={(e) => updatePedalParam(pedal.id, paramName, parseFloat(e.target.value))}
                              className="w-full h-1 bg-black/25 rounded-lg appearance-none cursor-pointer accent-white focus:outline-none"
                            />
                          ) : typeof val === 'boolean' ? (
                            <button
                              onClick={() => updatePedalParam(pedal.id, paramName, !val)}
                              type="button"
                              className={`w-full py-1 text-center text-xs font-semibold rounded ${
                                val 
                                  ? 'bg-white/20 text-white border border-white/20' 
                                  : 'bg-black/20 text-zinc-400'
                              }`}
                            >
                              {val ? 'Enabled' : 'Disabled'}
                            </button>
                          ) : (
                            <input
                              type="text"
                              value={String(val)}
                              onChange={(e) => updatePedalParam(pedal.id, paramName, e.target.value)}
                              className="w-full bg-black/20 border border-transparent px-2 py-1 rounded text-xs text-zinc-100 font-mono focus:outline-none focus:border-white/20"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Save Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl animate-zoom-in">
            {/* Close Button */}
            <button
              onClick={() => { setIsModalOpen(false); resetStatus(); }}
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
              <form onSubmit={handleSave} className="flex flex-col gap-4">
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
                    onClick={() => { setIsModalOpen(false); resetStatus(); }}
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
      )}
    </div>
  );
}