import { useEffect, useRef, useState, useCallback } from 'react';
import { PitchDetector } from 'pitchy';

interface AudioInputProcessorProps {
  onChordDetected: (data: { note: string, voice: string }) => void;
  onPlayStateChange: (isPlaying: boolean) => void;
}

export const AudioInputProcessor = ({ onChordDetected, onPlayStateChange }: AudioInputProcessorProps) => {
  const [hasFile, setHasFile] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const requestRef = useRef<number>();

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
  const analyze = useCallback(() => {
    if (!analyserRef.current || !audioContextRef.current || audioRef.current?.paused) return;

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
  }, [onChordDetected]);

  // LA FUNCIÓN QUE FALTABA O TENÍA OTRO NOMBRE
  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        analyserRef.current = analyser;

        const source = ctx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(ctx.destination);
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      if (audio.paused) {
        await audio.play();
        setIsPlaying(true);
        onPlayStateChange(true);
        analyze();
      } else {
        audio.pause();
        setIsPlaying(false);
        onPlayStateChange(false);
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
      }
    } catch (err) {
      console.error("Error al reproducir:", err);
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
      
      <button 
        onClick={togglePlay} // Ahora sí está definida aquí arriba
        disabled={!hasFile}
        className={`w-full py-4 rounded-xl font-black text-xs transition-all ${
          isPlaying ? 'bg-red-500/20 text-red-500' : 'bg-cyan-500 text-black'
        } disabled:opacity-20`}
      >
        {isPlaying ? 'DETENER SENSOR' : 'REPRODUCIR ARCHIVO'}
      </button>

      <audio ref={audioRef} />
    </div>
  );
};
