interface Props {
  title: string;
  artist: string;
  content: string;
}

export const SongPreview = ({ title, artist, content }: Props) => {
  
  // Función para resaltar acordes automáticamente
  const highlightChords = (text: string) => {
    // Regex para detectar acordes comunes (A-G, m, #, b, 7, sus, etc.)
    const chordRegex = /\b([A-G][b#]?(m|maj|min|dim|aug|sus)?[0-9]?)\b/g;
    
    // Dividimos el texto por líneas para procesarlo
    return text.split('\n').map((line, i) => {
      // Si la línea contiene mayormente acordes, le damos un estilo especial
      const isChordLine = line.trim().length > 0 && line.replace(chordRegex, '').trim().length < line.trim().length / 2;

      return (
        <div key={i} className={`min-h-[1.2rem] ${isChordLine ? 'text-indigo-600 font-bold' : 'text-gray-800'}`}>
          {line || ' '}
        </div>
      );
    });
  };

  return (
    <div className="bg-slate-900 text-slate-100 p-8 rounded-2xl shadow-2xl border border-slate-700 font-mono overflow-hidden">
      <div className="border-b border-slate-700 pb-4 mb-6">
        <span className="text-xs uppercase tracking-widest text-indigo-400 font-bold">Vista Previa Live</span>
        <h1 className="text-2xl font-bold truncate">{title || 'Título de la canción'}</h1>
        <p className="text-slate-400 italic">{artist || 'Artista'}</p>
      </div>

      <div className="text-sm md:text-base leading-relaxed whitespace-pre">
        {content ? highlightChords(content) : (
          <p className="text-slate-600 italic">Empieza a escribir para ver la magia...</p>
        )}
      </div>
      
      {/* Efecto decorativo de ondas de audio al final */}
      <div className="mt-8 flex items-end justify-center space-x-1 opacity-30">
        {[...Array(10)].map((_, i) => (
          <div 
            key={i} 
            className="w-1 bg-indigo-500 animate-pulse" 
            style={{ height: `${Math.random() * 20 + 5}px`, animationDelay: `${i * 0.1}s` }}
          ></div>
        ))}
      </div>
    </div>
  );
};
