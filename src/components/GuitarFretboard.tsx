import React, { useMemo } from 'react';
import { GUITAR_CHORDS } from '../constants/chords';

interface GuitarFretboardProps {
  activeNote: string | null;
  trackName: string | null;
  note: string | null;
  type: string | null;
}

export const GuitarFretboard: React.FC<GuitarFretboardProps> = ({ 
  activeNote, 
  trackName, 
  note, 
  type 
}) => {
  if (!trackName) return null;

  const findSingleNoteOnFretboard = (noteName: string) => {
    const strings = ['E', 'A', 'D', 'G', 'B', 'E'];
    const notesOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    return strings.map(stringRoot => {
      let fret = 0;
      while (fret < 12) {
        const currentNoteIndex = (notesOrder.indexOf(stringRoot) + fret) % 12;
        if (notesOrder[currentNoteIndex] === noteName) return fret;
        fret++;
      }
      return -1;
    });
  };
const findNoteEverywhere = (noteName: string) => {
    const strings = ['E', 'A', 'D', 'G', 'B', 'E'];
    const notesOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const root = noteName.replace(/[0-9]/g, '').trim();
    
    // Si es modo melodía, devolvemos un array de trastes donde se encuentra esa nota
    return strings.map(stringRoot => {
      let fret = 0;
      while (fret < 12) {
        const currentNoteIndex = (notesOrder.indexOf(stringRoot) + fret) % 12;
        if (notesOrder[currentNoteIndex] === root) return fret;
        fret++;
      }
      return -1;
    });
  };

  const chordData = useMemo(() => {
    if (!note) return null;
    const root = note.replace(/[0-9]/g, '').trim();
    const chordName = type ? `${root}${type}` : root;
    
    if (GUITAR_CHORDS[chordName]) return GUITAR_CHORDS[chordName];
    
    return {
      frets: findSingleNoteOnFretboard(root),
      fingers: [0, 0, 0, 0, 0, 0]
    };
  }, [note, type]);

  const frets = chordData ? chordData.frets : [-1, -1, -1, -1, -1, -1];
  const fingers = chordData ? chordData.fingers : [0, 0, 0, 0, 0, 0];
  const totalFrets = 12;

  return (
<div className="w-full max-w-4xl mx-auto p-6 bg-[#0f1115] rounded-3xl shadow-inner mt-8 border border-white/5">
      {/* CABECERA CON INDICADOR DE MODO */}
      <div className="flex justify-between items-center mb-6 px-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-cyan-400 font-bold uppercase tracking-widest text-xs">
            Fretboard: {trackName}
          </h3>
          <span className={`w-fit text-[10px] px-2 py-0.5 rounded-full font-black tracking-tighter ${
            type === 'chord' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
          }`}>
            {type === 'chord' ? '● MODO ACORDE' : '✦ MODO MELODÍA'}
          </span>
        </div>
        
        <div className="text-right">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Detectando:</p>
          <p className="text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            {activeNote || '--'}
          </p>
        </div>
      </div>

      <div className="relative h-64 bg-[#1a1c22] rounded-2xl border-2 border-[#2a2e37] overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')] opacity-30" />
        
        {/* TRASTES */}
        {[...Array(totalFrets + 1)].map((_, i) => (
          <div key={i} 
            className={`absolute h-full ${i === 0 ? 'w-5 bg-yellow-700/60 z-20 shadow-lg' : 'w-[3px] bg-slate-600'}`}
            style={{ left: `${(i * 100) / totalFrets}%` }} 
          />
        ))}

        {/* CUERDAS */}
        <div className="absolute inset-0 flex flex-col justify-between py-5 z-10">
          {[...Array(6)].map((_, i) => {
            const isBassString = i < 3; 
            const thickness = 4.5 - i * 0.6;
            return (
              <div key={i} className="relative w-full flex items-center" style={{ height: '20px' }}>
                <div className={`w-full shadow-sm ${isBassString ? 'bg-gradient-to-b from-amber-100 to-amber-900' : 'bg-gradient-to-b from-slate-100 to-slate-500'}`}
                  style={{ height: `${thickness}px` }} 
                />
              </div>
            );
          })}
        </div>

        {/* NOTAS / DEDOS */}
        {frets.map((fret, stringIndex) => {
          if (fret === -1) return null;
          
          const yPos = 13.5 + (stringIndex * 14.9); 
          const xPos = fret === 0 ? 1 : (fret * 100 / totalFrets) - (50 / totalFrets);

          return (
            <div key={stringIndex} 
              className={`absolute w-9 h-9 rounded-full -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-30 transition-all duration-300 transform
                ${type === 'note' ? 'scale-90 opacity-80' : 'scale-100'}
                ${fret === 0 
                  ? 'border-4 border-cyan-400 bg-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.5)]' 
                  : 'bg-white shadow-[0_0_20px_rgba(255,255,255,0.9),inset_0_0_10px_rgba(0,0,0,0.2)]'
                }`}
              style={{ left: `${xPos}%`, top: `${yPos}%` }}>
              <span className="text-xs font-black text-black">
                {/* En modo acorde mostramos el dedo, en modo nota solo el punto (o el nombre) */}
                {fret === 0 ? '' : (type === 'chord' ? (fingers[stringIndex] || fret) : '')}
              </span>
            </div>
          );
        })}
      </div>
    </div>  );
};
