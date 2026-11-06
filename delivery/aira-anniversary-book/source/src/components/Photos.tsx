import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Download, ImagePlus, LoaderCircle, Maximize2, SlidersHorizontal, Upload, X } from 'lucide-react';
import type { Lang, PhotoRecord } from '../data/types';
import { t } from '../data/types';
import { BookHeart, Botanical } from './Artwork';

type PhotoProps = { photo: PhotoRecord; lang: Lang; onClick?: () => void; plain?: boolean };
export function PhotoPlaceholder({ lang, large = false }: { lang: Lang; large?: boolean }) {
  return <div className={`photo-placeholder ${large ? 'large' : ''}`}><Botanical className="placeholder-botanical"/><BookHeart className="placeholder-heart"/><span>{t('di sini, kenangan kita', 'our memory belongs here')[lang]}</span></div>;
}

export function BookPhoto({ photo, lang, onClick, plain = false }: PhotoProps) {
  const [state, setState] = useState<'loading' | 'loaded' | 'missing'>(photo.src ? 'loading' : 'missing');
  useEffect(() => setState(photo.src ? 'loading' : 'missing'), [photo.src]);
  const content = <><div className="photo-window">{state === 'loading' && <div className="image-loading"><LoaderCircle size={20} className="spin"/></div>}{photo.src && state !== 'missing' ? <img src={photo.src} alt={photo.alt[lang]} loading="lazy" style={{ objectPosition: `${photo.focalX}% ${photo.focalY}%` }} onLoad={() => setState('loaded')} onError={() => setState('missing')}/> : <PhotoPlaceholder lang={lang}/>}<span className="photo-expand"><Maximize2 size={12}/></span></div><span className="photo-caption">{photo.caption[lang]}</span></>;
  return plain ? <div className="polaroid">{content}</div> : <button className="polaroid" onClick={onClick} data-interactive="true" aria-label={`${t('Perbesar foto','Enlarge photo')[lang]}: ${photo.caption[lang]}`}>{content}</button>;
}

export function PhotoLightbox({ photos, index, setIndex, lang, close, importOpen, setFocal }: {
  photos: PhotoRecord[]; index: number; setIndex: (index: number) => void; lang: Lang; close: () => void; importOpen: () => void; setFocal: (slot: number, x: number, y: number) => void;
}) {
  const photo = photos[index];
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [crop, setCrop] = useState(false);
  const pointer = useRef({ x: 0, y: 0 });
  const navigate = (delta: number) => setIndex((index + delta + photos.length) % photos.length);
  useEffect(() => { setLoaded(false); setError(false); setCrop(false); }, [index, photo.src]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches('input,textarea,select') && e.key !== 'Escape') return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); setIndex((index - 1 + photos.length) % photos.length); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setIndex((index + 1) % photos.length); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [index, setIndex, photos.length]);
  return <div className="modal-backdrop lightbox-backdrop" onClick={close}><section role="dialog" aria-modal="true" aria-label={t('Foto kenangan','Memory photograph')[lang]} className="lightbox" onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}><div className="lightbox-top"><span>{t('KENANGAN KECIL KITA','OUR LITTLE MEMORIES')[lang]}</span><span>{String(index + 1).padStart(2,'0')} / 50</span><button className="icon-button" aria-label={t('Tutup foto','Close photo')[lang]} onClick={close}><X size={20}/></button></div><div className="lightbox-image" onPointerDown={e => { pointer.current = { x: e.clientX, y: e.clientY }; }} onPointerUp={e => { const dx = e.clientX - pointer.current.x, dy = e.clientY - pointer.current.y; if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) navigate(dx < 0 ? 1 : -1); }}>{photo.src && !error ? <>{!loaded && <LoaderCircle className="spin" size={28}/>}<img key={photo.id} src={photo.src} alt={photo.alt[lang]} className={loaded ? 'loaded' : ''} style={{ objectFit: crop ? 'cover' : 'contain', objectPosition: `${photo.focalX}% ${photo.focalY}%` }} onLoad={() => setLoaded(true)} onError={() => setError(true)}/></> : <><PhotoPlaceholder lang={lang} large/><p className="missing-notice">{t('Foto aslinya belum ditambahkan.', 'The original photo has not been added yet.')[lang]}</p><button className="small-button" onClick={importOpen}><ImagePlus size={15}/>{t('Tambahkan foto kita','Add our photos')[lang]}</button></>}</div><div className="lightbox-bottom"><button className="round-button" onClick={() => navigate(-1)} aria-label={t('Foto sebelumnya','Previous photo')[lang]}><ArrowLeft size={18}/></button><div><p className="handwritten">{photo.caption[lang]}</p>{photo.filename && <span className="original-filename">{photo.filename}</span>}</div><button className="round-button" onClick={() => navigate(1)} aria-label={t('Foto berikutnya','Next photo')[lang]}><ArrowRight size={18}/></button></div>{photo.src && !error && <details className="focal-settings"><summary><SlidersHorizontal size={13}/>{t('Atur komposisi foto','Adjust photo composition')[lang]}</summary><label><input type="checkbox" checked={crop} onChange={e => setCrop(e.target.checked)}/>{t('Pratinjau potongan (aslinya tetap utuh)','Preview crop (the original stays intact)')[lang]}</label><label>{t('Kiri / kanan','Left / right')[lang]}<input type="range" min="0" max="100" value={photo.focalX} onChange={e => setFocal(index, Number(e.target.value), photo.focalY)}/></label><label>{t('Atas / bawah','Up / down')[lang]}<input type="range" min="0" max="100" value={photo.focalY} onChange={e => setFocal(index, photo.focalX, Number(e.target.value))}/></label><p>{t('Foto di buku selalu ditampilkan utuh, tidak diregangkan.', 'Photos in the book are always shown whole, never stretched.')[lang]}</p></details>}</section></div>;
}

export function PhotoManager({ photos, lang, busy, importPhotos, exportBook, view, storageWarning }: {
  photos: PhotoRecord[]; lang: Lang; busy: boolean; importPhotos: (files: File[]) => Promise<void>; exportBook: () => Promise<void>; view: (index: number) => void; storageWarning: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState('');
  const [dragging, setDragging] = useState(false);
  const count = photos.filter(photo => photo.src).length;
  const accept = async (files: File[]) => {
    try { await importPhotos(files); setStatus('success'); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'decode'); }
  };
  const statuses: Record<string, ReturnType<typeof t>> = {
    success: t('Foto tersimpan. Nama file asli tetap sama.', 'Photos saved. Original filenames preserved.'),
    count: t('Maksimal 50 foto dalam sekali impor.', 'Import up to 50 photos at a time.'),
    type: t('Pilih file JPEG asli (.jpeg atau .jpg).', 'Choose original JPEG files (.jpeg or .jpg).'),
    duplicate: t('Ada nama file yang sama. Pilih file dengan nama asli yang berbeda.', 'Some filenames are duplicates. Choose files with distinct original names.'),
    size: t('Maksimal 20 MB per foto agar perangkat tetap nyaman.', 'Keep each photo below 20 MB so the device stays responsive.'),
    decode: t('Ada foto yang tidak bisa dibaca. Coba pilih file JPEG yang lain.', 'A photo could not be read. Try another JPEG file.'),
    export: t('ZIP belum tersedia di mode pengembangan. Gunakan versi produksi yang disertakan, atau bangun dan kemas proyek terlebih dahulu.', 'The ZIP is not available in development mode. Use the included production edition, or build and package the project first.'),
    downloaded: t('ZIP pribadi sudah dibuat beserta foto yang ditambahkan.', 'Your personalised ZIP has been created with the added photos.'),
  };
  return <div className="photo-manager"><div className="photo-manager-intro"><p>{t('50 ruang foto tersebar di buku ini. File dan nama asli belum disertakan dalam permintaan awal. Tidak ada foto orang lain yang dipakai sebagai pengganti.', '50 photo spaces are distributed throughout the book. Original files and filenames were not supplied with the initial request. No strangers\' pictures are used as substitutes.')[lang]}</p><strong>{count} / 50 {t('foto ditambahkan','photos added')[lang]}</strong></div><button className={`upload-area ${dragging ? 'dragging' : ''}`} disabled={busy} onClick={() => input.current?.click()} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); void accept(Array.from(e.dataTransfer.files)); }}>{busy ? <LoaderCircle className="spin" size={28}/> : <Upload size={28} strokeWidth={1.2}/>}<span>{t('Pilih atau letakkan foto kita di sini', 'Choose or drop our photos here')[lang]}</span><small>{t('JPEG saja. Urutan pilihan menjadi urutan foto. Nama file tidak diubah.', 'JPEG only. Selection order becomes photo order. Filenames are not changed.')[lang]}</small></button><input ref={input} className="sr-only" type="file" multiple accept="image/jpeg,.jpeg,.jpg" aria-label={t('Pilih foto JPEG','Choose JPEG photographs')[lang]} onChange={e => { void accept(Array.from(e.target.files || [])); e.target.value = ''; }}/>{status && <p role="status" className={`import-status ${status === 'success' || status === 'downloaded' ? 'success' : ''}`}>{(status === 'success' || status === 'downloaded') && <Check size={14}/>} {statuses[status]?.[lang] || statuses.decode[lang]}</p>}{storageWarning && <p className="import-status">{t('Penyimpanan browser tidak tersedia. Foto ada untuk sesi ini; unduh ZIP agar tidak hilang.', 'Browser storage is unavailable. Photos are available for this session; download the ZIP to keep them.')[lang]}</p>}<div className="photo-manager-actions"><button className="small-button" disabled={busy} onClick={async () => { try { await exportBook(); setStatus('downloaded'); } catch { setStatus('export'); } }}><Download size={15}/>{busy ? t('Menyiapkan...','Preparing...')[lang] : t('Unduh buku + foto asli','Download book + original photos')[lang]}</button><span>{t('Pribadi di perangkat ini. Tidak diunggah ke server.', 'Private to this device. Nothing is uploaded to a server.')[lang]}</span></div><div className="photo-slots">{photos.map((photo, i) => <button key={photo.id} onClick={() => view(i)} title={photo.filename || t('Belum ada foto','No photo yet')[lang]}><span className="slot-number">{String(i + 1).padStart(2,'0')}</span>{photo.src ? <img src={photo.src} alt={photo.alt[lang]} loading="lazy" onError={e => { e.currentTarget.style.display = 'none'; }}/>: <ImagePlus size={21} strokeWidth={1}/>}<span className="slot-filename">{photo.filename || t('Ruang fotomu','Your photo space')[lang]}</span></button>)}</div></div>;
}