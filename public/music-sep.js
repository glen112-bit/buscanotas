// Forzar la exportación al objeto global window
if (typeof MusicSep !== 'undefined') {
    window.MusicSep = MusicSep;
} else if (typeof music_separation !== 'undefined') {
    window.MusicSep = music_separation.MusicSep;
}
console.log("🚀 IA forzada en window.MusicSep");
