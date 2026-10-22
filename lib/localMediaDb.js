const DB_NAME = 'ellalody-local-media';
const DB_VERSION = 1;

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('This browser does not support persistent local media storage.'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('audio')) db.createObjectStore('audio', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('videos')) db.createObjectStore('videos', { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open local media storage.'));
  });
}

export async function saveLocalMedia(kind, item) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(kind, 'readwrite');
    tx.objectStore(kind).put({ ...item, blob: item.blob || item.file });
    tx.oncomplete = () => { db.close(); resolve(true); };
    tx.onerror = () => { const error = tx.error; db.close(); reject(error || new Error('Storage is full or the file could not be saved.')); };
    tx.onabort = () => { const error = tx.error; db.close(); reject(error || new Error('File saving was cancelled.')); };
  });
}

export async function getLocalMedia(kind) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(kind, 'readonly');
    const request = tx.objectStore(kind).getAll();
    request.onsuccess = () => {
      const records = request.result || [];
      db.close();
      resolve(records.map(({ blob, file, ...meta }) => ({ ...meta, blob: blob || file, url: URL.createObjectURL(blob || file), localUrl: URL.createObjectURL(blob || file) })));
    };
    request.onerror = () => { const error = request.error; db.close(); reject(error || new Error('Could not load saved files.')); };
  });
}

export async function deleteLocalMedia(kind, id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(kind, 'readwrite');
    tx.objectStore(kind).delete(id);
    tx.oncomplete = () => { db.close(); resolve(true); };
    tx.onerror = () => { const error = tx.error; db.close(); reject(error || new Error('Could not remove this file.')); };
  });
}
