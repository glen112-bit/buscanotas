import React, { useState, useRef, useEffect } from 'react';
import { Mixer } from './Mixer'; // Asegúrate de que la ruta sea correcta

// Configuración - Ajusta según tus constantes
const API_KEY = 'L6A6IpxuJSVbM8MPwXWIbaF8YIDJsn';
const PROXY_PREFIX = '/api_mvsep';

const TRACK_THEME = {
  vocals: '#22d3ee',
  drums: '#f472b6',
  bass: '#fbbf24',
  other: '#a78bfa',
};

export const AudioInputProcessor = ({ onPlayStateChange, currentNote, confidence }: any) => {
  const [stems, setStems] = useState<{ [key: string]: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [volumes, setVolumes] = useState<{ [key: string]: number }>({});
  const [isActive, setIsActive] = useState(false);

  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const connectedSourcesRef = useRef<Set<string>>(new Set());

  // --- PERSISTENCIA: Recuperar tarea al cargar ---
  useEffect(() => {
    const savedHash = sessionStorage.getItem('pendingTaskHash');
    if (savedHash && !stems) {
      resumeTask(savedHash);
    }
  }, []);

  const resumeTask = async (hash: string) => {
    setIsProcessing(true);
    setStatusMessage("Recuperando sesión anterior...");
    try {
      const secureFiles = await waitForMVSepTask(hash);
      setupAudioStems(secureFiles);
    } catch (e: any) {
      setStatusMessage(`Error: ${e.message}`);
      sessionStorage.removeItem('pendingTaskHash');
      setIsProcessing(false);
    }
  };

  const setupAudioStems = (files: { [key: string]: string }) => {
    const initialVols: any = {};
    Object.keys(files).forEach(k => initialVols[k] = 0.8);
    setVolumes(initialVols);
    setStems(files);
    setStatusMessage("");
    setIsProcessing(false);
  };

  // --- LÓGICA DE ESPERA (POLLING) ---
  const waitForMVSepTask = async (hash: string) => {
    const url = `${PROXY_PREFIX}/api/separation/get?hash=${hash}&api_token=${API_KEY}`;
    
    while (true) {
      const response = await fetch(url);
      if (!response.ok) {
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }

      const res = await response.json();
      const info = res.data || res;
      const status = info.status || res.status;

      // Extraer datos de fila y progreso
      const order = info.current_order || (res.data && res.data.current_order) || 0;
      const progress = info.progress || 0;

      console.log(`Estado: ${status} | Posición: ${order} | Progreso: ${progress}%`);

      if (status === 'done' && info.files) {
        sessionStorage.removeItem('pendingTaskHash');
        return await downloadFiles(info.files);
      }

      if (status === 'error') throw new Error(info.error || "Error en IA");

      // Actualizar UI
      if (status === 'waiting' || status === 'queue') {
        setStatusMessage(`En fila: Lugar #${order} (Ten paciencia...)`);
      } else if (status === 'processing') {
        setStatusMessage(`IA Trabajando: ${progress}%`);
      } else {
        setStatusMessage("Sincronizando con el servidor...");
      }

      // Espera inteligente: 15 segundos en fila, 5 segundos procesando
      const waitTime = status === 'waiting' ? 15000 : 5000;
      await new Promise(r => setTimeout(r, waitTime));
    }
  };

  // --- SUBIDA DE ARCHIVO ---
  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMessage("Subiendo audio...");

    try {
      const formData = new FormData();
      formData.append('api_token', API_KEY);
      formData.append('model', '1'); // Modelo Demucs (Más rápido)
      
      const renamedFile = new File([file], `${Date.now()}-${file.name}`, { type: file.type });
      formData.append('audiofile', renamedFile);

      const resp = await fetch(`${PROXY_PREFIX}/api/separation/create`, { 
        method: 'POST', 
        body: formData 
      });

      const result = await resp.json();

      if (resp.ok && result.success) {
        const hash = result.data?.hash || result.hash;
        sessionStorage.setItem('pendingTaskHash', hash);
        const secureFiles = await waitForMVSepTask(hash);
        setupAudioStems(secureFiles);
      } else {
        throw new Error(result.errors?.[0] || "Error al subir");
      }
    } catch (error: any) {
      setStatusMessage(`Fallo: ${error.message}`);
      setTimeout(() => { if(!stems) setStatusMessage(""); setIsProcessing(false); }, 5000);
    }
  };

  // --- DESCARGA ---
  const downloadFiles = async (files: { [key: string]: string }) => {
    const localStems: { [key: string]: string } = {};
    setStatusMessage("Descargando resultados...");
    
    for (const [name, fileUrl] of Object.entries(files)) {
      const fileResp = await fetch(fileUrl);
      const blob = await fileResp.blob();
      localStems[name] = URL.createObjectURL(blob);
    }
    return localStems;
  };

  // --- CONTROLES DE AUDIO ---
  const toggleSensor = async () => {
    if (isActive) {
      Object.values(audioRefs.current).forEach(a => {
        if (a) { a.pause(); a.currentTime = 0; }
      });
      setIsActive(false);
      onPlayStateChange(false);
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.connect(audioContextRef.current.destination);
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    const audios = Object.entries(audioRefs.current).filter(([_, a]) => a !== null);
    
    try {
      for (const [name, audioEl] of audios) {
        if (!audioEl) continue;
        if (!connectedSourcesRef.current.has(name)) {
          const source = audioContextRef.current.createMediaElementSource(audioEl);
          source.connect(analyserRef.current!);
          connectedSourcesRef.current.add(name);
        }
        audioEl.currentTime = 0;
      }

      await Promise.all(audios.map(([_, a]) => a!.play()));
      setIsActive(true);
      onPlayStateChange(true);
    } catch (err) {
      console.error("Fallo al iniciar:", err);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-xl mx-auto p-4 bg-[#0b0e14] rounded-[3rem] border border-white/5 shadow-2xl">
      <div className="bg-black/40 rounded-[2rem] p-8 border border-white/5 flex flex-col items-center">
        <span className="text-[10px] text-cyan-400 font-mono tracking-[0.2em] mb-2 uppercase">Monitor</span>
        <div className="text-6xl font-black text-white">{currentNote || '--'}</div>
        <div className="w-full bg-white/5 h-1 mt-4 rounded-full overflow-hidden">
          <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${confidence || 0}%` }} />
        </div>
      </div>

      <div className="w-full">
        {statusMessage ? (
          <div className="p-10 border-2 border-dashed border-cyan-500/30 rounded-3xl text-center">
            <p className="text-cyan-400 font-mono text-xs uppercase animate-pulse">{statusMessage}</p>
          </div>
        ) : !stems ? (
          <label className="flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-3xl py-12 cursor-pointer hover:bg-white/10 transition-all">
            <input type="file" className="hidden" onChange={onChange} accept="audio/*" />
            <span className="text-white font-bold uppercase tracking-widest">{isProcessing ? "Procesando..." : "Cargar Sesión"}</span>
          </label>
        ) : (
          <Mixer 
            stems={stems} 
            volumes={volumes} 
            onChange={(t, v) => {
              setVolumes(prev => ({ ...prev, [t]: v }));
              if (audioRefs.current[t]) audioRefs.current[t]!.volume = v;
            }} 
            colors={TRACK_THEME} 
            audioRefs={audioRefs} 
          />
        )}
      </div>

      <button 
        onClick={toggleSensor} 
        disabled={!stems}
        className={`w-full py-6 rounded-3xl font-black tracking-widest transition-all ${!stems ? 'opacity-50 cursor-not-allowed' : ''} ${isActive ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-white text-black'}`}
      >
        {isActive ? 'DETENER' : 'INICIAR'}
      </button>
    </div>
  );
};

