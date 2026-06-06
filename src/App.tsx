import { useState } from 'react';
import { usePedalStore } from './store/usePedalStore';
import { useBackendHealth } from './hooks/useBackendHealth';
import { TopBar } from './components/layout/TopBar';
import { PedalLibrary } from './features/pedalboard/components/PedalLibrary';
import { ActiveChain } from './features/pedalboard/components/ActiveChain';
import { SavePresetModal } from './features/pedalboard/components/SavePresetModal';

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

  const { status: backendStatus, recheck: recheckBackend } = useBackendHealth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveModalOpen = () => {
    resetStatus();
    setIsModalOpen(true);
  };

  const handleSavePreset = async (name: string, description: string) => {
    try {
      await saveCurrentPreset(name, description);
      // Chiude il modal dopo 1.5 secondi per mostrare l'animazione di successo
      setTimeout(() => {
        setIsModalOpen(false);
        resetStatus();
      }, 1500);
    } catch {
      // L'errore viene catturato e gestito dallo store
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    resetStatus();
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-red-500/30 selection:text-red-200">
      <TopBar 
        backendStatus={backendStatus} 
        onRecheckBackend={recheckBackend} 
        onSaveClick={handleSaveModalOpen}
        canSave={effectsChain.length > 0} 
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        <PedalLibrary 
          onAddPedal={addPedal}
          onClearChain={clearChain}
          onGenerateError={setInvalidChainForTesting}
          hasActivePedals={effectsChain.length > 0}
        />
        <ActiveChain 
          chain={effectsChain}
          onToggleBypass={toggleBypass}
          onRemovePedal={removePedal}
          onParamChange={updatePedalParam}
        />
      </main>

      <SavePresetModal 
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleSavePreset}
        isSaving={isSaving}
        saveSuccess={saveSuccess}
        saveError={saveError}
      />
    </div>
  );
}