import React, { useRef, useState, useEffect } from 'react';
import { Mixer } from './Mixer';

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const TRACK_THEME = { guitar: '#22d3ee', bass: '#facc15', vocals: '#f87171' };

export const AudioInputProcessor = ({ onChordDetected, onPlayStateChange }: any) => {
  const [isActive, setIsActive] = useState(false);
  const [currentNote, setCurrentNote] = useState("---");
  const [confidence, setConfidence] = useState(0);
  const [isFrozen, setIsFrozen] = useState(false);
  const [volumes, setVolumes] = useState({ guitar: 1.0, bass: 0.8, vocals: 0.8 });
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodesRef = useRef<{ [key: string]: GainNode }>({});
  const audioRef = useRef<HTMLAudioElement>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const historyBuffer = useRef<string[]>([]);
  const STEMS = ['vocals', 'drums', 'bass', 'other'] as const;
  // Cambiamos de una referencia única a un mapa de referencias
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  // El sourceNode también debe ser un mapa para no perder las conexiones
  const sourceNodesRef = useRef<{ [key: string]: MediaElementAudioSourceNode }>({});



  // --- SINCRONIZACIÓN DE TIEMPO ---
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updateProgress = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
    };
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateProgress);
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateProgress);
    };
  }, []);

  // --- MOTOR DE ANÁLISIS (SENSILIBILIDAD MEJORADA) ---
  useEffect(() => {
    let animationFrameId: number;
    let lastNoteTime = Date.now();

    const runAnalysis = () => {
      if (!analyserRef.current || !isActive || isFrozen) return;

      const bufferLength = analyserRef.current.fftSize;
      const buffer = new Float32Array(bufferLength);
      analyserRef.current.getFloatTimeDomainData(buffer);

      // MEJORA 1: Umbral RMS más sensible (0.015 -> 0.008)
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) sum += buffer[i] * buffer[i];
      const rms = Math.sqrt(sum / bufferLength);

      if (rms < 0.008) { 
        setConfidence(prev => Math.max(0, prev - 5));
        if (confidence < 2) setCurrentNote("---");
        animationFrameId = requestAnimationFrame(runAnalysis);
        return;
      }

      // AUTOCORRELACIÓN
      let bestR = -1;
      let bestPeriod = -1;
      const sampleRate = audioContextRef.current?.sampleRate || 44100;
      const minPeriod = Math.floor(sampleRate / 1000); 
      const maxPeriod = Math.floor(sampleRate / 80);

      for (let period = minPeriod; period < maxPeriod; period++) {
        let r = 0;
        for (let i = 0; i < bufferLength - period; i++) {
          r += buffer[i] * buffer[i + period];
        }
        if (r > bestR) {
          bestR = r;
          bestPeriod = period;
        }
      }

      const freq = sampleRate / bestPeriod;
      const midi = Math.round(12 * Math.log2(freq / 440) + 69);
      const detectedNote = NOTES[midi % 12];

      // MEJORA 2: Buffer de votación más ágil (25 -> 20 muestras)
      historyBuffer.current.push(detectedNote);
      if (historyBuffer.current.length > 20) historyBuffer.current.shift();

      const counts: Record<string, number> = {};
      historyBuffer.current.forEach(n => counts[n] = (counts[n] || 0) + 1);
      const [mostFrequent, count] = Object.entries(counts).reduce((a, b) => b[1] > a[1] ? b : a);

      const now = Date.now();
      // MEJORA 3: Consenso reducido (18 -> 12) y tiempo de reacción (150ms -> 100ms)
      if (count > 12 && now - lastNoteTime > 100) { 
        if (currentNote !== mostFrequent) {
          setCurrentNote(mostFrequent);
          lastNoteTime = now;
          if (onChordDetected) onChordDetected({ note: mostFrequent });
        }
        setConfidence(100);
      } else {
        setConfidence(Math.floor((count / 20) * 100));
      }

      animationFrameId = requestAnimationFrame(runAnalysis);
    };

    if (isActive) runAnalysis();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isActive, isFrozen, currentNote, confidence, onChordDetected]);

  const handleMixerChange = (track: 'guitar' | 'bass' | 'vocals', value: number) => {
    setVolumes(prev => ({ ...prev, [track]: value }));
    const node = gainNodesRef.current[track];
    const ctx = audioContextRef.current;
    if (node && ctx) {
      node.gain.setTargetAtTime(value, ctx.currentTime, 0.02);
    }
  };



  
  const toggleSensor = async () => {
  if (isActive) {
    Object.values(audioRefs.current).forEach(a => a?.pause());
    setIsActive(false);
    return;
  }

  if (!audioContextRef.current) {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  const ctx = audioContextRef.current;
  if (ctx.state === 'suspended') await ctx.resume();

  if (!analyserRef.current) {
    analyserRef.current = ctx.createAnalyser();
    analyserRef.current.fftSize = 2048;
  }

  // Recorremos las pistas configuradas en nuestro estado de volúmenes
  const tracks = Object.keys(volumes) as Array<keyof typeof volumes>;

  tracks.forEach((track) => {
    const audioElem = audioRefs.current[track];
    
    // Si el audio existe y aún no tiene un "cable" (source node) conectado
    if (audioElem && !sourceNodesRef.current[track]) {
      audioElem.crossOrigin = "anonymous";
      const source = ctx.createMediaElementSource(audioElem);
      sourceNodesRef.current[track] = source;

      const gGain = ctx.createGain();
      gGain.gain.setValueAtTime(volumes[track], ctx.currentTime);
      gainNodesRef.current[track] = gGain;

      // La guitarra (o el archivo único) va al analizador
      if (track === 'guitar') {
        source.connect(analyserRef.current!);
      }
      
      // Conexión al volumen y a los altavoces
      source.connect(gGain).connect(ctx.destination);
    }
  });

  // Reproducción sincronizada
  const audiosToPlay = Object.values(audioRefs.current).filter(Boolean) as HTMLAudioElement[];
  
  if (audiosToPlay.length > 0) {
    try {
      await Promise.all(audiosToPlay.map(a => a.play()));
      setIsActive(true);
      onPlayStateChange(true);
    } catch (err) {
      console.error("Error de reproducción:", err);
    }
  } else {
    alert("Primero carga un archivo de audio");
  }
};;



  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-xl mx-auto p-4 bg-[#0b0e14] rounded-[3rem] border border-white/5 shadow-2xl">
      
      {/* MONITOR VISUAL (REINTEGRADO) */}

      {/* BARRA DE TIEMPO */}
      <div className="px-6 flex flex-col gap-2">
        <div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <input 
          type="range" min="0" max={duration || 0} step="0.1" value={currentTime}
          onChange={(e) => { if (audioRef.current) audioRef.current.currentTime = parseFloat(e.target.value); }}
          className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-500"
        />
      </div>

      <Mixer volumes={volumes} onChange={handleMixerChange} colors={TRACK_THEME} />

      <div className="grid grid-cols-2 gap-4">
        <label className="flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl py-4 cursor-pointer hover:bg-white/10 transition-all">
         <input type="file" accept="audio/*" onChange={(e) => {
      const file = e.target.files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        // Creamos el elemento de audio para la pista 'guitar'
        const audio = new Audio(url);
        audioRefs.current['guitar'] = audio; // <--- VITAL: Lo guardamos aquí
        setIsActive(false);
        setCurrentNote("---");
      }
  }} className="hidden" />
          <span className="text-[10px] font-black uppercase text-slate-300">Load Audio</span>
        </label>
        <button onClick={() => setIsFrozen(!isFrozen)} className={`rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest border transition-all ${isFrozen ? 'bg-blue-600 border-blue-400 text-white' : 'text-slate-400 border-white/10'}`}>
          {isFrozen ? 'Unfreeze' : 'Freeze Note'}
        </button>
      </div>

      <button onClick={toggleSensor} className={`w-full py-6 rounded-[1.5rem] font-black text-xs tracking-[0.3em] transition-all ${isActive ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-white text-black'}`}>
        {isActive ? 'STOP ANALYSIS' : 'START ANALYSIS'}
      </button>

      <audio ref={audioRef} onEnded={() => setIsActive(false)} />
    </div>
  );
};
