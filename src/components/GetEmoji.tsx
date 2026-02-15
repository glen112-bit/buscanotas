export const getEmoji = (name: string): string => {
  const emojiMap: { [key: string]: string } = {
    vocals: '🎤',
    drums: '🥁',
    bass: '🎸',
    guitar: '🎸', // Ya reconoce la guitarra
    other: '🎹',
    instrumental: '🎼'
  };

  // Convertimos a minúsculas para que coincida siempre
  const key = name.toLowerCase();
  
  return emojiMap[key] || '🎵'; 
};
