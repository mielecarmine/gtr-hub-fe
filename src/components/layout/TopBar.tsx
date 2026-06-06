import { Guitar, RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BackendStatus } from '@/hooks/useBackendHealth';

interface TopBarProps {
  backendStatus: BackendStatus;
  onRecheckBackend: () => void;
  onSaveClick: () => void;
  canSave: boolean;
}

export function TopBar({ backendStatus, onRecheckBackend, onSaveClick, canSave }: TopBarProps) {
  return (
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
            onClick={onRecheckBackend}
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
            onClick={onSaveClick}
            disabled={!canSave}
            className="relative overflow-hidden group/btn bg-gradient-to-r from-red-650 to-amber-600 hover:from-red-600 hover:to-amber-650 text-white font-medium border-0 shadow-lg shadow-red-650/15 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="size-4 mr-2 group-hover/btn:scale-110 transition-transform" />
            Salva Preset
          </Button>
        </div>
      </div>
    </header>
  );
}
