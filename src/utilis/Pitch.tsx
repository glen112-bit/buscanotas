// Algoritmo de detección de frecuencia (Pitch Detection)
const detectPitch = (buffer: Float32Array, sampleRate: number): number | null => {
  let SIZE = buffer.length;
  let rms = 0;

  // 1. Verificar si hay suficiente volumen (evita detectar ruido de fondo)
  for (let i = 0; i < SIZE; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return null; // Umbral de silencio

  // 2. Autocorrelación para encontrar el periodo de la onda
  let r1 = 0, r2 = SIZE - 1, thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buffer[SIZE - i]) < thres) { r2 = SIZE - i; break; }
  }

  const buf = buffer.slice(r1, r2);
  SIZE = buf.length;

  const c = new Array(SIZE).fill(0);
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE - i; j++) {
      c[i] = c[i] + buf[j] * buf[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < SIZE; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }

  if (maxpos !== -1) {
    return sampleRate / maxpos;
  }
  return null;
};

// Convertir Frecuencia (Hz) a Nombre de Nota (C, D#, etc.)
const frequencyToNote = (freq: number): string => {
  const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const h = Math.round(12 * (Math.log(freq / 440) / Math.log(2))) + 69;
  return NOTES[h % 12];
};
