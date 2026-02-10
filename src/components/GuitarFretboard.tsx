import React from 'react';
import { GUITAR_CHORDS } from '../constants/chords';

interface GuitarFretboardProps {
  note: string;
  type: string;
}

export const GuitarFretboard: React.FC<GuitarFretboardProps> = ({ note, type }) => {
  const root = note.replace(/[0-9]/g, '').trim();
  const chordName = type ? `${root}${type}` : root;
  const chordData = GUITAR_CHORDS[chordName] || GUITAR_CHORDS[root];
  
  const frets = chordData ? chordData.frets : [-1, -1, -1, -1, -1, -1];
  const fingers = chordData ? chordData.fingers : [0, 0, 0, 0, 0, 0];
  const totalFrets = 12;

  return (
    <div className="w-full p-4 lg:p-8 select-none">
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
            {i > 0 && <div className="absolute inset-0 w-[1px] bg-white/20 ml-[1px]" />}
          </div>
        ))}

        {/* INLAYS (Puntos guía) */}
        {[3, 5, 7, 9].map(pos => (
          <div key={pos} className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white/5 rounded-full blur-[1px]" 
               style={{ left: `${(pos * 100 / totalFrets) - (50 / totalFrets)}%` }} />
        ))}

        {/* CUERDAS REALISTAS (Espejo: Gruesa arriba, fina abajo) */}
        <div className="absolute inset-0 flex flex-col justify-between py-6 z-10">
          {[...Array(6)].map((_, i) => {
            // Definimos propiedades realistas por cuerda
            const isWound = i < 3; // E, A, D son entorchadas (bronce)
            const thickness = [3.8, 3.0, 2.2, 1.4, 1.0, 0.7][i]; // Grosor decreciente
            
            return (
              <div key={i} className="relative w-full" style={{ height: `${thickness}px` }}>
                {/* Cuerpo de la cuerda */}
                <div className={`w-full h-full shadow-[0_1px_3px_rgba(0,0,0,0.8)] ${
                  isWound 
                  ? 'bg-gradient-to-b from-[#b58e58] via-[#e2c18d] to-[#8d6e41]' // Bronce
                  : 'bg-gradient-to-b from-[#e5e7eb] via-[#9ca3af] to-[#4b5563]' // Acero
                }`} />
                
                {/* Efecto de entorchado (solo para las 3 cuerdas superiores) */}
                {isWound && (
                  <div className="absolute inset-0 opacity-30" 
                       style={{ 
                         backgroundImage: 'linear-gradient(90deg, rgba(0,0,0,0.4) 1px, transparent 1px)', 
                         backgroundSize: '3px 100%' 
                       }} />
                )}
                
                {/* Brillo metálico superior (Efecto HD) */}
                <div className="absolute top-0 w-full h-[35%] bg-white/20" />
              </div>
            );
          })}
        </div>

        {/* NOTAS Y DEDOS (Mantenemos tu lógica original de posicionamiento) */}
        {frets.map((fret, stringIndex) => {
          if (fret === -1) return null;
          
          const yPos = (stringIndex * 16.5) + 8.5; 
          const xPos = fret === 0 ? -1.2 : (fret * 100 / totalFrets) - (50 / totalFrets);

          return (
            <div key={stringIndex} 
              className={`absolute w-8 h-8 rounded-full -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-300 z-30
                ${fret === 0 
                  ? 'bg-transparent border-[3px] border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.6)]' 
                  : 'bg-white border-2 border-slate-300 shadow-[0_5px_15px_rgba(0,0,0,0.4),0_0_20px_white]'}`}
              style={{ left: `${xPos}%`, top: `${yPos}%` }}>
              {fret > 0 && fingers[stringIndex] > 0 && (
                <span className="text-black text-[11px] font-black">{fingers[stringIndex]}</span>
              )}
            </div>
          );
        })}

        {/* MUTE MARKERS (X) */}
        {frets.map((fret, i) => fret === -1 && (
          <div key={`mute-${i}`} className="absolute left-[-1.5%] text-red-500 font-black text-xs z-30 -translate-y-1/2"
               style={{ top: `${(i * 17.5) + 10.5}%` }}>✕</div>
        ))}
      </div>

      {/* NÚMEROS DE TRASTES */}
      <div className="flex justify-between px-2 mt-4">
        {[...Array(totalFrets)].map((_, i) => (
          <span key={i} className="flex-1 text-center text-[10px] font-black text-slate-700 uppercase">
            {i + 1}
          </span>
        ))}
      </div>
    </div>
  );
};
