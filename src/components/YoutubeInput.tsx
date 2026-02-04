import { useState } from 'react';

export const YoutubeInput = ({ onUrlSubmit }: { onUrlSubmit: (url: string) => void }) => {
  const [url, setUrl] = useState("");

  return (
    <div className="bg-[#161b22] p-6 rounded-[2rem] border border-white/5 shadow-xl">
      <p className="text-[10px] font-black text-slate-500 tracking-widest uppercase mb-4">Analizador de YouTube</p>
      <div className="flex gap-2">
        <input 
          type="text" 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Pega el link de YouTube aquí..."
          className="flex-1 bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-500 transition-all"
        />
        <button 
          onClick={() => onUrlSubmit(url)}
          className="bg-cyan-500 text-black px-6 rounded-xl font-bold text-xs hover:bg-white transition-all"
        >
          CARGAR
        </button>
      </div>
    </div>
  );
};
