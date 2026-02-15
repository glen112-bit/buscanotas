import React from 'react'

/**
 * Retorna un emoji representativo según el nombre de la pista (stem).
 * Útil para la interfaz del Mixer.
 */
export const getEmoji = (track: string) => {
  const t = track.toLowerCase();
  
  if (t.includes('vocal')) return '🎤';
  if (t.includes('drum') || t.includes('perc')) return '🥁';
  if (t.includes('bass')) return '🎸'; // Bajo eléctrico
  if (t.includes('guitar')) return '🎸';
  if (t.includes('piano') || t.includes('synth')) return '🎹';
  if (t.includes('other')) return '🎼';
  
  return '🎵';
};
