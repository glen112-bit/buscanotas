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
  // Añadimos esta prop para poder despertar el audio desde aquí si es necesario
  audioContext?: AudioContext | null; 
}

export const Mixer = ({ 
  stems, 
  volumes, 
  onChange, 
  colors, 
  audioRefs, 
  selectedTrack, 
  onSelectTrack,
  audioContext
}: MixerProps) => {
  const [soloTrack, setSoloTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // 1. Sincronización del tiempo
  useEffect(() => {
    let animationFrameId: number;
    const masterAudio = Object.values(audioRefs.current)[0];
    
    const syncTimer = () => {
      if (masterAudio && !masterAudio.paused) {
        setCurrentTime(masterAudio.currentTime);
      }
      animationFrameId = requestAnimationFrame(syncTimer);
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(syncTimer);
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, audioRefs]);

  // 2. Manejo de Volúmenes y Mute por Solo
  useEffect(() => {
    Object.keys(stems).forEach((track) => {
      const audio = audioRefs.current[track];
      if (audio) {
        const isMutedBySolo = soloTrack !== null && soloTrack !== track;
        audio.volume = isMutedBySolo ? 0 : (volumes[track] ?? 0.8);
      }
    });
  }, [volumes, soloTrack, stems, audioRefs]);

  // 3. Función unificada para seleccionar track y despertar audio
  const handleInternalSelect = async (name: string) => {
    console.log("Mixer: Activando track ->", name);
    
    // Despertar AudioContext si existe y está suspendido
    if (audioContext && audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    // Avisar al Dashboard
    onSelectTrack(name);
  };

  const togglePlay = async () => {
    const audios = Object.values(audioRefs.current).filter(a => a !== null) as HTMLAudioElement[];
    if (audios.length === 0) return;

    if (isPlaying) {
      audios.forEach(a => a.pause());
      setIsPlaying(false);
    } else {
      try {
        if (audioContext && audioContext.state === 'suspended') await audioContext.resume();
        const commonTime = audios[0].currentTime;
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

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#0b0e14]/50 p-6 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-sm">
      
      {/* BARRA DE PROGRESO MASTER */}
      <div className="w-full mb-8 px-2">
        <div className="flex justify-between text-[10px] font-mono text-white/40 mb-2 uppercase tracking-tighter">
          <span>{formatTime(currentTime)}</span>
          <button onClick={togglePlay} className="text-cyan-400 font-bold hover:scale-110 transition-transform">
            {isPlaying ? 'PAUSE' : 'PLAY ALL'}
          </button>
          <span>{formatTime(duration || 0)}</span>
        </div>
        <div className="relative group">
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={currentTime}
            onChange={(e) => {
              const newTime = parseFloat(e.target.value);
              Object.values(audioRefs.current).forEach(a => { if(a) a.currentTime = newTime; });
              setCurrentTime(newTime);
            }}
            className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-cyan-500 z-10 relative"
          />
          <div className="absolute top-0 left-0 h-1.5 bg-cyan-500/30 rounded-full pointer-events-none"
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />
        </div>
      </div>

      {/* CANALES DEL MIXER */}
      <div className="flex justify-around items-end gap-2 h-80">
        {Object.entries(stems).map(([name, url]) => (
          <div key={name} className="flex flex-col items-center gap-4 h-full">
            <audio
              ref={(el) => { if (el) audioRefs.current[name] = el; }}
              src={url}
              preload="auto"
              crossOrigin="anonymous"
              onLoadedMetadata={(e) => {
                if (name === Object.keys(stems)[0]) setDuration(e.currentTarget.duration);
              }}
            />

            {/* BOTÓN SELECTOR (El que activa el Fretboard) */}
            <button
              onClick={() => handleInternalSelect(name)}
              className={`p-2.5 rounded-xl transition-all duration-300 ${
                selectedTrack === name 
                  ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.5)] scale-110' 
                  : 'bg-white/5 text-white/30 hover:bg-white/10'
              }`}
            >
              {selectedTrack === name ? '👁️' : '🔍'}
            </button>

            {/* SOLO BUTTON */}
            <button 
              onClick={() => setSoloTrack(soloTrack === name ? null : name)}
              className={`text-[9px] font-black px-3 py-1 rounded-md transition-colors ${
                soloTrack === name ? 'bg-yellow-400 text-black' : 'bg-white/5 text-white/20'
              }`}
            >
              SOLO
            </button>

            {/* SLIDER VERTICAL */}
            <div className="relative w-10 h-44 bg-black/40 rounded-2xl flex flex-col items-center justify-end p-1.5 border border-white/5 overflow-hidden">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volumes[name] || 0.8}
                onChange={(e) => onChange(name, parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full cursor-pointer z-20 opacity-0"
                style={{ writingMode: 'vertical-lr', direction: 'rtl' } as any}
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

            {/* NOMBRE */}
            <div className="flex flex-col items-center">
              <span className="text-xl mb-1">{getEmoji(name)}</span>
              <span className={`text-[9px] font-bold uppercase tracking-widest ${selectedTrack === name ? 'text-cyan-400' : 'text-white/30'}`}>
                {name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
