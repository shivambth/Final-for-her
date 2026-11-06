import { useCallback, useEffect, useRef, useState } from 'react';
import { unzipSync, zipSync, strToU8, strFromU8 } from 'fflate';
import { photoManifest } from '../data/photos';
import { downloadBlob, readSaved } from './storage';
import type { PhotoRecord } from '../data/types';

interface StoredPhoto { slot: number; filename: string; blob?: Blob; focalX: number; focalY: number; }
type PhotoInput = Partial<PhotoRecord> & { slot?: number };
type FocalMap = Record<number, { filename: string; x: number; y: number }>;

function rememberFocals(changes: FocalMap) {
  try {
    const previous = readSaved<FocalMap>('photo-focals', {});
    localStorage.setItem('aira:photo-focals', JSON.stringify({ ...previous, ...changes }));
  } catch { /* IndexedDB remains the fallback when synchronous metadata storage is unavailable. */ }
}
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('aira-keepsake-photos', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('photos', { keyPath: 'slot' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function getStored(): Promise<StoredPhoto[]> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('photos', 'readonly');
    const req = transaction.objectStore('photos').getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    transaction.oncomplete = () => db.close();
  });
}
async function saveStored(records: StoredPhoto[]) {
  const db = await database();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('photos', 'readwrite');
    const store = tx.objectStore('photos');
    records.forEach(record => store.put(record));
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
    tx.onabort = () => { db.close(); reject(tx.error); };
  });
}

export function usePhotos() {
  const [photos, setPhotos] = useState<PhotoRecord[]>(photoManifest);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);
  const stored = useRef<StoredPhoto[]>([]);
  const urls = useRef<string[]>([]);
  useEffect(() => {
    let mounted = true;
    async function load() {
      const manifest = await fetch('./assets/photos/manifest.json').then(r => r.ok ? r.json() as Promise<PhotoInput[]> : []).catch(() => [] as PhotoInput[]);
      const personal = await getStored().catch(() => [] as StoredPhoto[]);
      if (!mounted) return;
      stored.current = personal;
      const focals = readSaved<FocalMap>('photo-focals', {});
      setPhotos(photoManifest.map((record, i) => {
        const external = Array.isArray(manifest) ? manifest.find((entry, j) => (entry.slot ?? j) === i) : undefined;
        const local = personal.find(item => item.slot === i);
        let src = external?.src || (external?.filename ? `./assets/photos/${encodeURIComponent(external.filename)}` : null);
        if (local?.blob) { src = URL.createObjectURL(local.blob); urls.current.push(src); }
        const photo = { ...record, ...external, ...(local ? { filename: local.filename, focalX: local.focalX, focalY: local.focalY } : {}), src };
        const focal = focals[i];
        return focal && focal.filename === photo.filename ? { ...photo, focalX: focal.x, focalY: focal.y } : photo;
      }));
      setReady(true);
    }
    void load();
    return () => { mounted = false; urls.current.forEach(URL.revokeObjectURL); urls.current = []; };
  }, []);

  const importPhotos = useCallback(async (files: File[]) => {
    if (!files.length) return;
    if (files.length > 50) throw new Error('count');
    if (files.some(file => !/\.jpe?g$/i.test(file.name) || (file.type && file.type !== 'image/jpeg'))) throw new Error('type');
    if (new Set(files.map(file => file.name)).size !== files.length) throw new Error('duplicate');
    if (files.some(file => file.size > 20 * 1024 * 1024)) throw new Error('size');
    setBusy(true);
    try {
      // Decode before saving, so a renamed non-image cannot silently occupy a photo slot.
      await Promise.all(files.map(file => createImageBitmap(file).then(bitmap => bitmap.close())));
      const incoming: StoredPhoto[] = files.map((file, slot) => ({ slot, filename: file.name, blob: file, focalX: 50, focalY: 50 }));
      const merged = [...incoming, ...stored.current.filter(item => item.slot >= incoming.length)];
      await saveStored(merged).catch(() => setStorageWarning(true));
      stored.current = merged;
      rememberFocals(Object.fromEntries(files.map((file, slot) => [slot, { filename: file.name, x: 50, y: 50 }])));
      setPhotos(previous => previous.map((record, i) => {
        const file = files[i];
        if (!file) return record;
        const src = URL.createObjectURL(file);
        urls.current.push(src);
        return { ...record, src, filename: file.name, focalX: 50, focalY: 50 };
      }));
    } catch (error) {
      if (error instanceof Error && ['count','type','duplicate','size'].includes(error.message)) throw error;
      throw new Error('decode');
    } finally { setBusy(false); }
  }, []);

  const setFocal = useCallback((slot: number, focalX: number, focalY: number) => {
    setPhotos(previous => previous.map((photo, i) => i === slot ? { ...photo, focalX, focalY } : photo));
    const photo = photos[slot];
    if (photo.filename) {
      // Small synchronous metadata prevents a fast reload from racing the blob database transaction.
      rememberFocals({ [slot]: { filename: photo.filename, x: focalX, y: focalY } });
      const existing = stored.current.find(record => record.slot === slot);
      const updated: StoredPhoto = { ...existing, slot, filename: photo.filename, focalX, focalY };
      stored.current = [...stored.current.filter(record => record.slot !== slot), updated];
      void saveStored([updated]).catch(() => setStorageWarning(true));
    }
  }, [photos]);

  const exportBook = useCallback(async () => {
    setBusy(true);
    try {
      const response = await fetch('./aira-anniversary-book.zip');
      if (!response.ok) throw new Error('archive');
      const baseArchive = new Uint8Array(await response.arrayBuffer());
      const archive = unzipSync(baseArchive);
      const root = 'aira-anniversary-book/';
      archive[`${root}aira-anniversary-book.zip`] = baseArchive;
      const manifest = [];
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (!photo.filename || !photo.src) continue;
        const blob = stored.current.find(item => item.slot === i)?.blob;
        const data = blob ? await blob.arrayBuffer() : await fetch(photo.src).then(r => { if (!r.ok) throw new Error('photo'); return r.arrayBuffer(); });
        archive[`${root}assets/photos/${photo.filename}`] = new Uint8Array(data);
        archive[`${root}source/public/assets/photos/${photo.filename}`] = new Uint8Array(data);
        manifest.push({ ...photo, slot: i, src: `./assets/photos/${encodeURIComponent(photo.filename)}` });
      }
      archive[`${root}assets/photos/manifest.json`] = strToU8(JSON.stringify(manifest, null, 2));
      archive[`${root}source/public/assets/photos/manifest.json`] = strToU8(JSON.stringify(manifest, null, 2));
      const photoStatus = strToU8(`${manifest.length} of 50 personal photographs included. Original filenames and bytes preserved. Remaining photo spaces are intentional placeholders.\n`);
      for (const path of ['PHOTO-STATUS.txt','assets/photos/PHOTO-STATUS.txt','source/public/assets/photos/PHOTO-STATUS.txt']) archive[root + path] = photoStatus;
      for (const path of ['README.md','source/README.md']) {
        if (archive[root + path]) archive[root + path] = strToU8(strFromU8(archive[root + path]).replace('This delivery does not contain 50 personal photographs.', `${manifest.length} personal photographs are included in this personalised export.`));
      }
      const bytes = zipSync(archive, { level: 6 });
      downloadBlob(new Blob([bytes as BlobPart], { type: 'application/zip' }), 'aira-anniversary-book-personal.zip');
    } finally { setBusy(false); }
  }, [photos]);

  return { photos, ready, busy, storageWarning, importPhotos, setFocal, exportBook };
}