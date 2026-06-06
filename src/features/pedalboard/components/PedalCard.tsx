import { Trash2 } from 'lucide-react';
import type { PedalSchema, PedalType, PedalParamValue } from '@/types/preset';

interface PedalCardProps {
  pedal: PedalSchema;
  index: number;
  onToggleBypass: (id: string) => void;
  onRemove: (id: string) => void;
  onParamChange: (id: string, paramName: string, value: PedalParamValue) => void;
}

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

export function PedalCard({ pedal, index, onToggleBypass, onRemove, onParamChange }: PedalCardProps) {
  return (
    <div
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
            onClick={() => onToggleBypass(pedal.id)}
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
            onClick={() => onRemove(pedal.id)}
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
                onChange={(e) => onParamChange(pedal.id, paramName, parseFloat(e.target.value))}
                className="w-full h-1 bg-black/25 rounded-lg appearance-none cursor-pointer accent-white focus:outline-none"
              />
            ) : typeof val === 'boolean' ? (
              <button
                onClick={() => onParamChange(pedal.id, paramName, !val)}
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
                onChange={(e) => onParamChange(pedal.id, paramName, e.target.value)}
                className="w-full bg-black/20 border border-transparent px-2 py-1 rounded text-xs text-zinc-100 font-mono focus:outline-none focus:border-white/20"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
