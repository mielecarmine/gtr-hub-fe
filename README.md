# Simulatore di Amplificatore e Effetti per Chitarra

Un Simulatore di Amplificatore e Effetti per Chitarra professionale basato sul web. L'applicazione gestisce l'audio in tempo reale con bassa latenza, consentendo di creare catene di pedali e simulazioni avanzate.

## 1. Stack Tecnologico

- **Frontend**: React + TypeScript + Vite.
- **Audio Engine**: Web Audio API (nativo).
- **State Management**: Zustand (utilizzato sia per la UI che per sincronizzare i parametri audio fuori dal ciclo di render di React).
- **Styling**: Tailwind CSS + Shadcn/UI.
- **Interazioni**: `@dnd-kit` (per il riordinamento dei pedali) e Framer Motion.

## 2. Architettura del Progetto

Il progetto segue una separazione netta tra UI e Audio Engine:

- `src/core/`: Contiene la logica audio pura in TypeScript. Ogni effetto (Distorsione, Delay, ecc.) estende una classe base `BaseEffect` e incapsula i nodi della Web Audio API.
- `src/store/`: Zustand gestisce l'array della catena dei pedali (`pedalOrder`) e i loro parametri. L'Audio Engine "ascolta" questo store per aggiornare i nodi audio senza causare re-render della UI.
- `src/features/`: Moduli che uniscono componenti React e logica specifica (es. `pedal-effects` per i componenti visuali dei pedali).
- `src/hooks/`: Hook custom per collegare i componenti React al Singleton dell'AudioEngine.

## 3. Regole di Sviluppo

- **Performance Audio**: La manipolazione dei nodi audio (`connect`/`disconnect`) deve avvenire nel core o tramite sottoscrizioni dirette a Zustand. Questo evita che lo stato di React interferisca con il thread audio durante le modifiche dei parametri.
- **Latenza**: Gli input audio devono essere configurati disattivando `echoCancellation` e `noiseSuppression` per garantire la minima latenza e preservare la qualità del segnale della chitarra.
- **Visualizzazione**: L'oscilloscopio e l'analizzatore di spettro utilizzano un `AnalyserNode` e disegnano su `<canvas>` nativo tramite `requestAnimationFrame`.
- **Clean Code e Documentazione**: Mantieni il codice pulito, fortemente tipizzato (con TypeScript) e commentato, spiegando nel dettaglio le scelte matematiche e fisiche dietro i nodi audio (es. formule usate per le curve di distorsione, calcolo dei tempi di delay, ecc.).
