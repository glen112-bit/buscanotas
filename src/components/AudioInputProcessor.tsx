import React, { useState, useRef, useEffect, useCallback } from 'react';
import { saveToDB, getAllStemsFromDB, initDB, STORE_NAME } from '../utilis/db';
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

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const AudioInputProcessor = ({ onPlayStateChange, onTrackSelect, onNoteDetected }: any) => {
  const [stems, setStems] = useState<{ [key: string]: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [volumes, setVolumes] = useState<{ [key: string]: number }>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [sourceMode, setSourceMode] = useState<'upload' | 'library'>('upload');

  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodes = useRef<{ [key: string]: MediaElementAudioSourceNode }>({});

  // --- 1. ALGORITMOS DE ANÁLISIS REAL ---

  const frequencyToNote = (frequency: number) => {
    const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2)) + 69;
    const noteName = NOTE_NAMES[Math.round(noteNum) % 12];
    const octave = Math.floor(Math.round(noteNum) / 12) - 1;
    return `${noteName}${octave}`;
  };

  const autoCorrelateReal = (buffer: Float32Array, sampleRate: number) => {
    let rms = 0;
    for (let i = 0; i < buffer.length; i++) rms += buffer[i] * buffer[i];
    rms = Math.sqrt(rms / buffer.length);
    if (rms < 0.02) return -1;

    const clippedBuffer = new Float32Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      clippedBuffer[i] = Math.abs(buffer[i]) > 0.1 ? buffer[i] : 0;
    }

    let bestOffset = -1;
    let bestCorrelation = 0;

    for (let offset = 0; offset < buffer.length / 2; offset++) {
      let correlation = 0;
      for (let i = 0; i < buffer.length / 2; i++) {
        correlation += clippedBuffer[i] * clippedBuffer[i + offset];
      }
      if (offset > 0 && correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    }

    return bestOffset !== -1 ? sampleRate / bestOffset : -1;
  };

  // --- 2. BUCLE DE ANÁLISIS ---

  const startAnalysisLoop = useCallback(() => {
    if (!analyserRef.current || !isPlaying) return;

    const bufferLength = analyserRef.current.fftSize;
    const dataArray = new Float32Array(bufferLength);

    const perform = () => {
      if (!isPlaying || !analyserRef.current) return;

      analyserRef.current.getFloatTimeDomainData(dataArray);
      const frequency = autoCorrelateReal(dataArray, audioCtxRef.current!.sampleRate);

      if (frequency !== -1) {
        const note = frequencyToNote(frequency);
        if (onNoteDetected) onNoteDetected(note);
      }
      requestAnimationFrame(perform);
    };
    requestAnimationFrame(perform);
  }, [isPlaying, onNoteDetected]);

  // --- 3. GESTIÓN DE AUDIO Y CONEXIONES ---

  const connectTrackToAnalyzer = (trackName: string) => {
    if (!audioCtxRef.current || !analyserRef.current || !audioRefs.current[trackName]) return;

    const audioEl = audioRefs.current[trackName]!;
    
    // Evitar duplicar nodos fuente
    if (!sourceNodes.current[trackName]) {
      sourceNodes.current[trackName] = audioCtxRef.current.createMediaElementSource(audioEl);
    }

    // Desconectar de todo antes de re-rutar
    sourceNodes.current[trackName].disconnect();
    
    // Rutar: Fuente -> Analizador -> Salida
    sourceNodes.current[trackName].connect(analyserRef.current);
    analyserRef.current.connect(audioCtxRef.current.destination);
  };

  const toggleMasterPlay = async () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 8192; // Resolución alta para Guitarra/Bajo
    }

    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }

    if (isPlaying) {
      Object.values(audioRefs.current).forEach(audio => audio?.pause());
      setIsPlaying(false);
      onPlayStateChange(false);
    } else {
      // Si hay un track seleccionado (Solo), lo vinculamos al análisis
      const trackToAnalyze = selectedTrack || Object.keys(stems || {})[0];
      if (trackToAnalyze) connectTrackToAnalyzer(trackToAnalyze);

      Object.values(audioRefs.current).forEach(audio => audio?.play());
      setIsPlaying(true);
      onPlayStateChange(true);
    }
  };

  // Iniciar loop cuando isPlaying cambie
  useEffect(() => {
    if (isPlaying) startAnalysisLoop();
  }, [isPlaying, startAnalysisLoop]);

  const handleTrackSelection = (name: string) => {
    setSelectedTrack(name);
    if (isPlaying) connectTrackToAnalyzer(name);
    if (onTrackSelect) onTrackSelect(name);
  };

  // --- 4. LÓGICA DE API Y BASE DE DATOS ---

  const handleLoadFromDB = async () => {
    setStatusMessage("Cargando desde memoria...");
    try {
      const savedStems = await getAllStemsFromDB();
      if (Object.keys(savedStems).length > 0) {
        const initialVols: any = {};
        Object.keys(savedStems).forEach(k => initialVols[k] = 0.8);
        setVolumes(initialVols);
        setStems(savedStems);
        setStatusMessage("");
      } else {
        setStatusMessage("No hay archivos guardados localmente.");
        setTimeout(() => setStatusMessage(""), 3000);
      }
    } catch (e) {
      setStatusMessage("Error al acceder a la base de datos.");
    }
  };

  const waitForMVSepTask = async (hash: string): Promise<any> => {
    const url = `${PROXY_PREFIX}/api/separation/get?hash=${hash}&api_token=${API_KEY}`;
    while (true) {
      const response = await fetch(url);
      const res = await response.json();
      const info = res.data || res;
      if (info.status === 'done') return await downloadFiles(info.files);
      if (info.status === 'error') throw new Error("Error en IA");
      setStatusMessage(`IA Procesando: ${info.progress || 0}%`);
      await new Promise(r => setTimeout(r, 5000));
    }
  };

  const downloadFiles = async (files: any) => {
    setStatusMessage("Guardando pistas...");
    const localStems: { [key: string]: string } = {};
    const trackNames: any = { "0": "drums", "1": "bass", "2": "guitar", "3": "vocals" };

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

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    setStatusMessage("Subiendo a MVSep...");
    try {
      const formData = new FormData();
      formData.append('api_token', API_KEY);
      formData.append('model', '1');
      formData.append('audiofile', file);
      const resp = await fetch(`${PROXY_PREFIX}/api/separation/create`, { method: 'POST', body: formData });
      const result = await resp.json();
      if (result.success) {
        const secureFiles = await waitForMVSepTask(result.data.hash);
        setStems(secureFiles);
        setIsProcessing(false);
        setStatusMessage("");
      }
    } catch (error: any) {
      setStatusMessage(`Error: ${error.message}`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative flex flex-col gap-6 w-full max-w-xl mx-auto p-4 bg-[#0b0e14] rounded-[3rem] border border-white/5 shadow-2xl">
      <div className="flex justify-between items-center px-4 pt-2">
        {!stems ? (
          <h2 className="text-white/40 font-mono text-[10px] uppercase tracking-[0.2em]">Seleccionar Origen</h2>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <h2 className="text-white font-bold text-xs uppercase tracking-widest">Sesión Activa</h2>
            </div>
            <button 
              onClick={() => { setStems(null); onPlayStateChange(false); setIsPlaying(false); }}
              className="px-4 py-2 bg-white/5 hover:bg-red-500/10 border border-white/10 rounded-full transition-all text-slate-400 hover:text-red-400 text-xs font-bold uppercase"
            >
              ✕ Cambiar Canción
            </button>
          </>
        )}
      </div>

      {!stems && !statusMessage && (
        <div className="flex p-1 bg-white/5 rounded-2xl mx-4">
          <button onClick={() => setSourceMode('upload')} className={`flex-1 py-3 rounded-xl text-xs font-bold ${sourceMode === 'upload' ? 'bg-cyan-500 text-black' : 'text-slate-400'}`}>🚀 SUBIR</button>
          <button onClick={() => setSourceMode('library')} className={`flex-1 py-3 rounded-xl text-xs font-bold ${sourceMode === 'library' ? 'bg-cyan-500 text-black' : 'text-slate-400'}`}>📂 BIBLIOTECA</button>
        </div>
      )}

      <div className="w-full px-2">
        {statusMessage ? (
          <div className="p-16 border-2 border-dashed border-cyan-500/30 rounded-[2.5rem] text-center bg-cyan-500/5">
            <p className="text-cyan-400 font-mono text-xs uppercase animate-pulse">{statusMessage}</p>
          </div>
        ) : !stems ? (
          <div className="transition-all">
            {sourceMode === 'upload' ? (
              <label className="flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-[2.5rem] py-16 cursor-pointer hover:bg-white/10 border-dashed group">
                <input type="file" className="hidden" onChange={onChange} accept="audio/*" />
                <span className="text-cyan-400 text-3xl mb-4">↑</span>
                <span className="text-white font-bold uppercase text-sm">Procesar Nuevo Audio</span>
              </label>
            ) : (
              <div onClick={handleLoadFromDB} className="flex flex-col items-center justify-center bg-white/5 border border-cyan-500/20 rounded-[2.5rem] py-16 cursor-pointer hover:bg-cyan-500/10 border-dashed group">
                <span className="text-cyan-400 text-3xl mb-4">💾</span>
                <span className="text-white font-bold uppercase text-sm">Restaurar Memoria</span>
              </div>
            )}
          </div>
        ) : (
          <Mixer 
            stems={stems} 
            volumes={volumes} 
            onChange={(t, v) => setVolumes(prev => ({ ...prev, [t]: v }))} 
            colors={TRACK_COLORS} 
            audioRefs={audioRefs}
            selectedTrack={selectedTrack}
            onSelectTrack={handleTrackSelection}
            audioContext={audioCtxRef.current}
          />
        )}
      </div>

      {stems && (
        <div className="flex flex-col items-center gap-4 pb-6">
          <button
            onClick={toggleMasterPlay}
            className={`px-16 py-6 rounded-full font-black text-2xl transition-all shadow-2xl ${isPlaying ? 'bg-red-500/20 border-2 border-red-500 text-red-500' : 'bg-cyan-500 text-black hover:scale-105'}`}
          >
            {isPlaying ? '⏸ PAUSAR' : '🚀 ANALIZAR'}
          </button>
        </div>
      )}
    </div>
  );
};
