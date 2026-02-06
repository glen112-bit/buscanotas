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
          <button className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors">
            Cerrar Sesión
          </button>
        </header>

        {/* 1. MÓDULO DE ENTRADA (100% ancho) */}
        <section className="bg-[#161b22] rounded-[2.5rem] border border-white/5 p-2 shadow-xl">
          <div className="p-4 border-b border-white/5 flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <h2 className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Input Engine</h2>
          </div>
          <AudioInputProcessor 
            onChordDetected={setCurrentData}
            onPlayStateChange={setIsPlaying}
          />
        </section>

        {/* 2. MÓDULO DE MONITOR (Visualización Central) */}
        <section className="bg-[#161b22] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
          <div className="p-10 flex flex-col items-center text-center space-y-8">
            
            {/* Nota Detectada Gigante */}
            <div className="relative group">
              <div className="absolute -inset-10 bg-cyan-500/10 blur-[80px] opacity-50 group-hover:opacity-100 transition-opacity" />
              <p className="text-[10px] font-black text-slate-500 tracking-[0.4em] uppercase mb-2">Frecuencia Dominante</p>
              <div className="text-[12rem] font-black text-white leading-none tracking-tighter drop-shadow-2xl select-none">
                {currentData.note.replace(/[0-9]/g, '') || "---"}
              </div>
              <div className="inline-block bg-cyan-500/10 border border-cyan-500/20 px-4 py-1 rounded-full">
                <span className="text-cyan-400 font-mono text-xs font-bold tracking-widest">{currentData.note}</span>
              </div>
            </div>

            {/* Guitarra y Voz en paralelo dentro del monitor vertical */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full pt-8 border-t border-white/5">
              <div className="flex flex-col items-center justify-center">
                 <GuitarChord note={currentData.note} />
              </div>
              
              <div className="flex flex-col justify-center space-y-6 bg-black/20 rounded-[2rem] p-8">
                <div className="text-left">
                  <p className="text-[10px] font-black text-slate-500 tracking-widest uppercase mb-2">Rango Vocal</p>
                  <p className="text-3xl font-bold text-white italic">{currentData.voice}</p>
                </div>
                <div className="w-full h-3 bg-[#0d1117] rounded-full overflow-hidden border border-white/5">
                  <div 
                    className={`h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-1000 shadow-[0_0_15px_rgba(6,182,212,0.5)]`}
                    style={{ width: currentData.voice.includes('Alta') ? '100%' : currentData.voice.includes('Media') ? '60%' : '30%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. BOTÓN DE ACCIÓN (Pegar) */}
        <footer className="pb-12">
          <button className="group relative w-full overflow-hidden rounded-[2rem] active:scale-[0.98] transition-transform">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-blue-500 to-cyan-400 opacity-90 group-hover:opacity-100 transition-all" />
            <div className="relative py-8 flex items-center justify-center gap-4">
              <span className="text-black font-black text-xl uppercase tracking-[0.3em] drop-shadow-sm">
                Pegar Acorde {currentData.note.replace(/[0-9]/g, '')}
              </span>
            </div>
          </button>
        </footer>
      </div>
    </div>  );
};
