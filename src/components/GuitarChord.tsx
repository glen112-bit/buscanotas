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
                left: `${(stringIndex * 18) + 2}%`, 
                top: `${(fret * 20) - 12}%` 
              }}
            />
          );
        })}
      </div>
    </div>
  );
};


