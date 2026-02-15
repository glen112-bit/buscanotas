// db.ts
import { openDB } from 'idb'; // Necesitas instalarlo: npm install idb

const DB_NAME = 'BuscaNotaDB';

export const saveStemsToDB = async (stems: { [key: string]: File | Blob }) => {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore('stems');
    },
  });
  
  const tx = db.transaction('stems', 'readwrite');
  for (const [name, blob] of Object.entries(stems)) {
    await tx.store.put(blob, name);
  }
  await tx.done;
};

export const getStemsFromDB = async () => {
  const db = await openDB(DB_NAME, 1);
  const keys = await db.getAllKeys('stems');
  const stems: { [key: string]: string } = {};
  
  for (const key of keys) {
    const blob = await db.get('stems', key);
    stems[key as string] = URL.createObjectURL(blob);
  }
  return stems;
};
