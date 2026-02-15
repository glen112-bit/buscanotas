// utils/db.ts
export const DB_NAME = "BuscaNotaAudioDB";
export const STORE_NAME = "stems"; // <--- Faltaba el 'export' aquí

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      // Verificamos si el objectStore ya existe para evitar errores
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveToDB = async (key: string, blob: Blob) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getAllStemsFromDB = async () => {
  const db = await initDB();
  return new Promise<{ [key: string]: string }>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    
    // Obtenemos todo el contenido
    const request = store.getAll();
    const keysRequest = store.getAllKeys();

    tx.oncomplete = () => {
      const blobs = request.result;
      const keys = keysRequest.result;
      const result: { [key: string]: string } = {};
      
      keys.forEach((key, i) => {
        // Importante: blobs[i] debe ser un Blob o File
        if (blobs[i] instanceof Blob) {
          result[key as string] = URL.createObjectURL(blobs[i]);
        }
      });
      resolve(result);
    };

    tx.onerror = () => reject(tx.error);
  });
};
