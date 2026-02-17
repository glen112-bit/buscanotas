import React, { useEffect, useRef } from 'react';

interface PianoRollProps {
  activeNote: string | null;
  trackName: string | null;
}

export const PianoRoll: React.FC<PianoRollProps> = ({ activeNote, trackName }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Rango estándar de 6 octavas
  const octaves = [1, 2, 3, 4, 5, 6];
  const whiteNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const blackNotes = [
    { name: 'C#', after: 'C' },
    { name: 'D#', after: 'D' },
    { name: 'F#', after: 'F' },
    { name: 'G#', after: 'G' },
    { name: 'A#', after: 'A' }
  ];

  // Efecto para centrar el piano en la nota detectada
  useEffect(() => {
    if (activeNote && scrollRef.current) {
      // Ignorar si la nota detectada es de batería (ej. "KICK")
      if (activeNote.includes('_')) return;

      const activeKeyElement = scrollRef.current.querySelector(`[data-note="${activeNote}"]`);
      if (activeKeyElement) {
        activeKeyElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest', 
          inline: 'center' 
        });
      }
    }
  }, [activeNote]);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 bg-[#0a0a0c] rounded-[3rem] border border-white/10 shadow-2xl mt-8 mb-12">
      {/* HEADER DEL PIANO */}
      <div className="flex justify-between items-center mb-6 px-6">
        <div>
          <h3 className="text-amber-400 font-bold uppercase tracking-[0.3em] text-[10px] mb-1">Visualizer Engine</h3>
          <p className="text-white font-black text-3xl uppercase tracking-tighter">
            {trackName || 'No track selected'}
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5">
          <span className="text-slate-500 text-[10px] uppercase font-mono">Current Pitch</span>
          <div className={`px-5 py-2 rounded-xl font-black text-2xl transition-all duration-200 ${
            activeNote ? 'bg-amber-500 text-black shadow-[0_0_25px_rgba(245,158,11,0.5)]' : 'bg-white/5 text-white/20'
          }`}>
            {activeNote || '--'}
          </div>
        </div>
      </div>

      {/* PIANO CONTAINER */}
      <div 
        ref={scrollRef}
        className="relative h-72 w-full bg-[#111] rounded-[2rem] overflow-x-auto overflow-y-hidden border border-white/5 custom-scrollbar"
      >
        <div className="flex h-full" style={{ width: 'fit-content' }}>
          {octaves.map((octave) => (
            <div key={octave} className="flex relative h-full">
              
              {/* RENDER DE TECLAS BLANCAS */}
              {whiteNotes.map((noteName) => {
                const fullNote = `${noteName}${octave}`;
                const isActive = activeNote === fullNote;

                return (
                  <div
                    key={fullNote}
                    data-note={fullNote}
                    className={`w-14 h-full border-r border-black/10 flex-shrink-0 relative transition-all duration-100 ${
                      isActive 
                        ? 'bg-gradient-to-b from-amber-400 to-amber-600 z-10' 
                        : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    <span className={`absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-black ${isActive ? 'text-black' : 'text-gray-400'}`}>
                      {fullNote}
                    </span>
                  </div>
                );
              })}

              {/* RENDER DE TECLAS NEGRAS (Posicionamiento Absoluto) */}
              {blackNotes.map((black) => {
                const fullNote = `${black.name}${octave}`;
                const isActive = activeNote === fullNote;
                
                return (
                  <div
                    key={fullNote}
                    data-note={fullNote}
                    className={`absolute top-0 w-8 h-[60%] z-20 rounded-b-lg transition-all duration-100 border-x border-b border-black/20 ${
                      isActive 
                        ? 'bg-amber-400 shadow-[0_10px_20px_rgba(245,158,11,0.6)] h-[65%]' 
                        : 'bg-[#1a1a1c] hover:bg-[#2a2a2c]'
                    }`}
                    style={{ left: getBlackKeyOffset(black.name) }}
                  >
                    <div className={`w-full h-full relative ${isActive ? '' : 'bg-gradient-to-b from-white/5 to-transparent'}`}>
                      <span className={`absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-bold ${isActive ? 'text-black' : 'text-gray-600'}`}>
                        {black.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-center items-center gap-8 mt-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-white border border-gray-400 rounded-sm" />
          <span className="text-[10px] text-slate-500 uppercase font-bold">Natural</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#1a1a1c] rounded-sm" />
          <span className="text-[10px] text-slate-500 uppercase font-bold">Accidental (#)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-amber-500 rounded-sm shadow-[0_0_5px_rgba(245,158,11,1)]" />
          <span className="text-[10px] text-slate-500 uppercase font-bold">Detected</span>
        </div>
      </div>
    </div>
  );
};

// Helper de posicionamiento: Calculado en base al ancho de tecla blanca (w-14 = 56px)
const getBlackKeyOffset = (note: string) => {
  const offsets: { [key: string]: string } = {
    'C#': '40px',   // Entre C y D
    'D#': '96px',   // Entre D y E
    'F#': '208px',  // Entre F y G
    'G#': '264px',  // Entre G y A
    'A#': '320px',  // Entre A y B
  };
  return offsets[note];
};
