import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowLeft, ArrowRight, Bookmark, BookOpen, Check, ChevronDown, ChevronLeft, ChevronRight, Download, Gamepad2, Heart, Image, Info, List, Mail, Menu, MessageCircle, PenLine, Search, Volume2, VolumeX, X } from 'lucide-react';
import { chapters, pages } from './data/book';
import { t, type Lang } from './data/types';
import { usePhotos } from './lib/photos';
import { readSaved, useFocusTrap, useSaved } from './lib/storage';
import { BookHeart, Botanical, Corner, Flourish } from './components/Artwork';
import { PageContent } from './components/PageContent';
import { PhotoLightbox, PhotoManager } from './components/Photos';
import { Confetti } from './components/Confetti';

type Modal = 'contents' | 'little' | 'photos' | 'about' | null;

export default function App() {
  const [lang, setLang] = useSaved<Lang>('language', 'id');
  const [position, setPosition] = useSaved<number>('position', 1);
  const pageNumber = Math.min(200, Math.max(1, Number(position) || 1));
  const page = pages[pageNumber - 1];
  const [open, setOpen] = useState(false);
  const [opening, setOpening] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [sound, setSound] = useSaved('sound', false);
  const [bookmarks, setBookmarks] = useSaved<number[]>('bookmarks', []);
  const [flip, setFlip] = useState<{ from: number; direction: number } | null>(null);
  const [search, setSearch] = useState('');
  const [jump, setJump] = useState('');
  const [confetti, setConfetti] = useState(0);
  const [toast, setToast] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const photos = usePhotos();
  const gesture = useRef({ x: 0, y: 0, active: false });
  const flipTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const openingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const audio = useRef<AudioContext | null>(null);
  const flipping = useRef(false);
  const contentRef = useRef<HTMLElement>(null);

  const closeOverlay = useCallback(() => { setModal(null); setLightbox(null); }, []);
  useFocusTrap(modal !== null || lightbox !== null, closeOverlay);
  useEffect(() => { document.documentElement.lang = lang; document.title = 'Our Little Forever | Shivam & Aira'; }, [lang]);
  useEffect(() => () => { flipTimers.current.forEach(clearTimeout); clearTimeout(openingTimer.current); void audio.current?.close(); }, []);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 2800); return () => clearTimeout(timer); }, [toast]);

  const playSound = useCallback((enabled = sound, celebration = false) => {
    if (!enabled) return;
    try {
      const Context = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audio.current ??= new Context();
      const context = audio.current;
      if (context.state === 'suspended') void context.resume();
      const start = context.currentTime;
      if (celebration) {
        [261.63, 329.63, 392, 523.25].forEach((frequency, i) => {
          const oscillator = context.createOscillator(), gain = context.createGain();
          oscillator.type = 'sine'; oscillator.frequency.value = frequency;
          gain.gain.setValueAtTime(0, start + i * .12); gain.gain.linearRampToValueAtTime(.055, start + i * .12 + .02); gain.gain.exponentialRampToValueAtTime(.001, start + i * .12 + .8);
          oscillator.connect(gain); gain.connect(context.destination); oscillator.start(start + i * .12); oscillator.stop(start + i * .12 + .85);
        });
      } else {
        const buffer = context.createBuffer(1, Math.floor(context.sampleRate * .14), context.sampleRate);
        const channel = buffer.getChannelData(0);
        for (let i = 0; i < channel.length; i++) channel[i] = (Math.random() * 2 - 1) * .13;
        const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
        source.buffer = buffer; filter.type = 'lowpass'; filter.frequency.value = 1200;
        gain.gain.setValueAtTime(.25, start); gain.gain.exponentialRampToValueAtTime(.001, start + .14);
        source.connect(filter); filter.connect(gain); gain.connect(context.destination); source.start();
      }
    } catch { /* Optional sound never blocks reading. */ }
  }, [sound]);
  const celebrate = useCallback(() => { setConfetti(value => value + 1); playSound(sound, true); }, [sound, playSound]);
  const go = useCallback((number: number, animate = true) => {
    const next = Math.min(pages.length, Math.max(1, number));
    if (next === pageNumber || flipping.current) return;
    if (animate && open) {
      flipping.current = true; setFlip({ from: pageNumber, direction: next > pageNumber ? 1 : -1 });
      flipTimers.current.push(setTimeout(() => setPosition(next), 180));
      flipTimers.current.push(setTimeout(() => { setFlip(null); flipping.current = false; }, 620));
    } else setPosition(next);
    playSound();
  }, [pageNumber, setPosition, open, playSound]);
  const jumpTo = useCallback((number: number) => {
    clearTimeout(openingTimer.current);
    flipTimers.current.forEach(clearTimeout); flipping.current = false; setFlip(null);
    setPosition(Math.min(pages.length, Math.max(1, number))); setOpen(true); setOpening(false); setModal(null); setLightbox(null); setMobileNav(false); setSearch(''); setJump('');
    setTimeout(() => contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }, [setPosition]);
  const openBook = () => {
    if (opening) return;
    setOpening(true); playSound();
    openingTimer.current = setTimeout(() => { setOpen(true); setOpening(false); }, 650);
  };
  const closeBook = () => { clearTimeout(openingTimer.current); setOpen(false); setOpening(false); setMobileNav(false); flipTimers.current.forEach(clearTimeout); flipping.current = false; setFlip(null); playSound(); };
  useEffect(() => {
    const keyboard = (e: KeyboardEvent) => {
      if (!open || modal || lightbox !== null || e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, select, [contenteditable], [data-interactive="true"]')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(pageNumber + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(pageNumber - 1); }
      if (e.key === 'Home') { e.preventDefault(); go(1); }
      if (e.key === 'End') { e.preventDefault(); go(200); }
    };
    window.addEventListener('keydown', keyboard);
    return () => window.removeEventListener('keydown', keyboard);
  }, [open, modal, lightbox, pageNumber, go]);
  const toggleBookmark = () => {
    const exists = bookmarks.includes(pageNumber);
    setBookmarks(exists ? bookmarks.filter(value => value !== pageNumber) : [...bookmarks, pageNumber]);
    setToast(exists ? t('Penanda dilepas.','Bookmark removed.')[lang] : t('Halaman ditandai. Ada di daftar bab.','Page bookmarked. Find it in the contents.')[lang]);
  };
  const showPhoto = (index: number) => { setModal(null); setLightbox(index); };
  const navModal = (next: Modal) => { setModal(next); setMobileNav(false); };
  const title = modal === 'contents' ? t('Buka bab mana?', 'Where shall we go?')[lang] : modal === 'little' ? t('Ada yang kuselipkan.', 'A few things I tucked in.')[lang] : modal === 'photos' ? t('Foto-foto kecil kita.', 'Our little photographs.')[lang] : t('Tentang buku ini.', 'About this little book.')[lang];

  return <div className={`app ${open ? 'is-reading' : ''}`}>
    <a className="skip-link" href="#main">{t('Langsung ke buku','Skip to the book')[lang]}</a>
    <header className="site-header">
      <button className="brand" onClick={closeBook} aria-label={t('Kembali ke sampul','Return to the cover')[lang]}><span className="brand-icon"><BookOpen size={25} strokeWidth={1.15}/><Heart size={9} strokeWidth={1.2}/></span><span>a little us<span className="brand-dot">.</span></span></button>
      <nav className={`main-nav ${mobileNav ? 'mobile-open' : ''}`} aria-label={t('Navigasi utama','Main navigation')[lang]}><button onClick={() => jumpTo(7)} className={open && pageNumber >= 7 && pageNumber <= 54 ? 'active' : ''}>{t('Kisah kita','Our story')[lang]}</button><button onClick={() => navModal('contents')}>{t('Daftar bab','The chapters')[lang]}</button><button onClick={() => navModal('little')}>{t('Hal-hal kecil','Little things')[lang]}<ChevronDown size={11}/></button></nav>
      <div className="header-actions"><div className="language-toggle" aria-label={t('Bahasa','Language')[lang]}><button onClick={() => setLang('id')} aria-pressed={lang === 'id'} className={lang === 'id' ? 'active' : ''}>ID</button><span>/</span><button onClick={() => setLang('en')} aria-pressed={lang === 'en'} className={lang === 'en' ? 'active' : ''}>EN</button></div><span className="header-divider"/><button className={`sound-button ${sound ? 'enabled' : ''}`} aria-label={sound ? t('Matikan suara halaman','Turn page sounds off')[lang] : t('Aktifkan suara halaman','Turn page sounds on')[lang]} aria-pressed={sound} title={t('Suara halaman, opsional','Optional page sounds')[lang]} onClick={() => { setSound(!sound); if (!sound) playSound(true); }}>{sound ? <Volume2 size={17} strokeWidth={1.4}/> : <VolumeX size={17} strokeWidth={1.4}/>}</button><button className="icon-button mobile-menu" aria-expanded={mobileNav} aria-label={t('Buka menu','Open menu')[lang]} onClick={() => setMobileNav(!mobileNav)}>{mobileNav ? <X size={19}/> : <Menu size={19}/>}</button></div>
    </header>
    <main id="main" ref={contentRef} className="main-content">
      {!open ? <div className={`cover-view ${opening ? 'is-opening' : ''}`}>
        <div className="cover-intro"><div className="eyebrow"><span/><Heart size={10} strokeWidth={1.2}/>{t('EMPAT BULAN. SATU CERITA KITA.', 'FOUR MONTHS. ONE LITTLE STORY.')[lang]}<span/></div><h1>Our Little <em>Forever</em><span className="title-star">*</span></h1><p>{t('Bukan kisah yang sempurna. Tapi ini kisah kita.', 'Not a perfect story. But it is ours.')[lang]}</p></div>
        <div className="cover-stage"><Botanical className="ambient-sprig sprig-left"/><Botanical className="ambient-sprig sprig-right" flip/><span className="ambient-cross cross-one">+</span><span className="ambient-cross cross-two">+</span><span className="ambient-spark spark-one"/><span className="ambient-spark spark-two"/>
          <div className="cover-scene"><div className="book-shadow"/><div className="closed-book"><div className="book-back"/><div className="book-page-block"/><div className="book-ribbon"/><button className="hardcover" onClick={openBook} aria-label={t('Buka buku untuk Aira','Open the book for Aira')[lang]} disabled={opening}><div className="cover-spine"><span>SHIVAM & AIRA</span></div><div className="cover-border"><Corner className="cover-corner corner-tl"/><Corner className="cover-corner corner-tr"/><Corner className="cover-corner corner-bl"/><Corner className="cover-corner corner-br"/></div><div className="cover-design"><span className="cover-for">FOR AIRA</span><BookHeart className="cover-heart"/><h2>Our Little<br/><em>Forever</em></h2><Flourish className="cover-flourish"/><span className="cover-date">6 July 2026 <i/> 10:29 PM</span><span className="cover-by">{t('DARI SHIVAM, DENGAN CINTA','FROM SHIVAM, WITH LOVE')[lang]}</span></div></button></div></div>
        </div>
        <div className="cover-call-to-action"><button className="primary-button" onClick={openBook} disabled={opening}><BookOpen size={16} strokeWidth={1.4}/>{opening ? t('Sebentar, Bebyycuu...','One moment, Bebyycuu...')[lang] : pageNumber > 1 ? t('Lanjutkan cerita kita','Continue our story')[lang] : t('Buka buku kita','Open our little book')[lang]}<ArrowRight size={17} strokeWidth={1.4}/></button><p className="handwritten">{pageNumber > 1 ? t(`aku simpan halaman ${pageNumber} buatmu.`, `I kept page ${pageNumber} for you.`)[lang] : t('pelan-pelan, ini semua tentang kamu.', 'take your time, it is all about you.')[lang]}</p></div>
      </div> : <div className="reader-view">
        <div className="reader-heading"><span className="eyebrow">{t('SEBUAH BUKU UNTUK AIRA','A LITTLE BOOK FOR AIRA')[lang]}</span><h1>{chapters[page.chapter].title[lang]}</h1><p>{chapters[page.chapter].subtitle[lang]}</p></div>
        <div className="reader-toolbar"><button className="text-button" onClick={() => setModal('contents')}><List size={14}/>{t('Daftar bab','Contents')[lang]}</button><span className="chapter-indicator">{t('BAB','CHAPTER')[lang]} {String(page.chapter + 1).padStart(2,'0')}</span><div><button className={`icon-button bookmark-button ${bookmarks.includes(pageNumber) ? 'saved' : ''}`} aria-pressed={bookmarks.includes(pageNumber)} title={t('Tandai halaman ini','Bookmark this page')[lang]} aria-label={t('Tandai halaman ini','Bookmark this page')[lang]} onClick={toggleBookmark}><Bookmark size={16} fill={bookmarks.includes(pageNumber) ? 'currentColor' : 'none'}/></button><button className="icon-button" title={t('Tutup buku','Close book')[lang]} aria-label={t('Tutup buku','Close book')[lang]} onClick={closeBook}><X size={18}/></button></div></div>
        <div className="reader-stage"><button className="outer-page-button previous" onClick={() => go(pageNumber - 1)} disabled={pageNumber === 1} aria-label={t('Halaman sebelumnya','Previous page')[lang]}><ChevronLeft size={24} strokeWidth={1}/></button>
          <div className="book-spread" onPointerDown={e => { const target = e.target as HTMLElement; gesture.current = { x: e.clientX, y: e.clientY, active: !target.closest('button,a,input,textarea,select,summary,[data-interactive="true"]') }; }} onPointerUp={e => { const dx = e.clientX - gesture.current.x, dy = e.clientY - gesture.current.y; if (gesture.current.active && Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.4) go(pageNumber + (dx < 0 ? 1 : -1)); gesture.current.active = false; }} onPointerCancel={() => { gesture.current.active = false; }}>
            <div className="spread-back-cover"/><div className="spread-page-edges"/><div className="open-book-ribbon"/>
            <div className="left-paper">{pageNumber > 1 ? <PageContent key={pages[pageNumber - 2].id} page={pages[pageNumber - 2]} lang={lang} photos={photos.photos} preview onPhoto={showPhoto} onNavigate={jumpTo} celebrate={celebrate}/> : <div className="frontispiece"><span className="frontispiece-top">OUR LITTLE FOREVER</span><BookHeart className="frontispiece-heart"/><h2>Shivam<br/><em>&</em> Aira</h2><Flourish className="frontispiece-flourish"/><p>{t('Dari satu perkenalan,\nsampai halaman ini.', 'From one introduction\nto this very page.')[lang]}</p><span className="handwritten">{t('untuk kita, yang masih belajar.', 'for us, still learning.')[lang]}</span><span className="frontispiece-date">06.07.2026</span></div>}</div>
            <div className="right-paper"><PageContent key={page.id} page={page} lang={lang} photos={photos.photos} onPhoto={showPhoto} onNavigate={jumpTo} celebrate={celebrate}/></div>
            <div className="book-binding"/>
            {flip && <div className={`turning-sheet ${flip.direction < 0 ? 'turn-backward' : ''}`}><div className="sheet-front"><PageContent page={pages[flip.from - 1]} lang={lang} photos={photos.photos} preview onPhoto={() => {}} onNavigate={() => {}} celebrate={() => {}}/></div><div className="sheet-back"><Flourish/></div></div>}
          </div>
          <button className="outer-page-button next" onClick={() => go(pageNumber + 1)} disabled={pageNumber === 200} aria-label={t('Halaman berikutnya','Next page')[lang]}><ChevronRight size={24} strokeWidth={1}/></button>
        </div>
        <div className="reader-navigation"><div className="reading-position"><button className="text-button mobile-page-nav" disabled={pageNumber === 1} onClick={() => go(pageNumber - 1)} aria-label={t('Sebelumnya','Previous')[lang]}><ArrowLeft size={15}/></button><span aria-live="polite" aria-atomic="true">{t('Halaman','Page')[lang]} <strong>{pageNumber}</strong><span className="counter-separator">/</span>{pages.length}</span><button className="text-button mobile-page-nav" disabled={pageNumber === 200} onClick={() => go(pageNumber + 1)} aria-label={t('Berikutnya','Next')[lang]}><ArrowRight size={15}/></button></div><label className="reading-progress" style={{ '--progress': `${pageNumber / pages.length * 100}%` } as React.CSSProperties}><span className="sr-only">{t('Pindah halaman','Jump to page')[lang]}</span><input aria-label={t('Pindah halaman','Jump to page')[lang]} type="range" min="1" max={pages.length} value={pageNumber} onChange={e => go(Number(e.target.value), false)}/></label><p className="reader-hint"><span className="keyboard-hint">{t('Geser, klik panah, atau gunakan','Swipe, click the arrows, or use')[lang]} <kbd>&larr;</kbd> <kbd>&rarr;</kbd></span><span className="mobile-hint">{t('Geser halaman untuk melanjutkan','Swipe the page to keep reading')[lang]}</span><span className="saved-status"><Check size={11}/>{t('Tersimpan otomatis','Saved automatically')[lang]}</span></p></div>
      </div>}
    </main>
    <footer className="site-footer"><span className="footer-note">{t('Bukan buku sempurna. Cuma kita.', 'Not a perfect book. Just us.')[lang]}</span><p>{t('Dibuat untuk Aira','Made for Aira')[lang]}<Heart size={10} strokeWidth={1.2}/>{t('oleh Shivam','by Shivam')[lang]}</p><div><button onClick={() => setModal('about')}><Info size={12}/>{t('Tentang buku','About the book')[lang]}</button><a href="./aira-anniversary-book.zip" download title={t('Unduh proyek ZIP lengkap','Download the complete project ZIP')[lang]} aria-label={t('Unduh proyek ZIP lengkap','Download the complete project ZIP')[lang]}><ArrowDownToLine size={14}/></a></div></footer>

    {modal && <div className="modal-backdrop" onClick={closeOverlay}><section role="dialog" aria-modal="true" aria-labelledby="modal-title" className={`modal modal-${modal}`} onClick={e => e.stopPropagation()}><div className="modal-header"><div><span className="eyebrow">OUR LITTLE FOREVER</span><h2 id="modal-title">{title}</h2></div><button className="icon-button close-modal" onClick={closeOverlay} aria-label={t('Tutup','Close')[lang]}><X size={22} strokeWidth={1.2}/></button></div><div className="modal-content">
      {modal === 'contents' && <><div className="contents-tools"><label className="chapter-search"><Search size={15}/><span className="sr-only">{t('Cari bab','Find a chapter')[lang]}</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('Cari satu bab...','Find a chapter...')[lang]}/></label><form className="jump-form" onSubmit={e => { e.preventDefault(); const number = Number(jump); if (number >= 1 && number <= 200) jumpTo(number); }}><label className="sr-only" htmlFor="jump-number">{t('Nomor halaman','Page number')[lang]}</label><input id="jump-number" type="number" min="1" max="200" placeholder={t('Hal.','Page')[lang]} value={jump} onChange={e => setJump(e.target.value)} required/><button className="icon-button" aria-label={t('Ke halaman ini','Go to this page')[lang]}><ArrowRight size={17}/></button></form></div>{bookmarks.length > 0 && <div className="bookmark-list"><Bookmark size={13}/><span>{t('Penandamu','Your bookmarks')[lang]}</span>{bookmarks.slice().sort((a,b) => a-b).map(number => <button key={number} onClick={() => jumpTo(number)}>{number}</button>)}</div>}<div className="chapter-list">{chapters.map((chapter, i) => ({ chapter, i })).filter(({ chapter }) => `${chapter.title[lang]} ${chapter.subtitle[lang]}`.toLowerCase().includes(search.toLowerCase())).map(({ chapter, i }) => <button key={i} onClick={() => jumpTo(chapter.start)} className={open && page.chapter === i ? 'current-chapter' : ''}><span className="chapter-number">{String(i + 1).padStart(2,'0')}</span><span><strong>{chapter.title[lang]}</strong><small>{chapter.subtitle[lang]}</small></span><span className="chapter-pages">{chapter.start}<span>&ndash;</span>{chapter.end}</span><ChevronRight size={16}/></button>)}</div>{search && !chapters.some(chapter => `${chapter.title[lang]} ${chapter.subtitle[lang]}`.toLowerCase().includes(search.toLowerCase())) && <p className="empty-search">{t('Belum ketemu. Coba kata yang lebih pendek, ya.','Nothing yet. Try a shorter word.')[lang]}</p>}</>}
      {modal === 'little' && <><p className="modal-intro">{t('Yang manis bukan cuma suratnya. Ada tempat untuk main, membuka amplop, dan meninggalkan suaramu sendiri.', 'The sweetness is not only in the letters. There is room to play, open envelopes, and leave your own voice.')[lang]}</p><div className="little-links">{[
        { icon: PenLine, title: t('Dua belas surat pribadi','Twelve personal letters'), sub: t('Baca pelan, nggak harus sekaligus.','Read slowly, not necessarily all at once.'), action: () => jumpTo(87) },
        { icon: Gamepad2, title: t('Main sebentar?','A little playtime?'), sub: t('Sembilan permainan, betulan bisa dimainkan.','Nine different, genuinely playable games.'), action: () => jumpTo(148) },
        { icon: Mail, title: t('Amplop untuk harimu','Envelopes for your day'), sub: t('Sepuluh pesan, buka saat dibutuhkan.','Ten notes, open when you need them.'), action: () => jumpTo(157) },
        { icon: Image, title: t('Foto-foto kecil kita','Our little photos'), sub: t(`${photos.photos.filter(photo => photo.src).length} dari 50 foto ditambahkan.`, `${photos.photos.filter(photo => photo.src).length} of 50 photos added.`), action: () => setModal('photos') },
        { icon: Heart, title: t('Hati yang tersembunyi','The hidden hearts'), sub: t(`${readSaved<string[]>('hidden-hearts', []).length} dari 10 ditemukan. Mulai cari dari halaman 5.`, `${readSaved<string[]>('hidden-hearts', []).length} of 10 found. Start looking on page 5.`), action: () => jumpTo(5) },
        { icon: MessageCircle, title: t('Sepatah darimu','A few words from you'), sub: t('Buku ini juga punya tempat untuk suaramu.','This book has room for your voice too.'), action: () => jumpTo(191) },
      ].map(({ icon: Icon, title, sub, action }, i) => <button key={i} onClick={action}><span className="little-link-icon"><Icon size={23} strokeWidth={1}/></span><span><strong>{title[lang]}</strong><small>{sub[lang]}</small></span><ArrowRight size={16}/></button>)}</div><p className="handwritten little-bottom">{t('ada yang kecil, tapi sengaja.', 'little things, left on purpose.')[lang]}</p></>}
      {modal === 'photos' && <PhotoManager photos={photos.photos} lang={lang} busy={photos.busy} importPhotos={photos.importPhotos} exportBook={photos.exportBook} view={showPhoto} storageWarning={photos.storageWarning}/>}
      {modal === 'about' && <div className="about-book"><BookHeart className="about-heart"/><p>{t('Buku empat bulan untuk Shivam dan Aira. Dimulai dari Litmatch, berlanjut ke WhatsApp pada malam yang sama. Hubungan dimulai pada 6 Juli 2026, pukul 10:29 malam.', 'A four-month keepsake for Shivam and Aira. Beginning on Litmatch, continuing on WhatsApp that same night. The relationship began on 6 July 2026, at 10:29 PM.')[lang]}</p><p>{t('200 halaman nyata, 12 surat lengkap, 50 alasan, 9 permainan, dan 10 amplop. Semua tulisan tersedia dalam bahasa Indonesia dan Inggris. Bahasa bisa diganti tanpa kehilangan halaman atau progres permainan.', '200 real pages, 12 complete letters, 50 reasons, 9 games, and 10 envelopes. All writing is available in Indonesian and English. Change language without losing your page or game progress.')[lang]}</p><h3>{t('Tentang foto & privasi','Photos & privacy')[lang]}</h3><p>{t('50 file foto dan nama aslinya tidak disertakan dalam permintaan. Karena itu, halaman foto memakai ruang kenangan yang jujur, bukan foto pengganti. Tambahkan JPEG lewat pengelola foto, lalu unduh ZIP pribadi untuk menyertakan file aslinya.', 'The 50 photographs and their original names were not supplied. Photo pages therefore use honest memory spaces, not substitute photographs. Add your JPEGs in the photo manager, then download a personalised ZIP to include the originals.')[lang]}</p><p>{t('Progres, jawaban, dan buku tamu disimpan di browser ini. Foto disimpan di IndexedDB. Tidak ada akun, pelacak, atau pengiriman ke server. Catatan buku tamu tidak otomatis terkirim ke Shivam.', 'Progress, answers, and guestbook notes are saved in this browser. Photos are stored in IndexedDB. No accounts, trackers, or uploads to a server. Guestbook notes are not automatically sent to Shivam.')[lang]}</p><div className="about-actions"><button className="small-button" onClick={() => setModal('photos')}><Image size={14}/>{t('Tambahkan foto kita','Add our photographs')[lang]}</button><a className="text-button" href="./aira-anniversary-book.zip" download><Download size={14}/>{t('Unduh proyek lengkap','Download the complete project')[lang]}</a></div><p className="handwritten">{t('dari Shivam, khusus untuk Aira.', 'from Shivam, just for Aira.')[lang]}</p></div>}
    </div><div className="modal-footer"><Heart size={10}/><span>SHIVAM & AIRA</span><Flourish/></div></section></div>}
    {lightbox !== null && <PhotoLightbox photos={photos.photos} index={lightbox} setIndex={setLightbox} lang={lang} close={closeOverlay} importOpen={() => { setLightbox(null); setModal('photos'); }} setFocal={photos.setFocal}/>}
    {toast && <div className="toast" role="status"><Check size={14}/>{toast}</div>}
    {confetti > 0 && <Confetti seed={confetti}/>}
  </div>;
}
