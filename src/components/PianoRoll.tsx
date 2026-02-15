import React, { useEffect, useRef } from 'react';

interface PianoRollProps {
  activeNote: string | null;
  trackName: string | null;
}

export const PianoRoll: React.FC<PianoRollProps> = ({ activeNote, trackName }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Definimos las octavas y las notas base
  const octaves = [1, 2, 3, 4, 5, 6];
  const notesBase = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Efecto para centrar el piano en la nota detectada
  useEffect(() => {
    if (activeNote && scrollRef.current) {
      const activeKeyElement = scrollRef.current.querySelector(`[data-note="${activeNote}"]`);
      if (activeKeyElement) {
        activeKeyElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeNote]);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 bg-[#0a0a0c] rounded-[2rem] border border-white/10 shadow-2xl mt-8">
      <div className="flex justify-between items-center mb-4 px-6">
        <div>
          <h3 className="text-amber-400 font-bold uppercase tracking-[0.3em] text-[10px]">6-Octave Piano Roll</h3>
          <p className="text-white font-black text-2xl uppercase">{trackName}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-500 text-[10px] uppercase font-mono">Current Pitch:</span>
          <div className="bg-amber-500 text-black px-4 py-1 rounded-lg font-black text-xl shadow-[0_0_15px_rgba(245,158,11,0.4)]">
            {activeNote || '--'}
          </div>
        </div>
      </div>

      {/* CONTENEDOR CON SCROLL */}
      <div 
        ref={scrollRef}
        className="relative h-64 w-full bg-[#111] rounded-xl overflow-x-auto overflow-y-hidden border-2 border-white/5 custom-scrollbar"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="flex h-full" style={{ width: 'fit-content', minWidth: '100%' }}>
          {octaves.map((octave) => (
            <div key={octave} className="flex relative h-full border-r border-white/10">
              {/* Renderizado de una octava completa */}
              {notesBase.map((noteName) => {
                const fullNote = `${noteName}${octave}`;
                const isBlack = noteName.includes('#');
                const isActive = activeNote === fullNote;

                if (isBlack) {
                  // TECLAS NEGRAS (Posicionamiento absoluto sobre las blancas)
                  const leftOffset = getBlackKeyOffset(noteName);
                  return (
                    <div
                      key={fullNote}
                      data-note={fullNote}
                      className={`absolute top-0 h-[60%] w-6 z-20 rounded-b-sm transition-all duration-75 border border-black ${
                        isActive ? 'bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.8)]' : 'bg-[#222]'
                      }`}
                      style={{ left: leftOffset }}
                    >
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[7px] text-gray-500 font-bold">{noteName}</span>
                    </div>
                  );
                }

                // TECLAS BLANCAS
                return (
                  <div
                    key={fullNote}
                    data-note={fullNote}
                    className={`w-10 h-full border-r border-gray-200/10 flex-shrink-0 relative transition-all duration-75 ${
                      isActive ? 'bg-amber-500 z-10' : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-bold text-gray-400">
                      {noteName}{octave}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      <p className="text-center text-slate-600 text-[9px] mt-4 uppercase tracking-widest">
        Usa el scroll horizontal para ver todas las octavas (C1 - B6)
      </p>
    </div>
  );
};

// Helper para posicionar las teclas negras correctamente entre las blancas
const getBlackKeyOffset = (note: string) => {
  const offsets: { [key: string]: string } = {
    'C#': '28px',
    'D#': '68px',
    'F#': '148px',
    'G#': '188px',
    'A#': '228px',
  };
  return offsets[note];
};
