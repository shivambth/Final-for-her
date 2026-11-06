import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, ChevronDown, Download, Heart, Mail, PenLine, Send, Sparkles, Trash2 } from 'lucide-react';
import { type BookPage, type Lang, type PhotoRecord, t } from '../data/types';
import { chapters, timeline } from '../data/book';
import { reasons } from '../data/reasons';
import { envelopes } from '../data/envelopes';
import { downloadBlob, useSaved } from '../lib/storage';
import { BookHeart, Flourish } from './Artwork';
import { BookPhoto } from './Photos';
import { Game } from './Games';

function Paragraphs({ text, className = '' }: { text: string; className?: string }) {
  return <div className={`prose ${className}`}>{text.split('\n\n').map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div>;
}

function HiddenNote({ page, lang }: { page: BookPage; lang: Lang }) {
  const [found, setFound] = useSaved<string[]>('hidden-hearts', []);
  if (!page.hidden) return null;
  const open = found.includes(page.id);
  return <div className={`hidden-note ${open ? 'discovered' : ''}`} data-interactive="true"><button onClick={() => setFound(open ? found.filter(id => id !== page.id) : [...found, page.id])} aria-expanded={open} aria-label={t('Buka pesan hati tersembunyi','Open the hidden heart note')[lang]}><Heart size={16} fill={open ? 'currentColor' : 'none'}/><span>{open ? t('kamu menemukan aku.','you found me.')[lang] : 'psst...'}</span></button>{open && <p>{page.hidden[lang]}</p>}</div>;
}

function Question({ page, lang }: { page: BookPage; lang: Lang }) {
  const [answer, setAnswer] = useSaved(`answer-${page.id}`, '');
  return <div className="question-note" data-interactive="true"><label htmlFor={`answer-${page.id}`}><PenLine size={13}/>{t('Versimu, di sini.','Your words, here.')[lang]}</label><textarea id={`answer-${page.id}`} value={answer} maxLength={2000} onChange={e => setAnswer(e.target.value)} placeholder={t('Tulis kalau kamu mau...','Write if you want...')[lang]} rows={3}/><span className="save-note">{answer ? <><Check size={11}/>{t('Tersimpan di perangkat ini','Saved on this device')[lang]}</> : t('Pribadi. Tersimpan otomatis di perangkat ini.','Private. Saved automatically on this device.')[lang]}</span></div>;
}

function Envelope({ index, lang }: { index: number; lang: Lang }) {
  const [open, setOpen] = useSaved(`envelope-${index}`, false);
  return <div className="envelope-experience" data-interactive="true"><button className={`envelope ${open ? 'is-open' : ''}`} onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? t('Tutup amplop','Close envelope')[lang] : t('Buka amplop','Open envelope')[lang]}><span className="envelope-insert"><Heart size={22}/><span>{t('untukmu, dari aku','for you, from me')[lang]}</span></span><span className="envelope-front"/><span className="envelope-flap"/><span className="wax-seal"><Heart size={18} fill="currentColor"/></span></button><button className="text-button envelope-toggle" onClick={() => setOpen(!open)}>{open ? t('Simpan kembali','Tuck it away')[lang] : t('Ketuk untuk membuka','Tap to open')[lang]}<Mail size={13}/></button>{open && <div className="envelope-letter"><Paragraphs text={envelopes[index].body[lang]}/><span className="letter-signature">Shivam</span></div>}</div>;
}

interface Entry { id: string; name: string; message: string; date: string; }
export function Guestbook({ lang }: { lang: Lang }) {
  const [entries, setEntries] = useSaved<Entry[]>('guestbook', []);
  const [name, setName] = useState('Aira');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setEntries([{ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, name: name.trim(), message: message.trim(), date: new Date().toISOString() }, ...entries]);
    setMessage(''); setSent(true);
  }
  return <div className="guestbook" data-interactive="true"><form onSubmit={submit}><label htmlFor="guest-name">{t('Namamu','Your name')[lang]}</label><input id="guest-name" value={name} onChange={e => setName(e.target.value)} required maxLength={60}/><label htmlFor="guest-message">{t('Pesan kecilmu','Your little note')[lang]}</label><textarea id="guest-message" value={message} onChange={e => { setMessage(e.target.value); setSent(false); }} placeholder={t('Boleh manis. Boleh protes. Yang penting kamu.','Sweet or a complaint. As long as it is you.')[lang]} required maxLength={3000} rows={3}/><button className="small-button" type="submit"><Send size={13}/>{t('Simpan pesanku','Save my note')[lang]}</button></form>{sent && <p className="game-feedback correct" role="status"><Check size={13}/>{t('Tersimpan di sini. Belum dikirim ke Shivam.','Saved here. Not sent to Shivam.')[lang]}</p>}{entries.length > 0 && <><div className="guestbook-actions"><span>{entries.length} {t('catatan kecil','little notes')[lang]}</span><button className="text-button" onClick={() => downloadBlob(new Blob([entries.map(e => `${e.name} | ${e.date}\n${e.message}`).join('\n\n---\n\n')], { type: 'text/plain;charset=utf-8' }), 'aira-and-shivam-notes.txt')}><Download size={12}/>{t('Unduh','Download')[lang]}</button></div><div className="guest-entries">{entries.map(entry => <article className="guest-entry" key={entry.id}><div><span className="handwritten">{entry.name}</span><button className="icon-button" aria-label={t('Hapus catatan ini','Delete this note')[lang]} onClick={() => setEntries(entries.filter(item => item.id !== entry.id))}><Trash2 size={13}/></button></div><p>{entry.message}</p><time dateTime={entry.date}>{new Date(entry.date).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</time></article>)}</div></>}</div>;
}

function RelationshipTimeline({ lang }: { lang: Lang }) {
  const [selected, setSelected] = useSaved('timeline-active', 0);
  return <ol className="relationship-timeline" data-interactive="true">{timeline.map((event, i) => <li key={i} className={selected === i ? 'active' : ''}><button onClick={() => setSelected(selected === i ? -1 : i)} aria-expanded={selected === i}><span className="timeline-dot"/><span><small>{event.label[lang]}</small><strong>{event.title[lang]}</strong></span></button>{selected === i && <p>{event.body[lang]}</p>}</li>)}</ol>;
}

function Final({ lang, celebrate }: { lang: Lang; celebrate: () => void }) {
  const [revealed, setRevealed] = useSaved('final-revealed', false);
  return <div className="final-surprise" data-interactive="true">{revealed ? <><div className="final-heart"><Heart size={44} strokeWidth={1}/></div><h3>LESBICUUUU <span className="final-emoji">❤️</span></h3><p>{t('Iya. Ini penutup resmi buku yang tadi berusaha terlihat anggun.\nSelamat empat bulan, Bebyycuu.','Yes. The official ending of the book that tried so hard to look elegant.\nHappy four months, Bebyycuu.')[lang]}</p><span className="letter-signature">Shivam</span><button className="text-button" onClick={celebrate}><Sparkles size={13}/>{t('Rayakan sekali lagi','Celebrate once more')[lang]}</button></> : <><BookHeart className="final-art"/><p>{t('Oke, Cantikkcuu. Satu kejutan terakhir.','Okay, Cantikkcuu. One last surprise.')[lang]}</p><button className="small-button" onClick={() => { setRevealed(true); celebrate(); }}><Heart size={14}/>{t('Buka kejutan terakhir','Open the final surprise')[lang]}</button></>}</div>;
}

export function PageContent({ page, lang, photos, preview = false, onPhoto, onNavigate, celebrate }: {
  page: BookPage; lang: Lang; photos: PhotoRecord[]; preview?: boolean; onPhoto: (index: number) => void; onNavigate: (number: number) => void; celebrate: () => void;
}) {
  const scroll = useRef<HTMLDivElement>(null);
  const [moreBelow, setMoreBelow] = useState(false);
  useEffect(() => { if (scroll.current) scroll.current.scrollTop = 0; }, [page.id]);
  useEffect(() => {
    const element = scroll.current;
    if (!element || preview) return;
    const measure = () => setMoreBelow(element.scrollHeight - element.clientHeight - element.scrollTop > 14);
    const frame = requestAnimationFrame(measure);
    const size = new ResizeObserver(measure);
    const content = new MutationObserver(measure);
    size.observe(element);
    content.observe(element, { childList: true, subtree: true, characterData: true });
    element.addEventListener('scroll', measure, { passive: true });
    return () => { cancelAnimationFrame(frame); size.disconnect(); content.disconnect(); element.removeEventListener('scroll', measure); };
  }, [page.id, lang, preview, photos]);
  const complex = ['game','envelope','guestbook','final','timeline'].includes(page.kind);
  const label = page.kind === 'letter' ? `${t('SURAT','LETTER')[lang]} ${String((page.letter ?? 0) + 1).padStart(2,'0')} / 12` : `${String(page.chapter + 1).padStart(2,'0')} / ${chapters[page.chapter].title[lang]}`;
  return <article className={`paper-page kind-${page.kind} ${preview ? 'preview-page' : 'current-page'}`} data-page={page.number} aria-label={`${t('Halaman','Page')[lang]} ${page.number}`}><div className="page-running-head"><span>{label}</span>{page.kind === 'letter' && <span>{(page.part ?? 0) + 1} / 3</span>}</div><div className="paper-content" ref={scroll} tabIndex={preview ? -1 : 0} aria-label={t('Isi halaman, gulir untuk membaca','Page content, scroll to read')[lang]}>
    {page.kind === 'dedication' && <BookHeart className="dedication-heart"/>}
    <h2>{page.title[lang]}</h2>
    {page.kind === 'quote' && <Flourish className="quote-flourish"/>}
    {(!complex || preview) && page.kind !== 'reasons' && <Paragraphs text={page.body[lang]} className={page.kind === 'letter' && page.part === 0 ? 'drop-cap' : ''}/>}
    {page.kind === 'reasons' && <div className="reasons-list">{page.reasons?.map(i => <div className="reason" key={i}><span className="reason-number">{String(i + 1).padStart(2,'0')}</span><p>{reasons[i][lang]}</p></div>)}{page.detail && <p className="reasons-afterword">{page.detail[lang]}</p>}<Flourish className="reasons-flourish"/></div>}
    {page.photos && <div className={`page-photos layout-${page.layout || 'polaroid'} ${page.photos.length > 1 ? 'multiple-photos' : ''}`}>{page.photos.map(index => <BookPhoto key={photos[index].id} photo={photos[index]} lang={lang} onClick={() => onPhoto(index)} plain={preview}/>)}</div>}
    {!preview && page.kind === 'question' && <Question page={page} lang={lang}/>}
    {!preview && page.kind === 'game' && <Game index={page.game!} lang={lang}/>}
    {!preview && page.kind === 'envelope' && <Envelope index={page.envelope!} lang={lang}/>}
    {!preview && page.kind === 'timeline' && <><p className="page-intro">{page.body[lang]}</p><RelationshipTimeline lang={lang}/></>}
    {!preview && page.kind === 'guestbook' && <><p className="page-intro">{page.body[lang]}</p><Guestbook lang={lang}/></>}
    {!preview && page.kind === 'final' && <Final lang={lang} celebrate={celebrate}/>}
    {preview && complex && <div className="previous-interaction"><BookHeart className="preview-heart"/><button className="text-button" onClick={() => onNavigate(page.number)}>{t('Kembali ke halaman ini','Return to this page')[lang]}<ArrowRight size={13}/></button></div>}
    {!preview && page.hidden && <HiddenNote page={page} lang={lang}/>}
    {page.kind === 'letter' && <div className="letter-ending">{page.part === 2 ? <span className="letter-signature">Shivam</span> : <span>{t('Masih ada di halaman berikutnya.','Continued on the next page.')[lang]}</span>}</div>}
    {page.kind === 'note' && <Heart className="note-heart" size={22} strokeWidth={.8}/>}
  </div><div className="page-folio"><span>{preview ? 'SHIVAM & AIRA' : 'OUR LITTLE FOREVER'}</span>{!preview && moreBelow && <span className="scroll-cue"><ChevronDown size={9}/>{t('gulir untuk baca','scroll to read')[lang]}</span>}<span>{String(page.number).padStart(2,'0')}</span></div></article>;
}