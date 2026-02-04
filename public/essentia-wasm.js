useEffect(() => {
    const script = document.createElement('script');
    // Ahora lo carga desde TU propia carpeta pública, sin depender de internet
    script.src = "/essentia-wasm.js"; 
    script.async = true;
    script.onload = () => {
      try {
        essentiaRef.current = new (window as any).EssentiaWASM();
        setIsEngineReady(true);
        console.log("🚀 MOTOR LOCAL LISTO");
      } catch (e) { console.error(e); }
    };
    script.onerror = () => console.error("❌ Ni siquiera el archivo local cargó. Revisa la carpeta public.");
    document.body.appendChild(script);
}, []);
