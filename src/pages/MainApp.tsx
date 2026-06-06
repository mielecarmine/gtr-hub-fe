import { useEffect, useState } from "react";
import { usePedalStore } from "../store/usePedalStore";
import { useBackendHealth } from "../hooks/useBackendHealth";
import { syncPendingPresets, syncRemotePresetsToLocal } from "../api/presets";
import { TopBar } from "../components/layout/TopBar";
import { PedalLibrary } from "../features/pedalboard/components/PedalLibrary";
import { PresetsList } from "../features/pedalboard/components/PresetsList";
import { ActiveChain } from "../features/pedalboard/components/ActiveChain";
import { SavePresetModal } from "../features/pedalboard/components/SavePresetModal";


export function MainApp() {
    const {
        effectsChain,
        isSaving,
        saveError,
        saveSuccess,
        addPedal,
        removePedal,
        movePedal,
        updatePedalParam,
        toggleBypass,
        clearChain,
        saveCurrentPreset,
        resetStatus,
        setInvalidChainForTesting,
        loadPresets,
    } = usePedalStore();

    const { status: backendStatus, recheck: recheckBackend } = useBackendHealth();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Carica i preset all'avvio e sincronizza da remoto verso locale
    useEffect(() => {
        void loadPresets();
        void syncRemotePresetsToLocal();
    }, [loadPresets]);

    // Esegue il sync in background dei preset pending non appena il backend torna online
    useEffect(() => {
        if (backendStatus === 'online') {
            void syncPendingPresets();
        }
    }, [backendStatus]);

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
                <div className="w-full lg:w-72 flex flex-col gap-6 shrink-0">
                    <PedalLibrary
                        onAddPedal={addPedal}
                        onClearChain={clearChain}
                        onGenerateError={setInvalidChainForTesting}
                        hasActivePedals={effectsChain.length > 0}
                    />
                    <PresetsList />
                </div>
                <ActiveChain
                    chain={effectsChain}
                    onToggleBypass={toggleBypass}
                    onRemovePedal={removePedal}
                    onMovePedal={movePedal}
                    onParamChange={updatePedalParam}
                />
            </main>

            <SavePresetModal
                key={isModalOpen ? 'open' : 'closed'}
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