export interface ChordPosition {
  frets: number[];
  fingers: number[];
}

export const GUITAR_CHORDS: Record<string, ChordPosition> = {
  // --- NATURALES MAYORES ---
  "C": { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  "D": { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  "E": { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  "F": { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1] },
  "G": { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
  "A": { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  "B": { frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1] },

  // --- SOSTENIDOS (Crucial para F#) ---
  "C#": { frets: [-1, 4, 6, 6, 6, 4], fingers: [0, 1, 2, 3, 4, 1] },
  "D#": { frets: [-1, 6, 8, 8, 8, 6], fingers: [0, 1, 2, 3, 4, 1] },
  "F#": { frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1] },
  "G#": { frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1] },
  "A#": { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1] },

  // --- MENORES ---
  "Cm": { frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1] },
  "Dm": { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  "Em": { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  "Fm": { frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1] },
  "Gm": { frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1] },
  "Am": { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  "Bm": { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1] },
  
  // --- SOSTENIDOS MENORES ---
  "C#m": { frets: [-1, 4, 6, 6, 5, 4], fingers: [0, 1, 3, 4, 2, 1] },
  "F#m": { frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1] },

  // --- SÉPTIMAS ---
  "C7": { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
  "D7": { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
  "E7": { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
  "G7": { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
  "A7": { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0] },
  "B7": { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
  
  // --- ACORDES DE NOVENA (9 / add9) ---
  "C9": { frets: [-1, 3, 2, 3, 3, 3], fingers: [0, 2, 1, 3, 3, 3] },
  "D9": { frets: [-1, 5, 4, 5, 5, 5], fingers: [0, 2, 1, 3, 3, 3] },
  "E9": { frets: [-1, 7, 6, 7, 7, 7], fingers: [0, 2, 1, 3, 3, 3] },
  "G9": { frets: [3, 2, 0, 2, 0, 1], fingers: [3, 2, 0, 4, 0, 1] },
  "A9": { frets: [-1, 0, 2, 4, 2, 3], fingers: [0, 0, 1, 4, 2, 3] },
  "Cadd9": { frets: [-1, 3, 2, 0, 3, 0], fingers: [0, 3, 2, 0, 4, 0] },
  "Eadd9": { frets: [0, 2, 4, 1, 0, 0], fingers: [0, 2, 4, 1, 0, 0] },

  // --- DISMINUIDOS (dim / dim7) ---
  "Cdim7": { frets: [-1, 3, 4, 2, 4, -1], fingers: [0, 2, 3, 1, 4, 0] },
  "Ddim7": { frets: [-1, -1, 0, 1, 0, 1], fingers: [0, 0, 0, 1, 0, 2] },
  "Edim7": { frets: [-1, -1, 2, 3, 2, 3], fingers: [0, 0, 1, 3, 2, 4] },
  "F#dim7": { frets: [2, -1, 1, 2, 1, -1], fingers: [2, 0, 1, 3, 1, 0] },
  "Adim7": { frets: [-1, 0, 1, 2, 1, 2], fingers: [0, 0, 1, 3, 2, 4] },

  // --- SEMIDISMINUIDOS (m7b5) ---
  "Am7b5": { frets: [-1, 0, 1, 0, 1, -1], fingers: [0, 0, 1, 0, 2, 0] },
  "Bm7b5": { frets: [-1, 2, 3, 2, 3, -1], fingers: [0, 1, 3, 2, 4, 0] },
  "F#m7b5": { frets: [2, -1, 2, 2, 1, -1], fingers: [2, 0, 3, 4, 1, 0] },

  // --- ACORDES SUSPENDIDOS (sus4 / sus2) ---
  "Dsus4": { frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 3, 4] },
  "Asus4": { frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 4, 0] },
  "Esus4": { frets: [0, 2, 2, 2, 0, 0], fingers: [0, 2, 3, 4, 0, 0] },
  "Csus2": { frets: [-1, 3, 0, 0, 1, -1], fingers: [0, 3, 0, 0, 1, 0] },

  // --- MAYORES CON SÉPTIMA MAYOR (maj7) ---
  "Cmaj7": { frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0] },
  "Fmaj7": { frets: [-1, -1, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0] },
  "Gmaj7": { frets: [3, 2, 0, 0, 0, 2], fingers: [3, 2, 0, 0, 0, 1] }

};
