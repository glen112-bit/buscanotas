import { useState } from 'react';
import { AudioInputProcessor } from '../../components/AudioInputProcessor';
import { GuitarFretboard } from '../../components/GuitarFretboard';
import { GuitarChord } from '../../components/GuitarChord';
import { GUITAR_CHORDS } from '../../constants/chords'; 

export const Dashboard = () => {
  const [currentData, setCurrentData] = useState({ note: "---", voice: "Esperando..." });
  const [isPlaying, setIsPlaying] = useState(false);
  const [chordType, setChordType] = useState(""); 
  const [stems, setStems] = useState<any>(null);
  const [volumes, setVolumes] = useState<any>({});
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [detectedNote, setDetectedNote] = useState<string | null>(null);

  const handleMixerChange = (track: string, value: number) => {
    setVolumes(prev => ({ ...prev, [track]: value }));
  };

  const chordTypes = ["", "m", "7", "maj7", "9", "dim", "aug"];

  // FUNCIÓN DE LIMPIEZA SEGURA
  const getChordData = (note: string | undefined, type: string) => {
    if (!note || note === "---") return null;

    // 1. Limpiamos la tónica (C4 -> C)
    const root = note.replace(/[0-9]/g, '').trim();

    // 2. Construimos la búsqueda (Ej: "C" + "m" = "Cm")
    // Si el tipo es vacío (MAJOR), la llave es solo "C"
    const fullKey = type ? `${root}${type}` : root; 

    console.log("Buscando acorde:", fullKey); // Mira tu consola (F12) para ver qué intenta buscar

    // 3. Verificamos si existe en tu archivo de constantes
    if (GUITAR_CHORDS[fullKey]) {
      return fullKey;
    }

    // Fallback: Si no existe "Cmaj7", al menos muestra "C"
    if (GUITAR_CHORDS[root]) {
      return root;
    }

    return null;
  };
  const chordToRender = getChordData(currentData?.note, chordType);
  const displayNote = currentData?.note?.replace(/[0-9]/g, '') || "---";
  // Cuando la API termine:
  const onUploadSuccess = (data: any) => {
    setStems(data.files); // Guardamos las URLs
    // Inicializamos volúmenes al 80%
    const initialVols = {};
    Object.keys(data.files).forEach(k => initialVols[k] = 0.8);
    setVolumes(initialVols);
  };
  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-300 p-4 md:p-8 font-sans flex justify-center">
      <div className="w-full max-w-4xl space-y-6">

        {/* HEADER */}
        <header className="bg-[#161b22] border border-white/5 p-6 rounded-[2rem] flex justify-between items-center shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <span className="text-black font-black text-xl italic">G</span>
            </div>
            <h1 className="text-xl font-black text-white tracking-tighter uppercase">
              BuscaNota <span className="text-cyan-400 font-light">PRO</span>
            </h1>
          </div>
        </header>

        {/* INPUT ENGINE */}
        <section className="bg-[#161b22] rounded-[2.5rem] border border-white/5 p-2 shadow-xl">
          <div className="p-4 border-b border-white/5 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'}`} />
            <h2 className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Input Engine</h2>
          </div>
          <AudioInputProcessor 
            stems={stems} 
            onNoteDetected={setDetectedNote}
            onPlayStateChange={setIsPlaying}
          />
        </section>

        {/* MONITOR PRINCIPAL MODIFICADO */}
        <section className="bg-[#161b22] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
          <div className="p-10 flex flex-col items-center">

            {/* NOTA GRANDE */}
            <div className="mb-10 text-center">
              <p className="text-[10px] font-black text-slate-500 tracking-[0.4em] uppercase mb-4">Signal Detected</p>
              <div className="text-9xl font-black text-white leading-none tracking-tighter drop-shadow-2xl">
                {currentData.note.replace(/[0-9]/g, '') || "---"}
                <span className="text-4xl text-cyan-400 ml-2">{chordType}</span>
              </div>
            </div>

            {/* EL MÁSTIL HORIZONTAL */}
            <div className="w-full bg-black/40 rounded-[2rem] border border-white/5 backdrop-blur-md">
              {chordToRender ? (
                <GuitarFretboard 
                  activeNote={detectedNote} 
                  note={selectedChordNote} 
                  type={selectedChordType}
                  highlightColor={TRACK_THEME[selectedTrack || ''] || '#06b6d4'}
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-600 italic tracking-widest text-xs uppercase">
                  {isPlaying ? "Analyzing Spectrum..." : "Engine Offline"}
                </div>
              )}
            </div>

          </div>
        </section>
        {/* SELECTOR DE TIPO */}
        <footer className="pb-12">
        </footer>
      </div>
    </div>  
  );
};
