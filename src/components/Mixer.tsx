import React, { useState, useEffect } from 'react';
import { getEmoji } from './getEmoji';

interface MixerProps {
  stems: { [key: string]: string };
  volumes: { [key: string]: number };
  onChange: (track: string, value: number) => void;
  colors: { [key: string]: string };
  audioRefs: React.MutableRefObject<{ [key: string]: HTMLAudioElement | null }>;
  selectedTrack: string | null;
  onSelectTrack: (name: string) => void;
}

export const Mixer = ({ 
  stems, 
  volumes, 
  onChange, 
  colors, 
  audioRefs, 
  selectedTrack, 
  onSelectTrack 
}: MixerProps) => {
  const [soloTrack, setSoloTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);

  const totalTracks = Object.keys(stems).length;

  // Manejo de Volúmenes y Lógica de Solo
  useEffect(() => {
    Object.keys(stems).forEach((track) => {
      const audio = audioRefs.current[track];
      if (audio) {
        const isMutedBySolo = soloTrack !== null && soloTrack !== track;
        audio.volume = isMutedBySolo ? 0 : (volumes[track] ?? 0.8);
      }
    });
  }, [volumes, soloTrack, stems, audioRefs]);

  const togglePlay = async () => {
    const audios = Object.values(audioRefs.current).filter(a => a !== null) as HTMLAudioElement[];
    if (audios.length === 0) return;

    if (isPlaying) {
      audios.forEach(a => a.pause());
      setIsPlaying(false);
    } else {
      try {
        const commonTime = audios[0]?.currentTime || 0;
        await Promise.all(audios.map(async (a) => {
          a.currentTime = commonTime;
          return a.play();
        }));
        setIsPlaying(true);
      } catch (error) {
        console.error("Error al reproducir:", error);
      }
    }
  };

  return (
    <div className="bg-[#0b0e14]/50 p-6 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-sm">
      {/* BOTÓN PRINCIPAL */}
      <div className="flex justify-center mb-10">
        <button 
          onClick={togglePlay}
          disabled={loadedCount < totalTracks}
          className={`px-10 py-4 rounded-full font-black tracking-widest transition-all duration-300 ${
            loadedCount < totalTracks 
              ? 'opacity-30 cursor-not-allowed bg-white/10 text-white/40' 
              : isPlaying 
                ? 'bg-red-500/20 text-red-500 border border-red-500/50' 
                : 'bg-cyan-500 text-black shadow-lg hover:scale-105'
          }`}
        >
          {loadedCount < totalTracks 
            ? `CARGANDO (${loadedCount}/${totalTracks})...` 
            : isPlaying ? 'PAUSAR SESIÓN' : 'REPRODUCIR TODO'}
        </button>
      </div>

      {/* CANALES DEL MIXER */}
      <div className="flex justify-around items-end gap-2 h-80">
        {Object.entries(stems).map(([name, url]) => (
          <div key={name} className="flex flex-col items-center gap-4 h-full">

            <audio
              key={`${name}-${url}`} // La key cambia si la URL cambia, forzando un re-render limpio
              ref={(el) => {
                if (el) audioRefs.current[name] = el;
              }}
              src={url}
              preload="auto"
              crossOrigin="anonymous"
              muted
              onCanPlay={() => console.log(`Audio ${name} cargado correctamente`)}
              onError={(e) => {
                const target = e.target as HTMLAudioElement;
                console.error(`Error en pista ${name}. Código: ${target.error?.code}`);
              }}
            />

            {/* Selector para Fretboard */}
            <button
              onClick={() => onSelectTrack(name)}
              className={`p-2.5 rounded-xl transition-all ${
                selectedTrack === name 
                  ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.6)]' 
                  : 'bg-white/5 text-white/30 hover:bg-white/10'
              }`}
            >
              {selectedTrack === name ? '👁️' : '🔍'}
            </button>

            {/* Solo */}
            <button 
              onClick={() => setSoloTrack(soloTrack === name ? null : name)}
              className={`text-[9px] font-black px-3 py-1 rounded-md transition-colors ${
                soloTrack === name ? 'bg-yellow-400 text-black' : 'bg-white/5 text-white/20'
              }`}
            >
              SOLO
            </button>

            {/* Slider Vertical Estándar */}
            <div className="relative w-10 h-44 bg-black/40 rounded-2xl flex flex-col items-center justify-end p-1.5 border border-white/5 overflow-hidden">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volumes[name] || 0.8}
                onChange={(e) => onChange(name, parseFloat(e.target.value))}
              style={{ 
              writingMode: 'vertical-lr', 
                direction: 'rtl',
                appearance: 'none',
                background: 'transparent'
                } as any}
                className="absolute inset-0 w-full h-full cursor-pointer z-20 opacity-0"
                />

              <div 
            className="w-full rounded-xl transition-all duration-200 relative z-10"
            style={{ 
            height: `${(volumes[name] || 0.8) * 100}%`, 
              backgroundColor: colors[name] || '#666',
              opacity: soloTrack && soloTrack !== name ? 0.2 : 1
                }}
                />
              </div>

              {/* Emoji y Nombre */}
        <div className="flex flex-col items-center">
      <span className="text-xl mb-1">{getEmoji(name)}</span>
      <span className={`text-[9px] font-bold uppercase ${selectedTrack === name ? 'text-cyan-400' : 'text-white/30'}`}>
        {name}
      </span>
        </div>
        </div>
        ))}
              </div>
            </div>
  );
};
