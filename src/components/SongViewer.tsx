export const SongViewer = ({ song }: { song: Song }) => {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
      <header className="mb-6 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">{song.title}</h1>
        <p className="text-indigo-600 font-medium">{song.artist} — Tono: {song.key}</p>
      </header>
      
      {/* El contenido de la canción */}
      <pre className="font-mono text-lg leading-relaxed text-gray-700 whitespace-pre-wrap">
        {/* Ejemplo de cómo se escribiría en la DB */}
        {"  G           D\n"}
        {"Imagine all the people\n"}
        {"  Em          C\n"}
        {"Living for today..."}
      </pre>
    </div>
  );
};
