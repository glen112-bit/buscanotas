
import { useEffect, useRef, useState, useCallback } from 'react';
import { PitchDetector } from 'pitchy';

interface AudioInputProcessorProps {
  onChordDetected: (data: { note: string, voice: string }) => void;
  onPlayStateChange: (isPlaying: boolean) => void;
}

export const AudioInputProcessor = ({ onChordDetected, onPlayStateChange }: AudioInputProcessorProps) => {
  const [hasFile, setHasFile] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [inputSource, setInputSource] = useState<'file' | 'mic'>('file');



  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const requestRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);

  // Auxiliar: Frecuencia -> Nota Musical
  const freqToNote = (frequency: number) => {
    const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const halfStepsFromC0 = Math.round(12 * Math.log2(frequency / 16.35));
    const index = halfStepsFromC0 % 12;
    const octave = Math.floor(halfStepsFromC0 / 12);
    return NOTES[index < 0 ? index + 12 : index] + octave;
  };

const startMicAnalysis = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const source = audioContextRef.current.createMediaStreamSource(stream);
  source.connect(analyserRef.current);
  analyze(); // Inicia el bucle de Pitchy
};
// Inicializador del contexto de audio (Singleton)
  const initAudio = () => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      return { ctx, analyser };
    }
    return { ctx: audioContextRef.current, analyser: analyserRef.current! };
  };


  const analyze = useCallback(() => {
    if (!analyserRef.current || !audioContextRef.current) return;
    
    // Si es archivo y está pausado, no analizar
    if (inputSource === 'file' && audioRef.current?.paused) return;

    const buffer = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(buffer);

    const detector = PitchDetector.forFloat32Array(analyserRef.current.fftSize);
    const [pitch, clarity] = detector.findPitch(buffer, audioContextRef.current.sampleRate);

    if (clarity > 0.85 && pitch > 50 && pitch < 2000) {
      const note = freqToNote(pitch);
      let voice = "Media";
      if (pitch < 250) voice = "Baja (Bajo)";
      else if (pitch > 500) voice = "Alta (Soprano)";
      onChordDetected({ note, voice });
    }

    requestRef.current = requestAnimationFrame(analyze);
  }, [onChordDetected, inputSource]);  // LA FUNCIÓN QUE FALTABA O TENÍA OTRO NOMBRE

const toggleMic = async () => {
    if (isPlaying && inputSource === 'mic') {
      streamRef.current?.getTracks().forEach(track => track.stop());
      setIsPlaying(false);
      onPlayStateChange(false);
      return;
    }

    const { ctx, analyser } = initAudio();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      setInputSource('mic');
      setIsPlaying(true);
      onPlayStateChange(true);
      analyze();
    } catch (err) {
      console.error("Error acceso mic:", err);
    }
  };

const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    const { ctx, analyser } = initAudio();
    
    // Conectar el audio solo una vez
    if (ctx.state === 'suspended') await ctx.resume();

    try {
      if (audio.paused) {
        // Asegurar que la fuente esté conectada al analizador
        const source = ctx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(ctx.destination);
        
        await audio.play();
        setInputSource('file');
        setIsPlaying(true);
        onPlayStateChange(true);
        analyze();
      } else {
        audio.pause();
        setIsPlaying(false);
        onPlayStateChange(false);
      }
    } catch (err) {
      // Si ya estaba conectado, solo dar play
      audio.play();
      setIsPlaying(true);
      onPlayStateChange(true);
      analyze();
    }
  };// Función para formatear segundos a MM:SS
  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Actualizar la barra de progreso mientras suena
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration;
      setProgress((current / total) * 100);
      setCurrentTime(formatTime(current));
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(formatTime(audioRef.current.duration));
    }
  };

  // Función para saltar a un punto de la canción al hacer clic en la barra
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const seekTo = (Number(e.target.value) / 100) * audioRef.current.duration;
      audioRef.current.currentTime = seekTo;
      setProgress(Number(e.target.value));
    }
  };
  return (
    <div className="p-6 bg-slate-900/80 border border-slate-700 rounded-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className={`h-2 w-2 rounded-full ${hasFile ? 'bg-cyan-400' : 'bg-slate-600'}`} />
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          Sensor de Audio JS
        </span>
      </div>

      <input 
        type="file" 
        accept="audio/*" 
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && audioRef.current) {
            audioRef.current.src = URL.createObjectURL(file);
            setHasFile(true);
          }
        }}

        className="block w-full text-xs text-slate-500 mb-6 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-slate-800 file:text-cyan-400 cursor-pointer"
      />
 {/* BARRA DE NAVEGACIÓN DEL ARCHIVO (SEEKBAR) */}
            {hasFile && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex justify-between text-[10px] font-mono text-slate-500 tracking-widest px-1">
                  <span>{currentTime}</span>
                  <span>{duration}</span>
                </div>
                <div className="relative group">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={progress} 
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all"
                  />
                  {/* Reflejo de luz bajo la barra */}
                  <div 
                    className="absolute top-0 left-0 h-1.5 bg-cyan-500/30 blur-md pointer-events-none transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}     
      <button 
        onClick={togglePlay} // Ahora sí está definida aquí arriba
        disabled={!hasFile}
        className={`w-full py-4 rounded-xl font-black text-xs transition-all ${
          isPlaying ? 'bg-red-500/20 text-red-500' : 'bg-cyan-500 text-black'
        } disabled:opacity-20`}
      >
        {isPlaying ? 'DETENER SENSOR' : 'REPRODUCIR ARCHIVO'}
      </button>

      <audio ref={audioRef}
        ref={audioRef} 
        onTimeUpdate={handleTimeUpdate} // Actualiza progreso y tiempo actual
        onLoadedMetadata={handleLoadedMetadata} // Carga la duración total
        onEnded={() => {
          setIsPlaying(false);
          onPlayStateChange(false);
          setProgress(0);
        }}
      />
    </div>
  );
};
