import React, { useMemo } from 'react';
import { GUITAR_CHORDS } from '../constants/chords';

interface GuitarFretboardProps {
  activeNote: string | null;
  trackName: string | null;
  note?: string | null;
  type?: string | null;
}

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const STRINGS_MAP = ['E', 'B', 'G', 'D', 'A', 'E']; // De 1ra a 6ta
// const GUITAR_CHORDS: any = {};

export const GuitarFretboard: React.FC<GuitarFretboardProps> = ({ 
  activeNote, 
  trackName, 
  note, 
  type 
}) => {
  if (!trackName) return null;

  const totalFrets = 12;

  // 1. Lógica para encontrar una nota en todo el mástil
  const findSingleNoteEverywhere = (noteName: string | null) => {
    if (!noteName) return [-1, -1, -1, -1, -1, -1];
    const cleanNote = noteName.replace(/[0-9]/g, '').trim().toUpperCase();

    return STRINGS_MAP.map(stringRoot => {
      const rootIndex = NOTES.indexOf(stringRoot);
      if (rootIndex === -1) return -1;
      for (let fret = 0; fret <= totalFrets; fret++) {
        if (NOTES[(rootIndex + fret) % 12] === cleanNote) return fret;
      }
      return -1;
    });
  };

  const chordData = useMemo(() => {
    const sourceNote = note || activeNote;
    if (!sourceNote) return null;

    const root = sourceNote.replace(/[0-9]/g, '').trim().toUpperCase();

    // Verificamos si existe el acorde, si no, vamos a modo melodía
    if (trackName.toLowerCase().includes('guitar') && GUITAR_CHORDS[root]) {
      return GUITAR_CHORDS[root];
    }

    // Por defecto, modo melodía: muestra la nota en todas las cuerdas
    return {
      frets: findSingleNoteEverywhere(root),
      fingers: [0, 0, 0, 0, 0, 0]
    };
  }, [note, activeNote, trackName]);

  const frets = chordData ? chordData.frets : [-1, -1, -1, -1, -1, -1];
  const fingers = chordData ? chordData.fingers : [0, 0, 0, 0, 0, 0];

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-[#0f1115] rounded-3xl shadow-inner mt-8 border border-white/5">
      <div className="flex justify-between items-center mb-6 px-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-cyan-400 font-bold uppercase tracking-widest text-xs italic">
            Visualizer: {trackName}
          </h3>
          <span className="w-fit text-[9px] px-2 py-0.5 rounded-full font-black bg-blue-500/20 text-blue-400 border border-blue-500/30">
            {chordData?.fingers?.some((f: number) => f > 0) ? '● MODO ACORDE' : '✦ MODO MELODÍA'}
          </span>
        </div>

        <div className="text-right">
          <p className="text-[10px] text-slate-500 font-bold uppercase">Pitch</p>
          <p className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
            {activeNote || '--'}
          </p>
        </div>
      </div>

      <div className="relative h-60 bg-[#1a1c22] rounded-2xl border-2 border-[#2a2e37] overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')] opacity-30" />

        {/* TRASTES */}
        {[...Array(totalFrets + 1)].map((_, i) => (
          <div key={i} 
            className={`absolute h-full ${i === 0 ? 'w-5 bg-gradient-to-r from-amber-900 to-amber-700 z-20 shadow-xl' : 'w-[2px] bg-slate-700/50'}`}
            style={{ left: `${(i * 100) / totalFrets}%` }} 
          />
        ))}

        {/* CUERDAS */}
        <div className="absolute inset-0 flex flex-col justify-between py-6 z-10">
          {[...Array(6)].map((_, i) => {
            const thickness = 4.5 - i * 0.6;
            return (
              <div key={i} className="relative w-full flex items-center" style={{ height: '10px' }}>
                <div className={`w-full shadow-sm ${i < 3 ? 'bg-gradient-to-b from-amber-100 to-amber-900' : 'bg-gradient-to-b from-slate-100 to-slate-500'}`}
                  style={{ height: `${thickness}px`, opacity: 0.8 }} 
                />
              </div>
            );
          })}
        </div>

        {/* NOTAS DETECTADAS */}
        <div className="absolute inset-0 z-30">
          {frets.map((fret: number, stringIndex: number) => {
            if (fret === -1) return null;
            const xPos = fret === 0 ? 1.5 : (fret * 100 / totalFrets) - (50 / totalFrets);
            const yPos = 12 + (stringIndex * 15.2);

            return (
              <div key={stringIndex} 
                className={`absolute w-9 h-9 rounded-full -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-200
                  ${fret === 0 
                    ? 'border-4 border-cyan-400 bg-cyan-400/20 backdrop-blur-sm shadow-[0_0_15px_rgba(34,211,238,0.5)]' 
                    : 'bg-white shadow-[0_8px_16px_rgba(0,0,0,0.5)] border-2 border-slate-200'
                  }`}
                style={{ left: `${xPos}%`, top: `${yPos}%` }}>
                <span className="text-[11px] font-black text-black">
                  {fret !== 0 && fingers[stringIndex] !== 0 ? fingers[stringIndex] : ''}
                </span>
              </div>
            );
          })}
        </div>
        {/* NOTAS Y DEDOS (Círculos) */}
        <div className="absolute inset-0 z-30">
          {frets.map((fret: number, stringIndex: number) => {
            // IMPORTANTE: Si fret es 0, es nota al aire. Si es > 0, es traste.
            // Solo ocultamos si es -1
            if (fret === -1) return null;

            // 1. Calculamos posición X (Horizontal)
            // totalFrets es 12. Si fret es 1, xPos debe ser aprox 4.1% (centro del primer traste)
            const xPos = fret === 0 ? 1.5 : (fret * 100 / totalFrets) - (50 / totalFrets);

            // 2. Calculamos posición Y (Vertical) 
            // Tu contenedor tiene py-6 (24px arriba y abajo). 
            // Ajustamos el multiplicador para que caiga justo sobre la cuerda.
            const yPos = 11 + (stringIndex * 15.6); 

            return (
              <div key={`string-${stringIndex}`} 
                className={`absolute w-8 h-8 rounded-full -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-300
                  ${fret === 0 
                    ? 'border-4 border-cyan-400 bg-cyan-900/80 backdrop-blur-sm shadow-[0_0_15px_rgba(34,211,238,0.8)]' 
                    : 'bg-white shadow-[0_4px_10px_rgba(0,0,0,0.8)] border-2 border-cyan-200'
                  }`}
                style={{ 
                  left: `${xPos}%`, 
                  top: `${yPos}%`,
                  zIndex: 40 
                }}>
                <span className="text-[10px] font-black text-black">
                  {/* Si hay número de dedo lo ponemos, si no, ponemos el nombre de la nota */}
                  {fingers[stringIndex] !== 0 ? fingers[stringIndex] : activeNote?.replace(/[0-9]/g, '')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div> 
  );
};
