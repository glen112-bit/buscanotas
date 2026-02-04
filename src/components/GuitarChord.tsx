// Diccionario de acordes (puedes ampliarlo luego)
export const GUITAR_CHORDS: Record<string, number[]> = {
  "C":  [-1, 3, 2, 0, 1, 0],
  "C#": [-1, 4, 3, 1, 2, 1],
  "D":  [-1, -1, 0, 2, 3, 2],
  "D#": [-1, -1, 1, 3, 4, 3],
  "E":  [0, 2, 2, 1, 0, 0],
  "F":  [1, 3, 3, 2, 1, 1],
  "F#": [2, 4, 4, 3, 2, 2],
  "G":  [3, 2, 0, 0, 0, 3],
  "G#": [4, 6, 6, 5, 4, 4],
  "A":  [-1, 0, 2, 2, 2, 0],
  "A#": [-1, 1, 3, 3, 3, 1],
  "B":  [-1, 2, 4, 4, 4, 2],
};

// El componente que faltaba definir
export const GuitarChord = ({ note }: { note: string }) => {
  // Limpiamos la nota (ej: "C4" -> "C")
  const chordName = note.replace(/[0-9]/g, '');
  const frets = GUITAR_CHORDS[chordName] || [-1, -1, -1, -1, -1, -1];

  return (
    <div className="flex flex-col items-center p-6 bg-slate-800/50 rounded-3xl border border-white/10 shadow-2xl">
      <div className="text-4xl font-black mb-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
        {chordName}
      </div>
      
      {/* El mástil de la guitarra */}
      <div className="relative w-40 h-52 border-x-2 border-slate-700 bg-slate-900/80 rounded-sm">
        {/* Cuerdas */}
        <div className="absolute inset-0 flex justify-between px-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-[1px] h-full bg-gradient-to-b from-slate-600 to-slate-400 shadow-sm" />
          ))}
        </div>

        {/* Trastes (Líneas horizontales) */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="absolute w-full h-[2px] bg-slate-600" style={{ top: `${i * 20}%` }} />
        ))}

        {/* Dedos (Puntos) */}
        {frets.map((fret, stringIndex) => {
          if (fret <= 0) return null;
          return (
            <div 
              key={stringIndex}
              className="absolute w-4 h-4 bg-cyan-400 rounded-full border-2 border-white shadow-[0_0_10px_#22d3ee] z-10 -translate-x-1/2"
              style={{ 
                left: `${(stringIndex * 20) + 1}%`, 
                top: `${(fret * 20) - 10}%` 
              }}
            />
          );
        })}
      </div>

      <div className="mt-4 flex gap-2 text-[10px] text-slate-500 font-mono">
        {frets.map((f, i) => <span key={i}>{f === -1 ? 'X' : f === 0 ? 'O' : f}</span>)}
      </div>
    </div>
  );
};
