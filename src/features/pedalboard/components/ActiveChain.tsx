import { Volume2, Guitar } from 'lucide-react';
import type { PedalSchema, PedalParamValue } from '@/types/preset';
import { PedalCard } from './PedalCard';

interface ActiveChainProps {
  chain: PedalSchema[];
  onToggleBypass: (id: string) => void;
  onRemovePedal: (id: string) => void;
  onMovePedal: (sourceIndex: number, destinationIndex: number) => void;
  onParamChange: (id: string, paramName: string, value: PedalParamValue) => void;
}

export function ActiveChain({ chain, onToggleBypass, onRemovePedal, onMovePedal, onParamChange }: ActiveChainProps) {
  return (
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
            {chain.length} {chain.length === 1 ? 'pedale' : 'pedali'}
          </span>
        </div>

        {chain.length === 0 ? (
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
            {chain.map((pedal, index) => (
              <PedalCard
                key={pedal.id}
                pedal={pedal}
                index={index}
                isFirst={index === 0}
                isLast={index === chain.length - 1}
                onToggleBypass={onToggleBypass}
                onRemove={onRemovePedal}
                onMove={onMovePedal}
                onParamChange={onParamChange}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
