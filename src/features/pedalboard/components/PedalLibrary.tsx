import { Sparkles, Plus, AlertTriangle } from 'lucide-react';
import type { PedalType } from '@/types/preset';

interface PedalLibraryProps {
  onAddPedal: (type: PedalType) => void;
  onClearChain: () => void;
  onGenerateError: () => void;
  hasActivePedals: boolean;
}

export function PedalLibrary({ 
  onAddPedal, 
  onClearChain, 
  onGenerateError, 
  hasActivePedals 
}: PedalLibraryProps) {
  const pedalTypes: PedalType[] = ['distortion', 'delay', 'reverb', 'amplifier', 'chorus'];

  return (
    <section className="w-full lg:w-72 flex flex-col gap-6">
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Sparkles className="size-4 text-amber-500" />
          Libreria Pedali
        </h2>
        <div className="flex flex-col gap-2.5">
          {pedalTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onAddPedal(type)}
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
            onClick={onGenerateError}
            type="button"
            className="w-full py-2.5 px-3 rounded-lg border border-red-950 bg-red-950/10 hover:bg-red-950/30 text-red-400 hover:text-red-300 text-xs font-semibold tracking-wide transition-all text-center flex items-center justify-center gap-2"
            title="Genera una catena contenente un pedale non valido per simulare l'errore 422 dal server"
          >
            <AlertTriangle className="size-3.5 animate-pulse" />
            Genera Errore Validazione (Test 422)
          </button>
          
          {hasActivePedals && (
            <button
              onClick={onClearChain}
              type="button"
              className="w-full py-2 px-3 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 text-xs font-medium rounded-lg transition-colors text-center"
            >
              Svuota Pedaliera
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
