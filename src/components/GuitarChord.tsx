import React from 'react';
import { GUITAR_CHORDS } from '../constants/chords';

interface GuitarChordProps {
  note: string;
  type: string;
}

export const GuitarChord: React.FC<GuitarChordProps> = ({ note, type }) => {
  const rootNote = note.replace(/[0-9]/g, '');
  const chordName = rootNote + type;
  
  // ERROR CORREGIDO: Extraemos el objeto y luego sus propiedades
  const chordData = GUITAR_CHORDS[note] || GUITAR_CHORDS[rootNote];
  
  // Si no existe el acorde, usamos un array de "silencio"
  // Si existe, usamos chordData.frets (el array que necesita el .map)
  // const frets = chordData ? chordData.frets : [-1, -1, -1, -1, -1, -1];
const frets = chordData ? chordData.frets : null;

if (!frets) return <div className="text-slate-500">Acorde no encontrado</div>;

  return (
    <div className="flex flex-col items-center p-6 bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl transition-all duration-500">
      <div className="flex items-baseline gap-1 mb-8">
        <span className="text-4xl font-black text-white">{rootNote || "?"}</span>
        <span className="text-xl font-bold text-cyan-400">{type || "maj"}</span>
      </div>
      
      <div className="relative w-40 h-64 bg-gradient-to-b from-white/10 to-transparent rounded-lg border border-white/5 shadow-inner">
        {/* Cejilla (Nut) */}
        <div className="absolute w-full h-1.5 bg-slate-400/50 top-0 z-20" />

        {/* Cuerdas (Strings) */}
        <div className="absolute inset-0 flex justify-between px-3">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className="h-full bg-gradient-to-r from-white/20 via-white/40 to-white/20" 
              style={{ width: `${1 + (5-i)*0.3}px` }} 
            />
          ))}
        </div>

        {/* Trastes (Frets) */}
        {[...Array(5)].map((_, i) => (
          <div 
            key={i} 
            className="absolute w-full h-[1px] bg-white/20" 
            style={{ top: `${(i + 1) * 20}%` }} 
          />
        ))}

        {/* Puntos de presión */}
        {frets.map((fret, stringIndex) => {
          // Ajuste fino de la posición X para que coincida con las cuerdas
          const xPos = 7.5 + (stringIndex * 17); 

          if (fret === -1) {
            return (
              <div key={stringIndex} className="absolute text-[10px] font-black text-red-500/60 -translate-x-1/2"
                style={{ left: `${xPos}%`, top: '-6%' }}>✕</div>
            );
          }

          if (fret === 0) {
            return (
              <div key={stringIndex} className="absolute w-3 h-3 border-2 border-cyan-400 rounded-full -translate-x-1/2"
                style={{ left: `${xPos}%`, top: '-5%' }} />
            );
          }

          return (
            <div key={stringIndex} 
              className="absolute w-5 h-5 bg-white rounded-full shadow-[0_0_15px_#fff] z-10 -translate-x-1/2 flex items-center justify-center animate-in fade-in zoom-in duration-300"
              style={{ 
                left: `${xPos}%`, 
                top: `${(fret * 20) - 10}%` 
              }}>
              <div className="w-2 h-2 bg-cyan-500 rounded-full" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
