import React, { useState } from 'react';
import { AudioInputProcessor } from '../../components/AudioInputProcessor';
import { GuitarFretboard } from '../../components/GuitarFretboard';
import { PianoRoll } from '../../components/PianoRoll';

export const Dashboard = () => {
  // --- ESTADOS ---
  const [activeNote, setActiveNote] = useState<string | null>(null); // Ej: "C#4"
  const [detectedRoot, setDetectedRoot] = useState<string | null>(null); // Ej: "C#"
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // --- MANEJADOR DE NOTAS ---
// Variable global o ref para persistencia fuera del ciclo de render
const noteHistory: string[] = [];

const handleNoteDetected = (fullNote: string) => {
  if (!fullNote) return;
  
  // Guardamos las últimas 5 detecciones
  noteHistory.push(fullNote);
  if (noteHistory.length > 5) noteHistory.shift();

  // Contamos cuál es la nota más frecuente en el historial reciente
  const counts = noteHistory.reduce((acc: any, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});

  const mostFrequentNote = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

  // Solo actualizamos si la nota tiene una "frecuencia de aparición" alta (ej. 3 de 5)
  if (counts[mostFrequentNote] >= 3) {
    const root = mostFrequentNote.replace(/[0-9]/g, '').trim().toUpperCase();
    setActiveNote(mostFrequentNote);
    setDetectedRoot(root);
  }
};

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8">
      
      {/* Procesador de Audio (Mixer + Análisis) */}
      <AudioInputProcessor 
        onPlayStateChange={setIsPlaying}
        onTrackSelect={setSelectedTrack}
        onNoteDetected={handleNoteDetected}
      />

      {/* Visualización de Instrumentos */}
      <div className="mt-8">
        {selectedTrack ? (
          <>
            {(selectedTrack === 'guitar' || selectedTrack === 'bass') ? (
              <GuitarFretboard 
                activeNote={activeNote}      // "C#4" para el texto
                note={detectedRoot}          // "C#" para buscar en el JSON de acordes
                trackName={selectedTrack}
                type={selectedTrack === 'guitar' ? 'chord' : 'note'}
              />
            ) : (
              <PianoRoll 
                activeNote={activeNote}      // El piano usará la nota completa
                trackName={selectedTrack} 
              />
            )}
          </>
        ) : (
          <div className="text-center p-20 border-2 border-dashed border-white/5 rounded-[3rem] opacity-30">
            <p className="text-slate-400 uppercase tracking-widest text-xs font-bold">
              Selecciona "SOLO" en una pista para activar el análisis visual
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
