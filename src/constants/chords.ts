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
  "B7": { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] }
};
