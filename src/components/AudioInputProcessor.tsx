import React, { useState, useRef, useEffect } from 'react';
import { Mixer } from './Mixer'; 

const API_KEY = 'L6A6IpxuJSVbM8MPwXWIbaF8YIDJsn';
const API_BASE = "/api_mvsep";
const PROXY_PREFIX = '/api_mvsep';

const TRACK_COLORS: { [key: string]: string } = {
  vocals: '#22d3ee',
  drums: '#f472b6',
  bass: '#fbbf24',
  guitar: '#a78bfa',
  other: '#94a3b8',
  instrumental: '#60a5fa'
};

// Notas para el algoritmo de detección
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const AudioInputProcessor = ({ onPlayStateChange, onTrackSelect, onNoteDetected }: any) => {
  const [stems, setStems] = useState<{ [key: string]: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [volumes, setVolumes] = useState<{ [key: string]: number }>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const requestRef = useRef<number>();

  // --- 1. FUNCIÓN DE DETECCIÓN DE NOTAS (Pitch Detection) ---
  const startNoteDetection = () => {
    if (!analyserRef.current || !onNoteDetected) return;

    const buffer = new Float32Array(analyserRef.current.fftSize);
    
    const performDetection = () => {
      analyserRef.current!.getFloatTimeDomainData(buffer);
      
      // Algoritmo de Autocorrelación simple para detectar frecuencia (Hz)
      const pitch = autoCorrelate(buffer, audioCtxRef.current!.sampleRate);

      if (pitch !== -1) {
        // Convertir Hz a nombre de nota (Ej: 440Hz -> A4)
        const noteNum = 12 * (Math.log(pitch / 440) / Math.log(2)) + 69;
        const noteName = NOTE_NAMES[Math.round(noteNum) % 12];
        onNoteDetected(noteName); // Enviamos la nota al Dashboard
      }

      requestRef.current = requestAnimationFrame(performDetection);
    };

    performDetection();
  };

  // Helper matemático para detectar frecuencia fundamental
  const autoCorrelate = (buffer: Float32Array, sampleRate: number) => {
    let SIZE = buffer.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1; // Silencio

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
    for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buffer[SIZE - i]) < thres) { r2 = SIZE - i; break; }

    let buf = buffer.slice(r1, r2);
    SIZE = buf.length;

    let c = new Float32Array(SIZE).fill(0);
    for (let i = 0; i < SIZE; i++)
      for (let j = 0; j < SIZE - i; j++) c[i] = c[i] + buf[j] * buf[j + i];

    let d = 0; while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < SIZE; i++) if (c[i] > maxval) { maxval = c[i]; maxpos = i; }

    return sampleRate / maxpos;
  };

  // --- 2. GESTIÓN DE AUDIO Y REPRODUCCIÓN ---
  const handleMixerVolumeChange = (track: string, value: number) => {
    setVolumes(prev => ({ ...prev, [track]: value }));
  };

  const handleTrackSelection = (name: string) => {
    setSelectedTrack(name);
    if (onTrackSelect) onTrackSelect(name);
  };

  const toggleMasterPlay = async () => {
    const audios = Object.values(audioRefs.current).filter(a => a !== null) as HTMLAudioElement[];
    if (audios.length === 0) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
    }

    if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();

    if (isPlaying) {
      audios.forEach(a => a.pause());
      cancelAnimationFrame(requestRef.current!);
      setIsPlaying(false);
      onPlayStateChange(false);
    } else {
      try {
        // Conectar la pista de guitarra (o la primera disponible) al analizador
        const guitarTrack = audioRefs.current['guitar'] || audios[0];
        const source = audioCtxRef.current.createMediaElementSource(guitarTrack!);
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioCtxRef.current.destination);

        const startTime = audios[0].currentTime;
        await Promise.all(audios.map(async (a) => {
          a.currentTime = startTime;
          return a.play();
        }));

        setIsPlaying(true);
        onPlayStateChange(true);
        startNoteDetection(); // <--- INICIAMOS LA DETECCIÓN AQUÍ
      } catch (err) {
        console.error("Error al iniciar:", err);
      }
    }
  };

  // --- 3. LOGICA DE API (waitForMVSepTask, onChange, etc.) ---
  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    setStatusMessage("Subiendo audio...");
    try {
      const formData = new FormData();
      formData.append('api_token', API_KEY);
      formData.append('model', '1'); 
      formData.append('audiofile', file);
      const resp = await fetch(`${PROXY_PREFIX}/api/separation/create`, { method: 'POST', body: formData });
      const result = await resp.json();
      if (resp.ok && result.success) {
        const secureFiles = await waitForMVSepTask(result.data.hash);
        setupAudioStems(secureFiles);
      }
    } catch (error: any) {
      setStatusMessage(`Fallo: ${error.message}`);
      setIsProcessing(false);
    }
  };

  const waitForMVSepTask = async (hash: string): Promise<any> => {
    const url = `${PROXY_PREFIX}/api/separation/get?hash=${hash}&api_token=${API_KEY}`;
    while (true) {
      const response = await fetch(url);
      const res = await response.json();
      const status = res.data?.status || res.status;
      if (status === 'done') return await downloadFiles(res.data?.files || res.files);
      if (status === 'error') throw new Error("Error en IA");
      setStatusMessage(`Procesando IA...`);
      console.log(`Estado: ${status} | Posición: ${order} | Progreso: ${progress}%`);
      await new Promise(r => setTimeout(r, 5000));
    }
  };

  const downloadFiles = async (files: any) => {
    setStatusMessage("Descargando pistas...");
    const localStems: { [key: string]: string } = {};
    const trackNames: { [key: string]: string } = { "0": "drums", "1": "bass", "2": "guitar", "3": "vocals" };
    for (const [id, value] of Object.entries(files)) {
      const fileUrl = typeof value === 'string' ? value : (value as any).url;
      const resp = await fetch(fileUrl.replace('https://mvsep.com', API_BASE));
      const blob = await resp.blob();
      localStems[trackNames[id] || `track_${id}`] = URL.createObjectURL(blob);
    }
    return localStems;
  };

  const setupAudioStems = (files: { [key: string]: string }) => {
    const initialVols: any = {};
    Object.keys(files).forEach(k => initialVols[k] = 0.8);
    setVolumes(initialVols);
    setStems(files);
    setStatusMessage("");
    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-xl mx-auto p-4 bg-[#0b0e14] rounded-[3rem] border border-white/5 shadow-2xl">
      <div className="w-full">
        {statusMessage ? (
          <div className="p-10 border-2 border-dashed border-cyan-500/30 rounded-3xl text-center">
            <p className="text-cyan-400 font-mono text-xs uppercase animate-pulse">{statusMessage}</p>
          </div>
        ) : !stems ? (
          <label className="flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-3xl py-12 cursor-pointer hover:bg-white/10 transition-all">
            <input type="file" className="hidden" onChange={onChange} accept="audio/*" />
            <span className="text-white font-bold uppercase tracking-widest">
              {isProcessing ? "Procesando..." : "Cargar Audio"}
            </span>
          </label>
        ) : (
          <Mixer 
            stems={stems} 
            volumes={volumes} 
            onChange={handleMixerVolumeChange} 
            colors={TRACK_COLORS} 
            audioRefs={audioRefs}
            selectedTrack={selectedTrack}
            onSelectTrack={handleTrackSelection}
            audioContext={audioCtxRef.current}
          />
        )}
      </div>

      <div className="mt-8 flex flex-col items-center gap-6">
        <button
          onClick={toggleMasterPlay}
          className="px-12 py-5 bg-cyan-500 text-black rounded-full font-black text-xl shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:scale-105 transition-all"
        >
          {isPlaying ? '⏸ PAUSAR SESIÓN' : '🚀 ANALIZAR Y REPRODUCIR'}
        </button>    
      </div>
    </div>
  );
};
