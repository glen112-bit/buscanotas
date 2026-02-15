import { useState, useRef, useEffect } from 'react';
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
  const [detectedNote, setDetectedNote] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0); 
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null); // Inicializado en null
  
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  const audioCtxRef = useRef<AudioContext | null>(null);

  const handleTrackSelect = async (track: string) => {
    console.log("Intentando activar track:", track);
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }
    setSelectedTrack(track);
  };
// Dashboard.tsx
useEffect(() => {
  const loadSavedAudios = async () => {
    try {
      const savedStems = await getStemsFromDB();
      if (Object.keys(savedStems).length > 0) {
        setStems(savedStems);
        console.log("Audios recuperados de la base de datos local");
      }
    } catch (e) {
      console.log("No hay audios guardados aún.");
    }
  };
  loadSavedAudios();
}, []);

// En tu función onUploadSuccess (donde recibes los archivos por primera vez):
const onUploadSuccess = async (data: any) => {
  setStems(data.files);
  // Guardamos los archivos reales (Blobs/Files) en IndexedDB
  await saveStemsToDB(data.rawFiles); 
};
  // Simplificamos la lógica de detección para el Fretboard
  // Usamos la nota detectada por el AudioInputProcessor
  const currentNoteForFretboard = currentData.note !== "---" ? currentData.note : null;

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
            audioRefs={audioRefs}
            onNoteDetected={(note) => {
              setDetectedNote(note);
              setCurrentData(prev => ({ ...prev, note: note }));
            }}
            onPlayStateChange={setIsPlaying}
            onTimeUpdate={setCurrentTime}
            onTrackSelect={handleTrackSelect} // Usamos nuestra función con resume()
          />
        </section>

        {/* MONITOR PRINCIPAL */}
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

            {/* EL MÁSTIL - CORREGIDO */}
         {/* Monitor Principal */}
<div className="w-full bg-black/40 rounded-[2rem] border border-white/5 backdrop-blur-md min-h-[300px] flex items-center justify-center">
  {selectedTrack ? (
    <GuitarFretboard 
      activeNote={currentData.note}
      currentTime={currentTime}
      trackName={selectedTrack}
      isPlaying={isPlaying}
      note={currentData.note}
      type={chordType}
    />
  ) : (
    <div className="p-20 text-center">
       <p className="text-slate-500">Esperando selección de track...</p>
    </div>
  )}
</div>
          </div>
        </section>

        <footer className="pb-12 text-center text-[10px] text-slate-600 uppercase tracking-widest">
          Audio Engine v3.0 - Ready
        </footer>
      </div>
    </div>  
  );
};
