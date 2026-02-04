import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const SongDetailPage = () => {
  const { id } = useParams();
  const [song, setSong] = useState<any>(null);
  const [fontSize, setFontSize] = useState(16);
  const [transposeCount, setTransposeCount] = useState(0); // -12 a +12 semitonos
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: song ? `${song.title} - ${song.artist}` : 'Cancionero',
  });

  useEffect(() => {
    // Mock de carga (Sustituir por tu fetch de Firebase/API)
   const savedSong = localStorage.getItem(`song_${id}`);
  if (savedSong) {
    setSong(JSON.parse(savedSong));
  } else {
    // Si no existe, podemos poner un ejemplo o error
    setSong({
      title: "No encontrado",
      artist: "Desconocido",
      key: "-",
      content: "No se encontró el análisis de esta canción."
    });
  }
}, [id]);

  // FUNCIÓN MAESTRA: Transpone un acorde individual
  const transposeChord = (chord: string, semitones: number) => {
    return chord.replace(/[A-G][b#]?/g, (match) => {
      // Normalizar bemoles a sostenidos para el cálculo (ej: Ab -> G#)
      let note = match;
      if (note === 'Ab') note = 'G#';
      if (note === 'Bb') note = 'A#';
      if (note === 'Db') note = 'C#';
      if (note === 'Eb') note = 'D#';
      if (note === 'Gb') note = 'F#';

      const index = NOTES.indexOf(note);
      if (index === -1) return match;
      
      const newIndex = (index + semitones + 12) % 12;
      return NOTES[newIndex];
    });
  };

  const isChordLine = (line: string) => {
    const chordRegex = /\b([A-G][b#]?(m|maj|7|sus|dim|aug|add|9|11|13)?)\b/g;
    const words = line.trim().split(/\s+/);
    const chords = line.match(chordRegex) || [];
    return chords.length > 0 && chords.length >= words.length * 0.5;
  };

  const renderProcessedContent = () => {
    if (!song) return null;
    return song.content.split('\n').map((line: string, i: number) => {
      const chordLine = isChordLine(line);
      const processedLine = chordLine ? transposeChord(line, transposeCount) : line;

      return (
        <div 
          key={i} 
          className={`min-h-[1.5em] ${chordLine ? 'text-indigo-600 font-bold' : 'text-gray-700 mb-1'}`}
        >
          {processedLine || '\n'}
        </div>
      );
    });
  };

  if (!song) return <div className="p-10 text-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 overflow-x-hidden">
      {/* Barra de Herramientas mejorada */}
      <nav className="bg-white border-b sticky top-0 z-10 px-6 py-4 flex flex-wrap gap-4 justify-between items-center shadow-sm print:hidden">
        <Link to="/dashboard" className="text-indigo-600 font-bold hover:underline">← Volver</Link>
        
        <div className="flex items-center space-x-6">
          {/* Controles de Transposición */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-gray-400 uppercase mb-1">Transponer</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button onClick={() => setTransposeCount(prev => prev - 1)} className="px-3 py-1 hover:bg-white rounded shadow-sm transition-all font-bold text-indigo-600">-</button>
              <span className="px-3 py-1 text-xs font-mono font-bold w-10 text-center">
                {transposeCount > 0 ? `+${transposeCount}` : transposeCount}
              </span>
              <button onClick={() => setTransposeCount(prev => prev + 1)} className="px-3 py-1 hover:bg-white rounded shadow-sm transition-all font-bold text-indigo-600">+</button>
            </div>
          </div>

          {/* Controles de Fuente */}
          <div className="flex flex-col items-center border-l pl-6">
            <span className="text-[10px] font-black text-gray-400 uppercase mb-1">Tamaño</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button onClick={() => setFontSize(f => f - 2)} className="px-3 py-1 hover:bg-white rounded shadow-sm transition-all">A-</button>
              <button onClick={() => setFontSize(f => f + 2)} className="px-3 py-1 hover:bg-white rounded shadow-sm transition-all">A+</button>
            </div>
          </div>
          
          <button 
            onClick={() => handlePrint()}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            <span>Guardar PDF</span>
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto mt-10 px-4">
        <div 
          ref={componentRef} 
          className="bg-white p-12 rounded-3xl shadow-xl border border-gray-100 print:shadow-none print:border-none print:p-4"
          style={{ printColorAdjust: 'exact' } as any}
        >
          <header className="mb-10 text-center border-b pb-8">
            <h1 className="text-5xl font-black text-gray-900 mb-2">{song.title}</h1>
            <p className="text-xl text-gray-400 font-medium">{song.artist}</p>
            <div className="mt-4 inline-block bg-indigo-50 text-indigo-700 px-4 py-1 rounded-full text-xs font-black uppercase">
              Tono Original: {song.key}
            </div>
          </header>

          <div 
            className="font-mono leading-relaxed whitespace-pre text-gray-800"
            style={{ fontSize: `${fontSize}px` }}
          >
            {renderProcessedContent()}
          </div>
        </div>
      </main>
    </div>
  );
};
