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
const applyHammingWindow = (buffer: Float32Array) => {
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] *= 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (buffer.length - 1));
  }
};

const frequencyToNote = (frequency: number) => {
  const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2)) + 69;
  const noteName = NOTE_NAMES[Math.round(noteNum) % 12];
  const octave = Math.floor(Math.round(noteNum) / 12) - 1;
  return `${noteName}${octave}`;
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
  const lowPassRef = useRef<BiquadFilterNode | null>(null);
  const sourceNodes = useRef<{ [key: string]: MediaElementAudioSourceNode }>({});

  // --- ANÁLISIS ---
const autoCorrelateReal = (buffer: Float32Array, sampleRate: number) => {
  // 1. Umbral de Silencio (RMS)
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
  const rms = Math.sqrt(sum / buffer.length);
  if (rms < 0.01) return -1;

  // 2. Center Clipping (Crucial para eliminar armónicos débiles)
  const size = buffer.length;
  const cbuffer = new Float32Array(size);
  const clipLimit = 0.15; // Un poco más agresivo para limpiar la señal
  for (let i = 0; i < size; i++) {
    const val = buffer[i];
    cbuffer[i] = Math.abs(val) < clipLimit ? 0 : val;
  }

  // 3. Autocorrelación con Refinamiento
  let bestOffset = -1;
  let maxCorrelation = 0;
  
  // Rango de búsqueda: C2 (65Hz) a C6 (1046Hz)
  const minOffset = Math.floor(sampleRate / 1100); 
  const maxOffset = Math.floor(sampleRate / 60);

  for (let offset = minOffset; offset < maxOffset; offset++) {
    let correlation = 0;
    for (let i = 0; i < size - offset; i++) {
      correlation += cbuffer[i] * cbuffer[i + offset];
    }

    // Normalización para favorecer la frecuencia fundamental sobre armónicos
    const normalizedCorr = correlation / (size - offset);
    
    if (normalizedCorr > maxCorrelation) {
      maxCorrelation = normalizedCorr;
      bestOffset = offset;
    }
  }

  // 4. Verificación de Confianza
  // Si la correlación es muy baja, no es una nota musical (es ruido/percusión)
  if (maxCorrelation < 0.005) return -1;

  return sampleRate / bestOffset;
};

  const startAnalysisLoop = useCallback(() => {
  if (!analyserRef.current || !isPlaying) return;
  const dataArray = new Float32Array(analyserRef.current.fftSize);

  const perform = () => {
    // Si el usuario pausó, salimos del bucle legalmente
    if (!isPlaying || !analyserRef.current) return;

    try {
      analyserRef.current.getFloatTimeDomainData(dataArray);
      
      // Solo analizamos si hay audio real en el buffer
      const frequency = autoCorrelateReal(dataArray, audioCtxRef.current!.sampleRate);

      if (frequency && frequency !== -1 && !isNaN(frequency)) {
        const output = selectedTrack === 'drums' ? frequency.toString() : frequencyToNote(frequency);
        onNoteDetected(output);
      }
    } catch (err) {
      console.error("Error en el ciclo de análisis:", err);
    }

    // Seguir el bucle
    requestAnimationFrame(perform);
  };

  requestAnimationFrame(perform);
}, [isPlaying, selectedTrack, onNoteDetected]);
  // --- AUDIO LOGIC ---
  const connectTrackToAnalyzer = (trackName: string) => {
    if (!audioCtxRef.current || !analyserRef.current || !audioRefs.current[trackName]) return;
    const audioEl = audioRefs.current[trackName]!;
    if (!sourceNodes.current[trackName]) {
      sourceNodes.current[trackName] = audioCtxRef.current.createMediaElementSource(audioEl);
    }
    sourceNodes.current[trackName].disconnect();

    if (trackName === 'piano' || trackName === 'vocals') {
      if (!lowPassRef.current) {
        lowPassRef.current = audioCtxRef.current.createBiquadFilter();
        lowPassRef.current.type = 'lowpass';
      }
      lowPassRef.current.frequency.value = 600;
      sourceNodes.current[trackName].connect(lowPassRef.current);
      lowPassRef.current.connect(analyserRef.current);
    } else {
      sourceNodes.current[trackName].connect(analyserRef.current);
    }
    analyserRef.current.connect(audioCtxRef.current.destination);
  };

 const toggleMasterPlay = async () => {
  // Si no existe el contexto, lo creamos
  if (!audioCtxRef.current) {
    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    analyserRef.current = audioCtxRef.current.createAnalyser();
    analyserRef.current.fftSize = 2048;
  }

  // ¡ESTO ES CLAVE! Forzar la reactivación si el navegador lo pausó
  if (audioCtxRef.current.state === 'suspended') {
    await audioCtxRef.current.resume();
  }

  if (isPlaying) {
    Object.values(audioRefs.current).forEach(a => a?.pause());
    setIsPlaying(false);
    onPlayStateChange(false);
  } else {
    // Conectar y reproducir
    const trackToAnalyze = selectedTrack || Object.keys(stems || {})[0];
    if (trackToAnalyze) connectTrackToAnalyzer(trackToAnalyze);
    
    Object.values(audioRefs.current).forEach(a => a?.play());
    setIsPlaying(true);
    onPlayStateChange(true);
    
    // Forzamos el reinicio del bucle por si se quedó colgado
    startAnalysisLoop(); 
  }
};

  useEffect(() => {
    if (isPlaying) startAnalysisLoop();
  }, [isPlaying, startAnalysisLoop]);

  // --- DB & API LOGIC ---
  const handleLoadFromDB = async () => {
    setStatusMessage("Buscando en biblioteca...");
    try {
      const savedStems = await getAllStemsFromDB();
      if (Object.keys(savedStems).length > 0) {
        setStems(savedStems);
        setStatusMessage("");
      } else {
        setStatusMessage("La biblioteca está vacía.");
        setTimeout(() => setStatusMessage(""), 2000);
      }
    } catch (e) { setStatusMessage("Error al cargar DB"); }
  };

// --- Dentro del componente AudioInputProcessor ---

const downloadFiles = async (files: any) => {
  setStatusMessage("Guardando pistas...");
  const localStems: { [key: string]: string } = {};
  const trackNames: any = { "0": "drums", "1": "bass", "2": "guitar", "3": "vocals" };

  for (const [id, value] of Object.entries(files)) {
    const fileUrl = typeof value === 'string' ? value : (value as any).url;
    // Reemplazamos el dominio para evitar problemas de CORS vía proxy
    const resp = await fetch(fileUrl.replace('https://mvsep.com', API_BASE));
    const blob = await resp.blob();
    const displayName = trackNames[id] || `track_${id}`;
    
    // Guardamos en IndexedDB para la persistencia de la "Biblioteca"
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

    if (info.status === 'done') {
      return await downloadFiles(info.files);
    }
    
    if (info.status === 'error') {
      throw new Error("La IA encontró un problema procesando el audio.");
    }

    // Actualizamos el progreso en el UI
    setStatusMessage(`IA Procesando: ${info.progress || 0}%`);
    
    // Esperamos 5 segundos antes de volver a preguntar (polling)
    await new Promise(r => setTimeout(r, 5000));
  }
};

const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setStatusMessage("Subiendo a MVSep...");
  
  try {
    const formData = new FormData();
    formData.append('api_token', API_KEY);
    formData.append('model', '1'); // Modelo MDX23 (bueno para piano/voz)
    formData.append('audiofile', file);

    const resp = await fetch(`${PROXY_PREFIX}/api/separation/create`, { 
      method: 'POST', 
      body: formData 
    });
    
    const result = await resp.json();

    if (result.success) {
      const secureFiles = await waitForMVSepTask(result.data.hash);
      setStems(secureFiles);
      
      // Inicializar volúmenes por defecto
      const initialVols: any = {};
      Object.keys(secureFiles).forEach(k => initialVols[k] = 0.8);
      setVolumes(initialVols);
      
      setStatusMessage("");
    } else {
      throw new Error(result.error || "Error al crear la tarea");
    }
  } catch (error: any) {
    console.error(error);
    setStatusMessage(`Error: ${error.message}`);
    setTimeout(() => setStatusMessage(""), 5000);
  }
};


const perform = () => {
  if (!isPlaying || !analyserRef.current) return;
  analyserRef.current.getFloatTimeDomainData(dataArray);
  
  const frequency = autoCorrelateReal(dataArray, audioCtxRef.current!.sampleRate);

  if (frequency !== -1) {
    if (selectedTrack === 'drums') {
      // Enviamos la frecuencia numérica directamente
      onNoteDetected(frequency.toString());
    } else {
      // Enviamos la nota musical (C4, A#3...)
      const note = frequencyToNote(frequency);
      onNoteDetected(note);
    }
  }
  requestAnimationFrame(perform);
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
            stems={stems} volumes={volumes} audioRefs={audioRefs}
            selectedTrack={selectedTrack} onSelectTrack={(name) => { setSelectedTrack(name); if(isPlaying) connectTrackToAnalyzer(name); onTrackSelect(name); }}
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
};;
