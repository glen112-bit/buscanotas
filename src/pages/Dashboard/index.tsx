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
  const handleNoteDetected = (fullNote: string) => {
    setActiveNote(fullNote);
    
    // Limpiamos la octava para el diccionario de acordes (C#4 -> C#)
    const root = fullNote.replace(/[0-9]/g, '');
    setDetectedRoot(root);
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
