const autoAlignContent = () => {
  const lines = content.split('\n');
  const alignedLines: string[] = [];
  const chordRegex = /\b([A-G][b#]?(m|maj|7|sus|dim|aug|add|9|11|13)?|Do|Re|Mi|Fa|Sol|La|Si)\b/g;

  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];
    const nextLine = lines[i + 1] || "";

    // Si la línea actual tiene acordes y la siguiente tiene letra
    if (chordRegex.test(currentLine) && nextLine.trim().length > 0 && !chordRegex.test(nextLine)) {
      const chordsInLine = Array.from(currentLine.matchAll(chordRegex));
      let newChordLine = "".padEnd(nextLine.length, " ");
      let lastPos = 0;

      chordsInLine.forEach((match) => {
        const chord = match[0];
        const oldPos = match.index || 0;
        
        // Buscamos la posición más lógica en la letra (inicio de palabra cercana)
        let targetPos = oldPos;
        if (nextLine[oldPos] === " " || nextLine[oldPos] === undefined) {
          // Si cae en espacio, busca la letra más cercana hacia adelante
          const nearestLetter = nextLine.slice(oldPos).search(/\S/);
          if (nearestLetter !== -1) targetPos = oldPos + nearestLetter;
        }

        // Evitar que un acorde se encime sobre otro
        if (targetPos < lastPos) targetPos = lastPos;

        // Construir la nueva línea de acordes
        newChordLine = 
          newChordLine.substring(0, targetPos) + 
          chord + 
          newChordLine.substring(targetPos + chord.length);
        
        lastPos = targetPos + chord.length + 1;
      });

      alignedLines.push(newChordLine.trimEnd());
    } else {
      alignedLines.push(currentLine);
    }
  }
  setContent(alignedLines.join('\n'));
};
