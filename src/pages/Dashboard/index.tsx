import React, { useState, useRef } from 'react';
import { AudioInputProcessor } from '../../components/AudioInputProcessor';
import { GuitarFretboard } from '../../components/GuitarFretboard';
import { PianoRoll } from '../../components/PianoRoll';
import { DRUM_MAP } from '../../constants/drumMap';

export const Dashboard = () => {
  // --- ESTADOS ---
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [detectedRoot, setDetectedRoot] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [counts, setCounts] = useState<{[key: string]: number}>({}); 

  // Usamos useRef para el historial para que persista correctamente
  const noteHistoryRef = useRef<string[]>([]);

  // --- MANEJADOR DE NOTAS ---
  const handleNoteDetected = (fullNote: string) => {
    if (!fullNote) return;
    const normalizedNote = fullNote.toUpperCase().trim();
    // 1. MODO BATERÍA: Análisis percusivo directo por frecuencias
    if (selectedTrack === 'drums') {
      const frequency = parseFloat(fullNote);
      if (isNaN(frequency)) return;

      let drumKey = "";
      if (frequency > 40 && frequency < 110) drumKey = DRUM_MAP.KICK;
      else if (frequency >= 110 && frequency < 260) drumKey = DRUM_MAP.SNARE;
      else if (frequency >= 260 && frequency < 600) drumKey = DRUM_MAP.TOM_MID;
      else if (frequency >= 2000) drumKey = DRUM_MAP.HIHAT;

      if (drumKey && activeNote !== drumKey) {
        setActiveNote(drumKey);
        // Timeout corto para el efecto visual de "golpe"
        setTimeout(() => setActiveNote(null), 80);
      }
      return; // Salimos para no procesar lógica melódica
    }

    // 2. MODO MELÓDICO: Lógica de estabilización
    // Agregamos la nota al historial (useRef para no disparar renders)
    const history = noteHistoryRef.current;
    history.push(fullNote);
    if (history.length > 5) history.shift();

    // Calculamos cuántas veces aparece cada nota en el historial reciente
    const counts = history.reduce((acc: Record<string, number>, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});

    // Encontramos la nota que más se repite
    const mostFrequentNote = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

    // 3. VALIDACIÓN: Solo actuamos si la nota es estable (ej: aparece 3 de 5 veces)
    if (counts[mostFrequentNote] >= 3) {
      let finalNote = mostFrequentNote;

      // Ajuste específico para el BAJO (estabilización de octavas graves)
      if (selectedTrack === 'bass') {
        const noteName = mostFrequentNote.replace(/[0-9]/g, '');
        const octaveMatch = mostFrequentNote.match(/\d+/);
        const octave = octaveMatch ? parseInt(octaveMatch[0]) : 0;

        // Si el algoritmo detecta armónicos agudos (> octava 2), forzamos el registro grave
        if (octave > 2) {
          finalNote = `${noteName}1`; 
        }
      }

      const root = finalNote.replace(/[0-9]/g, '').trim().toUpperCase();

      // 4. ACTUALIZACIÓN DE ESTADO (Evitamos renders innecesarios)
      if (activeNote !== finalNote) {
        setActiveNote(finalNote);
        setDetectedRoot(root);
      }
      if (counts[mostFrequentNote] >= 3) {
        const finalNote = mostFrequentNote.toUpperCase();
        setActiveNote(finalNote); // Esto es lo que dispara la luz en el teclado
      }
    }
  };

  const handleTrackSelect = (track: string) => {
    setSelectedTrack(track);
    setActiveNote(null);
    setDetectedRoot(null);
    noteHistoryRef.current = [];
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8">

      <AudioInputProcessor 
        onNoteDetected={handleNoteDetected}
        onPlayStateChange={setIsPlaying}
        onTrackSelect={handleTrackSelect}
      />

      <div className="mt-8">
        {!selectedTrack ? (
          <div className="text-center p-20 border-2 border-dashed border-white/5 rounded-[3rem] opacity-30">
            <p className="text-slate-400 uppercase tracking-widest text-xs font-bold">
              Selecciona "SOLO" en una pista para activar el análisis visual
            </p>
          </div>
        ) : (selectedTrack === 'guitar' || selectedTrack === 'bass') ? (
          <GuitarFretboard 
            activeNote={activeNote} 
            note={detectedRoot} 
            trackName={selectedTrack}
            type={selectedTrack === 'guitar' ? 'chord' : 'note'}
          />
        ) : (
          <div className="animate-in fade-in zoom-in duration-500">
            <PianoRoll 
              activeNote={activeNote} 
              trackName={selectedTrack} 
            />
          </div>
        )}
      </div>
    </div>
  );
};
