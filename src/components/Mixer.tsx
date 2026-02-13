import React, { useState, useEffect } from 'react';

interface MixerProps {
  stems: { [key: string]: string };
  volumes: { [key: string]: number };
  onChange: (track: string, value: number) => void;
  colors: { [key: string]: string };
  audioRefs: React.MutableRefObject<{ [key: string]: HTMLAudioElement | null }>;
}

export const Mixer = ({ stems, volumes, onChange, colors, audioRefs }: MixerProps) => {
  const [soloTrack, setSoloTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // 1. Efecto para manejar el volumen y la lógica de Solo
  useEffect(() => {
    Object.keys(stems).forEach((track) => {
      const audio = audioRefs.current[track];
      if (audio) {
        const isMutedBySolo = soloTrack !== null && soloTrack !== track;
        // Aplicamos volumen 0 si hay otra pista en SOLO, o el volumen del slider
        audio.volume = isMutedBySolo ? 0 : (volumes[track] ?? 0.8);
      }
    });
  }, [volumes, soloTrack, stems, audioRefs]);

  const togglePlay = async () => {
    const audios = Object.values(audioRefs.current).filter(a => a !== null) as HTMLAudioElement[];
    if (audios.length === 0) return;
// Dentro de la función que inicia el Playback
if (audioContext.state === 'suspended') {
  await audioContext.resume();
}
    if (isPlaying) {
      audios.forEach(a => a.pause());
      setIsPlaying(false);
    } else {
      try {
        // Sincronizar todos al mismo tiempo exacto
        const commonTime = audios[0].currentTime;
        const playPromises = audios.map(async (a) => {
          a.currentTime = commonTime;
          return a.play();
        });

        await Promise.all(playPromises);
        setIsPlaying(true);
      } catch (error) {
        console.error("Error al reproducir stems:", error);
      }
    }
  };

  const handleSolo = (track: string) => {
    setSoloTrack(prev => (prev === track ? null : track));
  };

  return (
    <div className="bg-[#0b0e14] p-6 rounded-[2.5rem] border border-white/5 shadow-2xl">
      {/* MOTORES DE AUDIO (Ocultos y fuera de los bucles visuales) */}
      <div className="hidden">
        {Object.entries(stems).map(([name, url]) => (
          <div key={name}>
            <audio 
              ref={el => audioRefs.current[name] = el} 
              src={url} 
              loop 
            />
            {/* Controles de volumen aquí */}
          </div>
        ))}
      </div>

      <div className="flex justify-center mb-10">
        <button 
          onClick={togglePlay}
          className={`px-8 py-3 rounded-full font-black tracking-widest transition-all ${
            isPlaying 
              ? 'bg-red-500/20 text-red-500 border border-red-500/50' 
              : 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]'
          }`}
        >
          {isPlaying ? 'PAUSE SESSION' : 'START PLAYBACK'}
        </button>
      </div>

      <div className="flex justify-between items-end gap-2 h-72">
        {
          Object.entries(stems).map(([name, url]) => (
            <div key={name}>
              <audio 
                ref={(el) => {
                  if (el) {
                    audioRefs.current[name] = el;
                    // Forzamos la carga si el src cambió
                    if (el.src !== url) {
                      el.src = url as string;
                      el.load(); 
                    }
                  }
                }} 
                loop
                preload="auto"
              />
              {/* Controles de volumen... */}
            </div>
          ))        }
      </div>
    </div>
  );
};

const getEmoji = (track: string) => {
  const t = track.toLowerCase();
  if (t.includes('vocal')) return '🎤';
  if (t.includes('bass')) return '🎸';
  if (t.includes('drum')) return '🥁';
  if (t.includes('guitar')) return '🎸';
  return '🎼';
};
