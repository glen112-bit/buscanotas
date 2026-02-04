import { useState, useRef, useCallback } from 'react';
import { useAuth } from '../../AuthContext';
import { AudioInputProcessor } from '../../components/AudioInputProcessor';
import { useNavigate } from 'react-router-dom';

// 1. DICCIONARIO DE ACORDES
const GUITAR_CHORDS: Record<string, number[]> = {
  "C":  [-1, 3, 2, 0, 1, 0],
  "C#": [-1, 4, 3, 1, 2, 1],
  "Db": [-1, 4, 3, 1, 2, 1],
  "D":  [-1, -1, 0, 2, 3, 2],
  "D#": [-1, -1, 1, 3, 4, 3],
  "Eb": [-1, -1, 1, 3, 4, 3],
  "E":  [0, 2, 2, 1, 0, 0],
  "F":  [1, 3, 3, 2, 1, 1],
  "F#": [2, 4, 4, 3, 2, 2],
  "Gb": [2, 4, 4, 3, 2, 2],
  "G":  [3, 2, 0, 0, 0, 3],
  "G#": [4, 6, 6, 5, 4, 4],
  "Ab": [4, 6, 6, 5, 4, 4],
  "A":  [-1, 0, 2, 2, 2, 0],
  "A#": [-1, 1, 3, 3, 3, 1],
  "Bb": [-1, 1, 3, 3, 3, 1],
  "B":  [-1, 2, 4, 4, 4, 2],
};

// 2. COMPONENTE VISUAL DE LA GUITARRA
const GuitarChord = ({ note }: { note: string }) => {
  const chordName = note.replace(/[0-9]/g, '');
  const frets = GUITAR_CHORDS[chordName] || [-1, -1, -1, -1, -1, -1];

  return (
    <div className="flex flex-col items-center p-6 bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl transition-all duration-500 hover:border-cyan-500/30 group">
      <div className="text-4xl font-black mb-6 bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent">
        {chordName || "?"}
      </div>
      
      {/* Mástil Estilo Glass */}
      <div className="relative w-36 h-56 bg-gradient-to-b from-white/5 to-transparent rounded-lg overflow-hidden border border-white/5">
        {/* Cuerdas de Neón */}
        <div className="absolute inset-0 flex justify-between px-2">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className={`h-full transition-all duration-700 ${chordName ? 'bg-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'bg-white/10'}`} 
              style={{ width: `${1 + (7-i)*0.2}px` }} 
            />
          ))}
        </div>

        {/* Trastes Minimalistas */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="absolute w-full h-[1px] bg-white/7" style={{ top: `${(i + 1) * 20}%` }} />
        ))}

        {/* Dedos: Orbes de Luz */}
        {frets.map((fret, stringIndex) => {
          if (fret <= 0) return null;
          return (
            <div 
              key={stringIndex}
              className="absolute w-4 h-4 bg-white rounded-full shadow-[0_0_20px_#fff] z-10 -translate-x-1/2 transition-all duration-500 animate-pulse"
              style={{ 
                left: `${(stringIndex * 18) + 5}%`, 
                top: `${(fret * 20) - 12}%` 
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

// 3. DASHBOARD PRINCIPAL
export const Dashboard = () => {
  const [currentData, setCurrentData] = useState({ note: "---", voice: "Esperando..." });
  const [isPlaying, setIsPlaying] = useState(false);


  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-300 p-6 font-sans">
      
      {/* Barra Superior Estilo Aplicación */}
      <header className="max-w-[1400px] mx-auto mb-8 bg-[#161b22] border border-white/5 p-5 rounded-[2rem] flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-cyan-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <span className="text-black font-black text-2xl italic">G</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase">
            BuscaNota <span className="text-cyan-400">Processor</span> <span className="font-light text-slate-500">PRO</span>
          </h1>
        </div>
        <button className="px-6 py-2 bg-[#0d1117] border border-white/10 rounded-xl text-xs font-bold hover:bg-white hover:text-black transition-all uppercase tracking-widest">
          Cerrar Sesión
        </button>
      </header>

      <main className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* PANEL LATERAL (Como en la imagen) */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-[#161b22] rounded-[2.5rem] border border-white/5 p-8 shadow-xl">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]" />
              <h2 className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Input Engine</h2>
            </div>
            <AudioInputProcessor 
              onChordDetected={setCurrentData}
              onPlayStateChange={setIsPlaying}
            />
          </div>

          <div className="bg-[#161b22] rounded-[2.5rem] border border-white/5 p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[50px] rounded-full" />
            <p className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase mb-4">Espectro Vocal</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-white">{currentData.voice}</span>
              <div className="w-16 h-8 bg-[#0d1117] rounded-full p-1.5 border border-white/5">
                <div className={`h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-700 ${currentData.voice.includes('Alta') ? 'w-full shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'w-1/2'}`} />
              </div>
            </div>
          </div>
        </aside>

        {/* MONITOR CENTRAL (Como en la imagen) */}
        <section className="lg:col-span-8">
          <div className="bg-[#161b22] rounded-[3rem] border border-white/5 p-12 h-full flex flex-col shadow-2xl relative">
            
            {/* Status Header */}
            <div className="flex justify-between items-center mb-16">
              <div className="flex items-center gap-4 bg-[#0d1117] px-6 py-2 rounded-full border border-white/5">
                <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'}`} />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {isPlaying ? 'System Live' : 'Standby Mode'}
                </span>
              </div>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-800" />
                <div className="w-2 h-2 rounded-full bg-slate-800" />
              </div>
            </div>

            {/* Main Visualizer Area */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <div className="absolute -inset-20 bg-cyan-500/5 blur-[100px] pointer-events-none" />
                <p className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase mb-4">Note Detected</p>
                <div className="text-[12rem] font-black text-white leading-none tracking-tighter drop-shadow-2xl">
                  {currentData.note.replace(/[0-9]/g, '') || "---"}
                </div>
                <div className="mt-4 inline-block bg-cyan-500/10 border border-cyan-500/20 px-4 py-1 rounded-lg">
                  <span className="text-cyan-400 font-mono text-xs font-bold uppercase tracking-widest">Pitch: {currentData.note}</span>
                </div>
              </div>

              <GuitarChord note={currentData.note} />
            </div>

            {/* Action Button (Estilo Neumórfico) */}
            <button className="mt-12 group relative w-full overflow-hidden rounded-[2rem]">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-cyan-400 opacity-90 transition-all group-hover:scale-105" />
              <div className="relative py-8 flex items-center justify-center gap-4">
                <span className="text-black font-black text-lg uppercase tracking-[0.3em]">
                  Pegar Acorde [{currentData.note.replace(/[0-9]/g, '')}]
                </span>
              </div>
            </button>
          </div>
        </section>

      </main>
    </div>
  );
};
