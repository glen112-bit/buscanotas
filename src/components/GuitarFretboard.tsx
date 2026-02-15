import React, { useMemo } from 'react';
import { GUITAR_CHORDS } from '../constants/chords';

interface GuitarFretboardProps {
  note: string;       // Nota base del acorde (ej: "C")
  type: string;       // Tipo de acorde (ej: "maj7")
  activeNote: string | null; // La nota que viene del detector de audio
}

export const GuitarFretboard: React.FC<GuitarFretboardProps> = ({ note, type, activeNote }) => {
  // 1. Lógica de Acordes (Mantenemos tu base original)
  const root = note.replace(/[0-9]/g, '').trim();
  const chordName = type ? `${root}${type}` : root;
  const chordData = GUITAR_CHORDS[chordName] || GUITAR_CHORDS[root];

  const frets = chordData ? chordData.frets : [-1, -1, -1, -1, -1, -1];
  const fingers = chordData ? chordData.fingers : [0, 0, 0, 0, 0, 0];
  const totalFrets = 12;

  // 2. Mapeo de notas por cuerda/traste para la detección visual
  // Afinación estándar: E2, A2, D3, G3, B3, E4
  const stringRoots = ['E', 'A', 'D', 'G', 'B', 'E'];
  const chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const getNoteAt = (stringIdx: number, fret: number) => {
    const rootIdx = chromaticScale.indexOf(stringRoots[stringIdx]);
    return chromaticScale[(rootIdx + fret) % 12];
  };

  return (
    <div className="w-full p-4 lg:p-8 select-none">
      {/* Título de nota detectada (Feedback visual) */}
      <div className="mb-4 text-center">
         <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">Live Analysis</span>
         <div className="text-2xl font-black text-white">{activeNote || '--'}</div>
      </div>

      <div className="relative h-56 bg-[#1a1c22] rounded-xl border-t-2 border-b-4 border-[#121418] shadow-2xl overflow-hidden">
        {/* FONDO / MADERA */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#16181d] via-[#2a2e37] to-[#16181d]" />

        {/* TRASTES */}
        {[...Array(totalFrets + 1)].map((_, i) => (
          <div key={i} 
            className={`absolute h-full transition-all ${
              i === 0 
                ? 'w-3 bg-gradient-to-r from-amber-600 to-yellow-500 z-20 shadow-[2px_0_10px_rgba(0,0,0,0.5)]' 
                : 'w-[4px] bg-gradient-to-r from-gray-400 via-gray-200 to-gray-500 opacity-90'
            }`}
            style={{ left: `${(i * 100) / totalFrets}%` }}>
          </div>
        ))}

        {/* CUERDAS */}
        <div className="absolute inset-0 flex flex-col justify-between py-6 z-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="relative w-full" style={{ height: `${[3.8, 3.0, 2.2, 1.4, 1.0, 0.7][i]}px` }}>
              <div className={`w-full h-full ${i < 3 ? 'bg-gradient-to-b from-[#b58e58] via-[#e2c18d] to-[#8d6e41]' : 'bg-gradient-to-b from-[#e5e7eb] via-[#9ca3af] to-[#4b5563]'}`} />
            </div>
          ))}
        </div>

        {/* NOTAS DEL ACORDE + NOTA ACTIVA (AUDIO) */}
        {frets.map((fret, stringIndex) => {
          if (fret === -1) return null;

          const noteAtPosition = getNoteAt(stringIndex, fret);
          const isNotePlaying = activeNote === noteAtPosition;
          
          const yPos = (stringIndex * 16.5) + 8.5; 
          const xPos = fret === 0 ? -1.2 : (fret * 100 / totalFrets) - (50 / totalFrets);

          return (
            <div key={stringIndex} 
              className={`absolute w-8 h-8 rounded-full -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-150 z-30
                ${isNotePlaying 
                  ? 'bg-cyan-400 scale-125 shadow-[0_0_25px_#22d3ee] border-white border-2' 
                  : fret === 0 
                    ? 'bg-transparent border-[3px] border-slate-500' 
                    : 'bg-white border-2 border-slate-300 shadow-xl'}`}
              style={{ left: `${xPos}%`, top: `${yPos}%` }}>
              
              {/* Número de dedo o nombre de nota */}
              <span className={`text-[10px] font-black ${isNotePlaying ? 'text-black' : 'text-slate-600'}`}>
                {isNotePlaying ? noteAtPosition : (fingers[stringIndex] > 0 ? fingers[stringIndex] : '')}
              </span>
            </div>
          );
        })}

        {/* MUTE MARKERS */}
        {frets.map((fret, i) => fret === -1 && (
          <div key={`mute-${i}`} className="absolute left-[-1.5%] text-red-500 font-black text-xs z-30 -translate-y-1/2"
            style={{ top: `${(i * 17.5) + 10.5}%` }}>✕</div>
        ))}
      </div>

      {/* NÚMEROS DE TRASTES */}
      <div className="flex justify-between px-2 mt-4 opacity-40">
        {[...Array(totalFrets)].map((_, i) => (
          <span key={i} className="flex-1 text-center text-[9px] font-bold text-white uppercase">
            {i + 1}
          </span>
        ))}
      </div>
    </div>
  );
};
