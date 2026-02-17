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

  // Usamos useRef para el historial para que persista correctamente
  const noteHistoryRef = useRef<string[]>([]);

  // --- MANEJADOR DE NOTAS ---
  const handleNoteDetected = (fullNote: string) => {
    if (!fullNote) return;

    // 1. MODO BATERÍA: Análisis percusivo por frecuencias
    if (selectedTrack === 'drums') {
      const frequency = parseFloat(fullNote);
      if (isNaN(frequency)) return;

      let drumKey = "";
      if (frequency > 40 && frequency < 110) drumKey = DRUM_MAP.KICK;
      else if (frequency >= 110 && frequency < 260) drumKey = DRUM_MAP.SNARE;
      else if (frequency >= 260 && frequency < 600) drumKey = DRUM_MAP.TOM_MID;
      else if (frequency >= 2000) drumKey = DRUM_MAP.HIHAT;

      if (drumKey) {
        setActiveNote(drumKey);
        setTimeout(() => setActiveNote(null), 80);
      }
      return; // Importante: salir aquí para no ejecutar la lógica melódica
    }

    // 2. MODO MELÓDICO: Análisis de notas con estabilización
    const history = noteHistoryRef.current;
    history.push(fullNote);
    if (history.length > 5) history.shift();

    // Calculamos frecuencias de aparición
    const counts = history.reduce((acc: Record<string, number>, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});

    // Encontramos la nota más frecuente
    const mostFrequentNote = Object.keys(counts).reduce((a, b) => 
      counts[a] > counts[b] ? a : b
    );

    // Si la nota es estable (3 de 5), actualizamos el estado
    if (counts[mostFrequentNote] >= 3) {
      const root = mostFrequentNote.replace(/[0-9]/g, '').trim().toUpperCase();
      
      // Solo actualizamos si la nota cambió para evitar renders infinitos
      if (activeNote !== mostFrequentNote) {
        setActiveNote(mostFrequentNote);
        setDetectedRoot(root);
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
        onPlayStateChange={setIsPlaying}
        onTrackSelect={handleTrackSelect}
        onNoteDetected={handleNoteDetected}
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
