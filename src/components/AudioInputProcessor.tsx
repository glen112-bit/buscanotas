import React, { useRef, useState, useCallback, useEffect } from 'react';

interface AudioInputProcessorProps {
  onChordDetected: (data: { note: string; voice: string; measure?: number; beat?: number }) => void;
  onPlayStateChange: (isPlaying: boolean) => void;
}

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const AudioInputProcessor = ({ onChordDetected, onPlayStateChange }: AudioInputProcessorProps) => {
  const [sourceType, setSourceType] = useState<'mic' | 'file'>('file');
  const [isActive, setIsActive] = useState(false);
  const [currentNote, setCurrentNote] = useState("---");
  const [bpm, setBpm] = useState(120);
  const [fileName, setFileName] = useState<string | null>(null);
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const requestRef = useRef<number>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const lastDetectionTime = useRef(0);
  const lastStableNote = useRef("---");
  const voteStack = useRef<string[]>([]);

  // --- GENERADOR DE WAVEFORM REALISTA ---
  const generateWaveform = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const rawData = audioBuffer.getChannelData(0); 
    const samples = 120; 
    const blockSize = Math.floor(rawData.length / samples);
    const peaks = [];

    for (let i = 0; i < samples; i++) {
      let max = 0;
      for (let j = 0; j < blockSize; j++) {
        const val = Math.abs(rawData[i * blockSize + j]);
        if (val > max) max = val;
      }
      peaks.push(max);
    }
    setWaveformPeaks(peaks);
    audioCtx.close();
  };

  // --- LÓGICA DE CONTROL DE AUDIO ---
  const toggleSensor = async () => {
    if (isActive) {
      setIsActive(false);
      onPlayStateChange(false);
      if (audioRef.current) audioRef.current.pause();
    } else {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048;
        analyserRef.current.smoothingTimeConstant = 0.8;
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      if (sourceType === 'file' && audioRef.current?.src) {
        try {
          // Conectar solo una vez
          const source = audioContextRef.current.createMediaElementSource(audioRef.current);
          source.connect(analyserRef.current);
          analyserRef.current.connect(audioContextRef.current.destination);
        } catch (e) { /* Ya conectado */ }
        audioRef.current.play();
      }
      setIsActive(true);
      onPlayStateChange(true);
    }
  };

  // --- MOTOR DE DETECCIÓN MUSICAL ---
  const processAudio = useCallback(() => {
    if (!analyserRef.current || !isActive) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    let maxVal = 0;
    let maxIndex = -1;

    // Filtro de rango de guitarra (ignora sibilancias de voz)
    const low = Math.floor(80 * bufferLength / (audioContextRef.current!.sampleRate / 2));
    const high = Math.floor(1000 * bufferLength / (audioContextRef.current!.sampleRate / 2));

    for (let i = low; i < high; i++) {
      if (dataArray[i] > maxVal) {
        maxVal = dataArray[i];
        maxIndex = i;
      }
    }

    const windowMs = (60 * 1000 / bpm) / 4; // Ajuste por BPM
    const now = Date.now();

    if (maxVal > 85) {
      const freq = maxIndex * (audioContextRef.current!.sampleRate / 2) / bufferLength;
      const midi = Math.round(12 * Math.log2(freq / 440) + 69);
      const detectedNote = NOTES[midi % 12];
      voteStack.current.push(detectedNote);

      if (now - lastDetectionTime.current > windowMs) {
        const counts = voteStack.current.reduce((a: any, b) => (a[b] = (a[b] || 0) + 1, a), {});
        const winner = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        const confidence = counts[winner] / voteStack.current.length;

        if (confidence > 0.75 && winner !== lastStableNote.current) {
          lastStableNote.current = winner;
          setCurrentNote(winner);
          onChordDetected({ note: winner, voice: "Estable" });
        }
        voteStack.current = [];
        lastDetectionTime.current = now;
      }
    }

    requestRef.current = requestAnimationFrame(processAudio);
  }, [isActive, bpm, onChordDetected]);

  // --- DIBUJO OSCILOSCOPIO ---
  const drawOscilloscope = useCallback(() => {
    if (!analyserRef.current || !isActive || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const bufferLength = analyserRef.current.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteTimeDomainData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#22d3ee';
    ctx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.stroke();
    requestAnimationFrame(drawOscilloscope);
  }, [isActive]);

  useEffect(() => {
    if (isActive) {
      requestRef.current = requestAnimationFrame(processAudio);
      drawOscilloscope();
    }
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isActive, processAudio, drawOscilloscope]);

  // --- EVENTOS DE AUDIO ---
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const upTime = () => { setCurrentTime(audio.currentTime); setDuration(audio.duration || 0); };
    audio.addEventListener('timeupdate', upTime);
    audio.addEventListener('loadedmetadata', upTime);
    return () => { audio.removeEventListener('timeupdate', upTime); audio.removeEventListener('loadedmetadata', upTime); };
  }, []);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#0b0e14] border border-white/10 rounded-[2.5rem] p-8 text-white shadow-2xl w-full max-w-xl mx-auto transition-all">
      
      {/* SWITCHER MIC/FILE */}
      <div className="flex bg-black/40 p-1 rounded-2xl mb-8 border border-white/5">
        {(['mic', 'file'] as const).map(mode => (
          <button key={mode} onClick={() => { setIsActive(false); setSourceType(mode); }}
            className={`flex-1 py-3 text-[11px] font-black rounded-xl transition-all tracking-widest ${sourceType === mode ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-slate-500 hover:text-white'}`}>
            {mode.toUpperCase()}
          </button>
        ))}
      </div>

      {/* MONITOR DE NOTA CON OSCILOSCOPIO */}
      <div className="bg-black rounded-[2.5rem] py-10 border border-white/5 flex flex-col items-center justify-center mb-8 relative overflow-hidden group">
        <canvas ref={canvasRef} width={400} height={150} className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" />
       
        <div className={`relative z-10 text-[9px] uppercase tracking-[0.4em] mt-4 font-black transition-colors ${isActive ? 'text-cyan-400 animate-pulse' : 'text-slate-600'}`}>
          {isActive ? 'Engine Active' : 'System Standby'}
        </div>
      </div>

      {/* WAVEFORM & SEEKER */}
      {sourceType === 'file' && fileName && (
        <div className="mb-8">
          <div className="flex justify-between text-[11px] font-mono mb-3 px-2">
            <span className="text-cyan-400 font-bold">{formatTime(currentTime)}</span>
            <span className="text-slate-600">{formatTime(duration)}</span>
          </div>

          <div className="relative h-24 w-full bg-black/60 rounded-2xl border border-white/5 overflow-hidden group">
            <div className="absolute inset-0 flex items-center justify-between px-3 gap-[2px]">
              {waveformPeaks.map((peak, i) => {
                const progress = (currentTime / duration) * 100;
                const currentBarPos = (i / waveformPeaks.length) * 100;
                const isPlayed = currentBarPos <= progress;
                
                let color = 'rgba(255,255,255,0.1)';
                if (isPlayed) {
                  if (peak > 0.75) color = '#ef4444'; 
                  else if (peak > 0.45) color = '#f59e0b';
                  else color = '#22d3ee';
                }

                return (
                  <div key={i} className="flex-1 rounded-full transition-all duration-300"
                    style={{ height: `${Math.max(10, peak * 90)}%`, backgroundColor: color }} />
                );
              })}
            </div>
            <input type="range" min="0" max={duration || 0} step="0.01" value={currentTime}
              onChange={(e) => { if (audioRef.current) audioRef.current.currentTime = parseFloat(e.target.value); }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30" />
            <div className="absolute top-0 bottom-0 w-[2px] bg-white z-20 pointer-events-none shadow-[0_0_15px_white]"
              style={{ left: `${(currentTime / duration) * 100}%` }} />
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* CARGA DE ARCHIVO */}
        {sourceType === 'file' && !isActive && (
          <div className="relative">
            <input type="file" id="file-upload" accept="audio/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && audioRef.current) {
                audioRef.current.src = URL.createObjectURL(file);
                setFileName(file.name);
                generateWaveform(file);
              }
            }} className="hidden" />
            <label htmlFor="file-upload" className="flex flex-col items-center py-6 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/[0.02] hover:border-cyan-500/50 transition-all">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                {fileName ? 'Cambiar Archivo' : 'Cargar Audio'}
              </span>
              {fileName && <span className="text-[9px] text-cyan-500 mt-2 italic px-4 text-center">{fileName}</span>}
            </label>
          </div>
        )}

       

        <button onClick={toggleSensor} 
          className={`w-full py-5 rounded-2xl font-black text-[11px] tracking-[0.2em] transition-all shadow-xl ${isActive ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-white text-black hover:scale-[1.02]'}`}>
          {isActive ? 'TERMINAR SESIÓN' : 'INICIAR ANÁLISIS'}
        </button>
      </div>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
};
