import React, { useState, useEffect } from 'react';

interface MixerProps {
  volumes: { guitar: number; bass: number; vocals: number };
  onChange: (track: 'guitar' | 'bass' | 'vocals', value: number) => void;
  colors: { guitar: string; bass: string; vocals: string };
}

export const Mixer = ({ volumes, onChange, colors }: MixerProps) => {
  const [soloTrack, setSoloTrack] = useState<'guitar' | 'bass' | 'vocals' | null>(null);

  const handleSolo = (track: 'guitar' | 'bass' | 'vocals') => {
    const newSolo = soloTrack === track ? null : track;
    setSoloTrack(newSolo);
    
    // Si activamos solo, bajamos el volumen de los demás a 0 momentáneamente
    // Si desactivamos, restauramos (esto se gestiona mejor en el padre, 
    // pero aquí aplicamos la lógica visual)
  };

  const isMutedBySolo = (track: string) => soloTrack !== null && soloTrack !== track;

  return (
    <div className="bg-[#0f1218] p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
      <div className="flex justify-around items-end h-56 gap-4">
        {(['guitar', 'bass', 'vocals'] as const).map((track) => {
          const muted = isMutedBySolo(track);
          
          return (
            <div 
              key={track} 
              className={`flex flex-col items-center gap-4 w-full transition-all duration-500 ${muted ? 'opacity-20 scale-95' : 'opacity-100'}`}
            >
              {/* BOTÓN SOLO */}
              <button
                onClick={() => handleSolo(track)}
                className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-tighter transition-all border ${
                  soloTrack === track 
                    ? 'bg-yellow-500 border-yellow-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]' 
                    : 'bg-black/40 border-white/10 text-slate-500 hover:border-white/30'
                }`}
              >
                SOLO
              </button>

              {/* Fader Container */}
              <div className="relative h-32 w-3 bg-slate-900 rounded-full border border-white/5 shadow-inner">
                {/* Visual Fill */}
                <div 
                  className="absolute bottom-0 w-full rounded-full transition-all duration-200"
                  style={{ 
                    height: `${volumes[track] * 100}%`, 
                    backgroundColor: colors[track],
                    boxShadow: `0 0 20px ${colors[track]}44`
                  }} 
                />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volumes[track]}
                  onChange={(e) => onChange(track, parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              {/* Label & Icon */}
              <div className="flex flex-col items-center">
                <span 
                  className="text-[10px] font-black tracking-widest uppercase mb-1 transition-colors" 
                  style={{ color: muted ? '#475569' : colors[track] }}
                >
                  {track}
                </span>
                <span className="text-xl filter grayscale-[0.5]" style={{ opacity: muted ? 0.3 : 1 }}>
                  {track === 'guitar' ? '🎸' : track === 'bass' ? '🎻' : '🎤'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
