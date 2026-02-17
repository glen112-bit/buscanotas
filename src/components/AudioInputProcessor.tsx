import React, { useState, useRef, useEffect, useCallback } from 'react';
import { saveToDB, getAllStemsFromDB } from '../utilis/db';
import { Mixer } from './Mixer';

const API_KEY = 'L6A6IpxuJSVbM8MPwXWIbaF8YIDJsn';
const API_BASE = "/api_mvsep";
const PROXY_PREFIX = '/api_mvsep';

const TRACK_COLORS: { [key: string]: string } = {
  vocals: '#22d3ee', drums: '#f472b6', bass: '#fbbf24',
  guitar: '#a78bfa', other: '#94a3b8', instrumental: '#60a5fa'
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// --- HELPERS ---
const frequencyToNote = (frequency: number) => {
  const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2)) + 69;
  const noteName = NOTE_NAMES[Math.round(noteNum) % 12];
  const octave = Math.floor(Math.round(noteNum) / 12) - 1;
  return `${noteName}${octave}`;
};

export const autoCorrelateReal = (buffer: Float32Array, sampleRate: number) => {
  let rms = 0;
  for (let i = 0; i < buffer.length; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / buffer.length);
  if (rms < 0.01) return -1;

  let r1 = 0, r2 = buffer.length - 1;
  const thres = 0.2;
  for (let i = 0; i < buffer.length / 2; i++) {
    if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
  }
  for (let i = 1; i < buffer.length / 2; i++) {
    if (Math.abs(buffer[buffer.length - i]) < thres) { r2 = buffer.length - i; break; }
  }
  const buf = buffer.slice(r1, r2);
  if (buf.length < 2) return -1;

  const c = new Array(buf.length).fill(0);
  for (let i = 0; i < buf.length; i++) {
    for (let j = 0; j < buf.length - i; j++) {
      c[i] = c[i] + buf[j] * buf[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < buf.length; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }

  let T0 = maxpos;
  const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);

  return sampleRate / T0;
};

export const AudioInputProcessor = ({ onPlayStateChange, onTrackSelect, onNoteDetected }: any) => {
  const [stems, setStems] = useState<{ [key: string]: string } | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [volumes, setVolumes] = useState<{ [key: string]: number }>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [sourceMode, setSourceMode] = useState<'upload' | 'library'>('upload');

  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodes = useRef<{ [key: string]: MediaElementAudioSourceNode }>({});
  
  const lastFreqRef = useRef<number>(0);
  const requestRef = useRef<number>();
  const stableCountRef = useRef<number>(0);
  const lastStableNoteRef = useRef<string>("");

  useEffect(() => {
    if (analyserRef.current) {
      analyserRef.current.fftSize = selectedTrack === 'bass' ? 4096 : 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;
    }
  }, [selectedTrack]);

const startAnalysisLoop = useCallback(() => {
    if (!analyserRef.current || !isPlaying || !audioCtxRef.current) return;

    const bufferLength = analyserRef.current.fftSize;
    const dataArray = new Float32Array(bufferLength);
    const sampleRate = audioCtxRef.current.sampleRate;

    const perform = () => {
      if (!analyserRef.current || !isPlaying) return;

      try {
        analyserRef.current.getFloatTimeDomainData(dataArray);
        const freq = autoCorrelateReal(dataArray, sampleRate);

        if (freq !== -1 && !isNaN(freq)) {
          const currentNote = selectedTrack === 'drums' ? freq.toFixed(2) : frequencyToNote(freq);

          // Lógica de Estabilidad: Evita que la nota salte erráticamente
          if (currentNote === lastStableNoteRef.current) {
            stableCountRef.current++;
          } else {
            stableCountRef.current = 0;
            lastStableNoteRef.current = currentNote;
          }

          // Solo notificamos si la nota se mantiene por 3 ciclos (aprox 50ms)
          if (stableCountRef.current >= 3) {
            onNoteDetected(currentNote);
          }
        } else {
          // Si no hay frecuencia (silencio), limpiamos el contador
          stableCountRef.current = 0;
        }
      } catch (err) {
        console.error("Error en análisis:", err);
      }
      requestRef.current = requestAnimationFrame(perform);
    };

    requestRef.current = requestAnimationFrame(perform);

    // Retornamos la función de limpieza
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, selectedTrack, onNoteDetected]);

  useEffect(() => {
    const cleanup = startAnalysisLoop();
    return () => {
      if (cleanup) cleanup();
    };
  }, [startAnalysisLoop]);




  const connectTrackToAnalyzer = async (trackName: string) => {
    if (!audioCtxRef.current || !analyserRef.current) return;
    if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();
    const audioEl = audioRefs.current[trackName];
    if (!audioEl) return;
    if (!sourceNodes.current[trackName]) {
      sourceNodes.current[trackName] = audioCtxRef.current.createMediaElementSource(audioEl);
    }
    sourceNodes.current[trackName].disconnect();
    sourceNodes.current[trackName].connect(analyserRef.current);
    analyserRef.current.connect(audioCtxRef.current.destination);
  };

  const toggleMasterPlay = async () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioCtxRef.current.createAnalyser();
    }
    if (isPlaying) {
      Object.values(audioRefs.current).forEach(a => a?.pause());
      setIsPlaying(false);
      onPlayStateChange(false);
    } else {
      const trackToAnalyze = selectedTrack || Object.keys(stems || {})[0];
      if (trackToAnalyze) {
        await connectTrackToAnalyzer(trackToAnalyze);
        setSelectedTrack(trackToAnalyze);
      }
      Object.values(audioRefs.current).forEach(a => a?.play());
      setIsPlaying(true);
      onPlayStateChange(true);
    }
  };

  // --- FUNCIONES DE API (Las que faltaban) ---
  const downloadFiles = async (files: any) => {
    setStatusMessage("Guardando pistas...");
    const localStems: { [key: string]: string } = {};
    const trackNames: any = { "0": "drums", "1": "bass", "2": "other", "3": "vocals", "4": "guitar", "5": "piano" };

    for (const [id, value] of Object.entries(files)) {
      const fileUrl = typeof value === 'string' ? value : (value as any).url;
      const resp = await fetch(fileUrl.replace('https://mvsep.com', API_BASE));
      const blob = await resp.blob();
      const displayName = trackNames[id] || `track_${id}`;
      await saveToDB(displayName, blob);
      localStems[displayName] = URL.createObjectURL(blob);
    }
    return localStems;
  };

  const waitForMVSepTask = async (hash: string): Promise<any> => {
    const url = `${PROXY_PREFIX}/api/separation/get?hash=${hash}&api_token=${API_KEY}`;
    while (true) {
      const response = await fetch(url);
      const res = await response.json();
      const info = res.data || res;
      if (info.status === 'done') return await downloadFiles(info.files);
      if (info.status === 'error') throw new Error("Error en la IA.");
      setStatusMessage(`IA Procesando: ${info.progress || 0}%`);
      await new Promise(r => setTimeout(r, 5000));
    }
  };

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatusMessage("Subiendo...");
    try {
      const formData = new FormData();
      formData.append('api_token', API_KEY);
      formData.append('model', '11');
      formData.append('audiofile', file);
      const resp = await fetch(`${PROXY_PREFIX}/api/separation/create`, { method: 'POST', body: formData });
      const result = await resp.json();
      if (result.success) {
        const secureFiles = await waitForMVSepTask(result.data.hash);
        setStems(secureFiles);
        setStatusMessage("");
      }
    } catch (error) { setStatusMessage("Error en subida"); }
  };

  const handleLoadFromDB = async () => {
    setStatusMessage("Cargando...");
    try {
      const savedStems = await getAllStemsFromDB();
      if (Object.keys(savedStems).length > 0) {
        setStems(savedStems);
        setStatusMessage("");
      } else {
        setStatusMessage("Biblioteca vacía");
        setTimeout(() => setStatusMessage(""), 2000);
      }
    } catch (e) { setStatusMessage("Error en DB"); }
  };

  return (
    <div className="relative flex flex-col gap-6 w-full max-w-xl mx-auto p-4 bg-[#0b0e14] rounded-[3rem] border border-white/5 shadow-2xl">
      <div className="flex justify-between items-center px-4 pt-2">
        {!stems ? (
          <h2 className="text-white/40 font-mono text-[10px] uppercase tracking-[0.2em]">Configuración</h2>
        ) : (
          <button onClick={() => { setStems(null); setIsPlaying(false); onPlayStateChange(false); }} className="text-red-400 text-[10px] font-bold uppercase hover:opacity-70 transition-opacity">
            ✕ Cambiar Sesión
          </button>
        )}
      </div>

      <div className="w-full px-2">
        {statusMessage ? (
          <div className="p-16 border-2 border-dashed border-cyan-500/30 rounded-[2.5rem] text-center bg-cyan-500/5">
            <p className="text-cyan-400 font-mono text-xs uppercase animate-pulse">{statusMessage}</p>
          </div>
        ) : !stems ? (
          <div className="flex flex-col gap-4">
            <div className="flex p-1 bg-white/5 rounded-2xl mx-4">
              <button onClick={() => setSourceMode('upload')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${sourceMode === 'upload' ? 'bg-cyan-500 text-black' : 'text-slate-400'}`}>🚀 SUBIR</button>
              <button onClick={() => setSourceMode('library')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${sourceMode === 'library' ? 'bg-cyan-500 text-black' : 'text-slate-400'}`}>📂 BIBLIOTECA</button>
            </div>
            {sourceMode === 'upload' ? (
              <label className="flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-[2.5rem] py-16 cursor-pointer hover:bg-white/10 border-dashed group transition-all">
                <input type="file" className="hidden" onChange={onChange} accept="audio/*" />
                <span className="text-cyan-400 text-3xl mb-4 group-hover:scale-110 transition-transform">↑</span>
                <span className="text-white font-bold uppercase text-sm">Cargar Nuevo Track</span>
              </label>
            ) : (
              <div onClick={handleLoadFromDB} className="flex flex-col items-center justify-center bg-white/5 border border-cyan-500/20 rounded-[2.5rem] py-16 cursor-pointer hover:bg-cyan-500/10 border-dashed group transition-all">
                <span className="text-cyan-400 text-3xl mb-4 group-hover:scale-110 transition-transform">💾</span>
                <span className="text-white font-bold uppercase text-sm">Abrir Biblioteca Local</span>
              </div>
            )}
          </div>
        ) : (
          <Mixer 
            stems={stems} volumes={volumes} audioRefs={audioRefs} selectedTrack={selectedTrack} 
            onSelectTrack={(name) => { setSelectedTrack(name); onTrackSelect(name); if (isPlaying) connectTrackToAnalyzer(name); }}
            onChange={(t, v) => setVolumes(prev => ({ ...prev, [t]: v }))}
            colors={TRACK_COLORS} audioContext={audioCtxRef.current}
          />
        )}
      </div>

      {stems && !statusMessage && (
        <div className="flex justify-center pb-6">
          <button onClick={toggleMasterPlay} className={`px-16 py-6 rounded-full font-black text-2xl transition-all shadow-2xl ${isPlaying ? 'bg-red-500/20 border-2 border-red-500 text-red-500' : 'bg-cyan-500 text-black hover:scale-105'}`}>
            {isPlaying ? '⏸ PAUSAR' : '🚀 ANALIZAR'}
          </button>
        </div>
      )}
    </div>
  );
};
