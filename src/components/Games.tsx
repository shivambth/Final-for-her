import { useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, Check, Heart, RotateCcw, Sparkles, Trophy, X } from 'lucide-react';
import { t, type Lang } from '../data/types';
import { shuffle, useSaved } from '../lib/storage';

type Props = { lang: Lang };
const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
function Restart({ lang, onClick }: Props & { onClick: () => void }) {
  return <button className="text-button restart" onClick={onClick}><RotateCcw size={13}/>{lang === 'id' ? 'Main lagi' : 'Play again'}</button>;
}
function Feedback({ good, lang, text }: Props & { good: boolean; text?: string }) {
  return <p className={`game-feedback ${good ? 'correct' : 'incorrect'}`} role="status">{good ? <Check size={15}/> : <Heart size={15}/>} {text || (good ? t('Iya, kamu benar!', 'Yes, you got it!')[lang] : t('Belum pas. Coba lagi, Bebyycuu.', 'Not quite. Try again, Bebyycuu.')[lang])}</p>;
}

const quizQuestions = [
  { q: t('Kita pertama kenal di mana?', 'Where did we first meet?'), options: ['Instagram', 'Litmatch', 'WhatsApp'], answer: 1 },
  { q: t('Malam itu kita lanjut ke mana?', 'Where did we move that night?'), options: ['WhatsApp', 'Telegram', 'Discord'], answer: 0 },
  { q: t('Jam berapa hubungan kita mulai?', 'What time did our relationship begin?'), options: ['10:19 PM', '10:29 PM', '11:29 PM'], answer: 1 },
  { q: t('Tanggal mulai jadi kita?', 'The date we became us?'), options: [t('6 Juni 2026','6 June 2026'), t('6 Juli 2026','6 July 2026'), t('7 Juli 2026','7 July 2026')], answer: 1 },
  { q: t('Siapa yang kadang menyebut 2028?', 'Who sometimes mentions 2028?'), options: ['Shivam', 'Aira', t('Kalendernya sendiri','The calendar itself')], answer: 1 },
];
function Quiz({ lang }: Props) {
  const [s, set] = useSaved('game-quiz', { answers: [] as number[], current: null as number | null });
  const index = s.answers.length;
  const score = s.answers.filter((a, i) => a === quizQuestions[i].answer).length;
  const q = quizQuestions[index];
  return <><div className="game-meta"><span>{t('Kuis ingatan kita', 'Our memory quiz')[lang]}</span><span>{Math.min(index + 1, 5)} / 5</span></div>
    {q ? <><h3 className="game-question">{q.q[lang]}</h3><div className="choices">{q.options.map((option, i) => <button key={i} className={`choice ${s.current === i ? 'selected' : ''}`} disabled={s.current !== null} onClick={() => set({ ...s, current: i })}><span>{String.fromCharCode(65 + i)}</span>{typeof option === 'string' ? option : option[lang]}{s.current === i && <Check size={16}/>}</button>)}</div>
      {s.current !== null && <><Feedback good={s.current === q.answer} lang={lang} text={s.current === q.answer ? undefined : t('Jawabannya: ', 'The answer is: ')[lang] + (typeof q.options[q.answer] === 'string' ? q.options[q.answer] : (q.options[q.answer] as { id: string; en: string })[lang])}/><button className="small-button" onClick={() => set({ answers: [...s.answers, s.current!], current: null })}>{t('Lanjut', 'Next')[lang]}<ArrowRight size={14}/></button></>}
    </> : <div className="game-result"><Trophy/><h3>{score} / 5</h3><p>{t('Yang lupa boleh baca ulang. Penulis sudah menyiapkan 200 halaman bantuan.', 'You can reread what you forgot. The writer prepared 200 pages of help.')[lang]}</p></div>}
    <Restart lang={lang} onClick={() => set({ answers: [], current: null })}/></>;
}

const memoryTokens = ['A', 'S', '6', '10:29', 'WA', 'LM'];
const newMemory = () => ({ deck: shuffle([...memoryTokens, ...memoryTokens]), matched: [] as number[], flipped: [] as number[], moves: 0 });
function Memory({ lang }: Props) {
  const [s, set] = useSaved('game-memory', newMemory);
  useEffect(() => {
    if (s.flipped.length !== 2) return;
    const [a, b] = s.flipped;
    const match = s.deck[a] === s.deck[b];
    const timer = setTimeout(() => set(v => ({ ...v, matched: match ? [...v.matched, a, b] : v.matched, flipped: [] })), match ? 350 : 900);
    return () => clearTimeout(timer);
  }, [s.flipped, s.deck, set]);
  const flip = (i: number) => {
    if (s.flipped.length >= 2 || s.matched.includes(i) || s.flipped.includes(i)) return;
    set({ ...s, flipped: [...s.flipped, i], moves: s.moves + (s.flipped.length === 1 ? 1 : 0) });
  };
  return <><p className="game-instruction">{t('Buka dua kartu. Temukan enam pasangan yang sama.', 'Turn over two cards. Find all six matching pairs.')[lang]}</p><div className="game-meta"><span>{s.matched.length / 2} / 6 {t('pasangan','pairs')[lang]}</span><span>{s.moves} {t('langkah','moves')[lang]}</span></div>
    <div className="memory-grid">{s.deck.map((value, i) => <button key={i} aria-label={`${t('Kartu','Card')[lang]} ${i + 1}${s.flipped.includes(i) || s.matched.includes(i) ? `: ${value}` : ''}`} aria-pressed={s.flipped.includes(i) || s.matched.includes(i)} className={`memory-card ${s.flipped.includes(i) || s.matched.includes(i) ? 'flipped' : ''} ${s.matched.includes(i) ? 'matched' : ''}`} onClick={() => flip(i)} disabled={s.matched.includes(i)}>{s.flipped.includes(i) || s.matched.includes(i) ? value : <Heart size={20}/>}</button>)}</div>
    {s.matched.length === 12 && <Feedback good lang={lang} text={t('Cocok semua. Seperti kamus aneh kita.', 'All matched. Like our strange little dictionary.')[lang]}/>}<Restart lang={lang} onClick={() => set(newMemory())}/></>;
}

const decodes = [
  { symbols: '\u{1F4F1} \u{27A1}\u{FE0F} \u{1F4AC}', hint: t('Aplikasi tujuan kita malam itu.', 'The app we moved to that night.'), answers: ['whatsapp', 'wa'], reveal: 'WhatsApp' },
  { symbols: '\u{1F4DE} \u{0031}\u{FE0F}\u{20E3}', hint: t('Salah satu momen pertama yang berkesan.', 'One of our memorable first moments.'), answers: ['panggilanpertama','teleponpertama','firstcall'], reveal: t('Panggilan pertama','First call') },
  { symbols: '\u{1F48B}', hint: t('Momen khusus di awal kedekatan kita.', 'A special moment in our early connection.'), answers: ['cium','ciuman','kiss','momen cium'], reveal: t('Cium','Kiss') },
  { symbols: '\u{1F4C5} \u{0034}\u{FE0F}\u{20E3} \u{1F319}', hint: t('Yang sedang kita rayakan. Jawab dengan jumlah bulan.', 'What we are celebrating. Answer with the number of months.'), answers: ['4','4bulan','empatbulan','fourmonths','4months'], reveal: t('Empat bulan','Four months') },
];
function Decode({ lang }: Props) {
  const [s, set] = useSaved('game-decode', { index: 0, input: '', feedback: '' });
  const item = decodes[s.index];
  const correct = s.feedback === 'correct';
  return <>{item ? <><div className="game-meta"><span>{t('Pecahkan kodenya','Crack the code')[lang]}</span><span>{s.index + 1} / 4</span></div><div className="emoji-code" aria-label={item.hint[lang]}>{item.symbols}</div><p className="game-instruction">{item.hint[lang]}</p><form className="game-form" onSubmit={e => { e.preventDefault(); set({ ...s, feedback: item.answers.map(normalise).includes(normalise(s.input)) ? 'correct' : 'wrong' }); }}><label className="sr-only" htmlFor="decode-answer">{t('Jawabanmu','Your answer')[lang]}</label><input id="decode-answer" value={s.input} onChange={e => set({ ...s, input: e.target.value, feedback: '' })} placeholder={t('Tulis tebakanmu...','Write your guess...')[lang]} disabled={correct} autoComplete="off"/><button className="small-button" disabled={!s.input.trim() || correct}>{t('Cek','Check')[lang]}</button></form>{s.feedback && <Feedback good={correct} lang={lang}/>}<button className="text-button" onClick={() => set({ ...s, input: typeof item.reveal === 'string' ? item.reveal : item.reveal[lang], feedback: '' })}>{t('Butuh bantuan? Isi petunjuknya.','Need help? Fill in the clue.')[lang]}</button>{correct && <button className="small-button" onClick={() => set({ index: s.index + 1, input: '', feedback: '' })}>{t('Kode berikutnya','Next code')[lang]}<ArrowRight size={14}/></button>}</> : <div className="game-result"><Sparkles/><h3>{t('Semua kode terbaca.','Every code decoded.')[lang]}</h3><p>{t('Kamus kita ternyata juga bisa pakai gambar.','Apparently our dictionary works with pictures too.')[lang]}</p></div>}<Restart lang={lang} onClick={() => set({ index: 0, input: '', feedback: '' })}/></>;
}

const either = [
  { q: t('Panggilan untuk hari ini?', 'A nickname for today?'), a: t('Bebyycuu','Bebyycuu'), b: t('Cantikkcuu','Cantikkcuu') },
  { q: t('Lagi bad mood, lebih ingin...', 'In a bad mood, would you rather...'), a: t('Didengar dulu','Be listened to'), b: t('Diberi ruang dulu','Have some space') },
  { q: t('Sekarang mau bagian yang...', 'Right now, something...'), a: t('Manis','Sweet'), b: t('Konyol','Silly') },
  { q: t('Buka buku ini dengan...', 'Read this book...'), a: t('Duduk rapi','Sitting properly'), b: t('Rebahan tentu','Lying down, obviously') },
  { q: t('Simpan cerita lewat...', 'Keep a story through...'), a: t('Foto kecil','A little photo'), b: t('Surat panjang','A long letter') },
];
function Either({ lang }: Props) {
  const [s, set] = useSaved('game-either', { choices: [] as number[] });
  const i = s.choices.length, item = either[i];
  return <><p className="game-instruction">{t('Tidak ada jawaban salah. Ini pilihan kamu, bukan tebakan tentang kebiasaanmu.', 'No wrong answers. These are your choices, not assumptions about your habits.')[lang]}</p>{item ? <><div className="game-meta"><span>{t('Pilihanmu','Your pick')[lang]}</span><span>{i + 1} / 5</span></div><h3 className="game-question">{item.q[lang]}</h3><div className="either-options"><button onClick={() => set({ choices: [...s.choices, 0] })}>{item.a[lang]}</button><span>{t('atau','or')[lang]}</span><button onClick={() => set({ choices: [...s.choices, 1] })}>{item.b[lang]}</button></div></> : <><h3 className="game-question">{t('Edisi Aira hari ini.','Today\'s Aira edition.')[lang]}</h3><ul className="choice-summary">{s.choices.map((a, i) => <li key={i}><Check size={14}/>{(a === 0 ? either[i].a : either[i].b)[lang]}</li>)}</ul><Feedback good lang={lang} text={t('Tersimpan. Tidak dinilai, cuma diperhatikan.','Saved. Not judged, just noticed.')[lang]}/></>}<Restart lang={lang} onClick={() => set({ choices: [] })}/></>;
}

const scrambleWords = ['AIRA','LITMATCH','BEBYYCUU','DARLINGCUUU'];
const newScramble = (index = 0) => ({ index, pool: shuffle((scrambleWords[index] || '').split('')), selected: [] as number[], feedback: '' });
function Scramble({ lang }: Props) {
  const [s, set] = useSaved('game-scramble', newScramble);
  const word = scrambleWords[s.index];
  const guess = s.selected.map(i => s.pool[i]).join('');
  const correct = s.feedback === 'correct';
  return <>{word ? <><div className="game-meta"><span>{t('Susun hurufnya','Arrange the letters')[lang]}</span><span>{s.index + 1} / 4</span></div><p className="game-instruction">{t('Ketuk huruf sesuai urutan. Ketuk jawaban untuk membatalkan huruf terakhir.', 'Tap the letters in order. Tap your answer to remove the last letter.')[lang]}</p><button className="scramble-answer" aria-label={t('Batalkan huruf terakhir','Undo last letter')[lang]} onClick={() => set({ ...s, selected: s.selected.slice(0, -1), feedback: '' })} disabled={correct || s.selected.length === 0}>{guess || '...'}<span>{s.selected.length}/{word.length}</span></button><div className="letter-pool">{s.pool.map((letter, i) => <button key={i} disabled={s.selected.includes(i) || correct} onClick={() => set({ ...s, selected: [...s.selected, i], feedback: '' })}>{letter}</button>)}</div><button className="small-button" disabled={s.selected.length !== word.length || correct} onClick={() => set({ ...s, feedback: guess === word ? 'correct' : 'wrong' })}>{t('Cek susunan','Check order')[lang]}</button>{s.feedback && <Feedback good={correct} lang={lang}/>}<button className="text-button" onClick={() => set({ ...s, selected: [], feedback: '' })} disabled={correct}>{t('Kosongkan jawaban','Clear answer')[lang]}</button>{correct && <button className="small-button" onClick={() => set(newScramble(s.index + 1))}>{t('Kata berikutnya','Next word')[lang]}<ArrowRight size={14}/></button>}</> : <div className="game-result"><Trophy/><h3>{t('Rapi semua.','All in order.')[lang]}</h3><p>{t('Huruf tambahannya juga tidak ada yang ketinggalan.','Not even the extra letters got left behind.')[lang]}</p></div>}<Restart lang={lang} onClick={() => set(newScramble())}/></>;
}

const newHearts = () => ({ found: [] as number[], positions: shuffle(Array.from({ length: 25 }, (_, i) => i)).slice(0, 5), misses: 0 });
function FindHearts({ lang }: Props) {
  const [s, set] = useSaved('game-hearts', newHearts);
  const [last, setLast] = useState<number | null>(null);
  const tap = (i: number) => {
    if (s.found.includes(i)) return;
    if (s.positions.includes(i)) set({ ...s, found: [...s.found, i] });
    else { set({ ...s, misses: s.misses + 1 }); setLast(i); setTimeout(() => setLast(null), 500); }
  };
  return <><p className="game-instruction">{t('Ada lima hati di taman kecil ini. Perhatikan garisnya, lalu ketuk. Tidak ada batas waktu.', 'Five hearts are hiding in this little garden. Look at the outlines, then tap. There is no time limit.')[lang]}</p><div className="game-meta"><span>{s.found.length} / 5 {t('hati ditemukan','hearts found')[lang]}</span><span>{s.misses} {t('meleset','misses')[lang]}</span></div><div className="heart-garden">{Array.from({ length: 25 }, (_, i) => <button key={i} aria-label={`${t('Tempat','Spot')[lang]} ${i + 1}`} className={`${s.found.includes(i) ? 'found' : ''} ${last === i ? 'miss' : ''}`} disabled={s.found.includes(i) || s.found.length === 5} onClick={() => tap(i)}>{s.positions.includes(i) ? <Heart size={19} strokeWidth={s.found.includes(i) ? 1.8 : .9}/> : <span className={`garden-leaf leaf-${i % 3}`}/>}</button>)}</div>{s.found.length === 5 && <Feedback good lang={lang} text={t('Ketemu semua. Kamu jeli juga, Bebyycuu.', 'Found them all. You have a good eye, Bebyycuu.')[lang]}/>}<Restart lang={lang} onClick={() => { set(newHearts()); setLast(null); }}/></>;
}

const guesses = [
  { q: t('Kalau kamu memanggilku Gay, balasanku apa?', 'You say Gay. What is my reply?'), answer: ['lesbian'] },
  { q: t('Aku berharap ketemu kapan? Dua kata: ... depan.', 'When do I hope we can meet? Two words.'), answer: ['tahundepan','nextyear'] },
  { q: t('Siapa yang namanya kutaruh di sampul?', 'Whose name did I put on the cover?'), answer: ['aira'] },
];
function Guess({ lang }: Props) {
  const [s, set] = useSaved('game-guess', { index: 0, input: '', feedback: '', hints: 0 });
  const item = guesses[s.index], correct = s.feedback === 'correct';
  return <>{item ? <><div className="game-meta"><span>{t('Tebak jawaban Shivam','Guess Shivam\'s answer')[lang]}</span><span>{s.index + 1} / 3</span></div><h3 className="game-question">{item.q[lang]}</h3><form className="game-form" onSubmit={e => { e.preventDefault(); set({ ...s, feedback: item.answer.includes(normalise(s.input)) ? 'correct' : 'wrong' }); }}><label className="sr-only" htmlFor="guess-answer">{t('Tebakanmu','Your guess')[lang]}</label><input id="guess-answer" value={s.input} disabled={correct} autoComplete="off" placeholder={t('Aku menebak...','My guess...')[lang]} onChange={e => set({ ...s, input: e.target.value, feedback: '' })}/><button className="small-button" disabled={!s.input.trim() || correct}>{t('Tebak','Guess')[lang]}</button></form>{s.feedback && <Feedback good={correct} lang={lang}/>}<button className="text-button" onClick={() => set({ ...s, hints: s.hints + 1, input: s.index === 1 ? t('tahun depan','next year')[lang] : item.answer[0], feedback: '' })}>{t('Buka jawabannya','Show the answer')[lang]}</button>{correct && <button className="small-button" onClick={() => set({ ...s, index: s.index + 1, input: '', feedback: '' })}>{t('Pertanyaan berikutnya','Next question')[lang]}<ArrowRight size={14}/></button>}</> : <div className="game-result"><Heart/><h3>{t('Kamu kenal penulisnya.','You know the writer.')[lang]}</h3><p>{t('Tanggalnya tahu, harapannya tahu, balasanku yang tidak elegan juga tahu.','You know the date, the hope, and my not-so-elegant reply.')[lang]}</p><small>{s.hints} {t('bantuan dipakai','hints used')[lang]}</small></div>}<Restart lang={lang} onClick={() => set({ index: 0, input: '', feedback: '', hints: 0 })}/></>;
}

const puzzleEvents = [t('Kenal di Litmatch','Meet on Litmatch'), t('Pindah ke WhatsApp malam itu','Move to WhatsApp that night'), t('6 Juli, 10:29 PM: hubungan dimulai','6 July, 10:29 PM: relationship begins'), t('Sekitar sepuluh hari awal yang sulit','Roughly ten difficult early days'), t('Pelan-pelan memahami dan lebih dekat','Gradually understand and grow closer')];
const newPuzzle = () => ({ order: [2, 4, 0, 3, 1], checked: false, moves: 0 });
function Puzzle({ lang }: Props) {
  const [s, set] = useSaved('game-puzzle', newPuzzle);
  const move = (i: number, direction: number) => {
    const order = [...s.order];
    [order[i], order[i + direction]] = [order[i + direction], order[i]];
    set({ order, checked: false, moves: s.moves + 1 });
  };
  const good = s.order.every((v, i) => v === i);
  return <><p className="game-instruction">{t('Pakai panah kecil untuk mengembalikan lima potongan cerita ini ke urutannya. Mulai dari tempat kita berkenalan.', 'Use the little arrows to put these five pieces of our story back in order. Start with where we met.')[lang]}</p><ol className="timeline-puzzle">{s.order.map((event, i) => <li key={event}><span>{i + 1}</span><p>{puzzleEvents[event][lang]}</p><div><button aria-label={t('Naik','Move up')[lang]} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={14}/></button><button aria-label={t('Turun','Move down')[lang]} disabled={i === 4} onClick={() => move(i, 1)}><ArrowDown size={14}/></button></div></li>)}</ol><button className="small-button" onClick={() => set({ ...s, checked: true })}>{t('Cek urutan','Check timeline')[lang]}</button>{s.checked && <Feedback good={good} lang={lang}/>}<div className="game-meta"><span>{s.moves} {t('perpindahan','moves')[lang]}</span></div><Restart lang={lang} onClick={() => set(newPuzzle())}/></>;
}

function Challenge({ lang }: Props) {
  const [s, set] = useSaved('game-challenge', { step: 0, taps: 0, time: '', letters: [] as string[], feedback: '' });
  const [pulse, setPulse] = useState(false);
  const tokens = ['RA', 'AI', 'CUU', 'BEBYY'];
  return <><div className="game-meta"><span>{t('Tiga kunci kecil','Three little keys')[lang]}</span><span>{Math.min(s.step + 1, 3)} / 3</span></div>
    {s.step === 0 && <><p className="game-instruction">{t('Kunci pertama: kirim empat hati, satu untuk setiap bulan.', 'First key: send four hearts, one for each month.')[lang]}</p><button className={`challenge-heart ${pulse ? 'pulse' : ''}`} aria-label={t('Kirim hati','Send a heart')[lang]} onClick={() => { setPulse(true); setTimeout(() => setPulse(false), 200); set({ ...s, taps: s.taps + 1, step: s.taps + 1 >= 4 ? 1 : 0 }); }}><Heart size={58}/></button><p className="centered">{s.taps} / 4</p></>}
    {s.step === 1 && <><p className="game-instruction">{t('Kunci kedua: masukkan waktu kita mulai. Format 10:29, tanpa PM.', 'Second key: enter our starting time. Use 10:29, without PM.')[lang]}</p><form className="game-form" onSubmit={e => { e.preventDefault(); set({ ...s, step: s.time.trim() === '10:29' ? 2 : 1, feedback: s.time.trim() === '10:29' ? '' : 'wrong' }); }}><label className="sr-only" htmlFor="challenge-time">{t('Waktu kita','Our time')[lang]}</label><input id="challenge-time" inputMode="numeric" value={s.time} placeholder="HH:MM" onChange={e => set({ ...s, time: e.target.value, feedback: '' })}/><button className="small-button">{t('Buka kunci','Unlock')[lang]}</button></form>{s.feedback && <Feedback good={false} lang={lang}/>}</>}
    {s.step === 2 && <><p className="game-instruction">{t('Kunci terakhir: susun nama pembaca buku ini dari dua potongan yang tepat.', 'Last key: build the reader\'s name from the two correct pieces.')[lang]}</p><div className="challenge-name">{s.letters.join('') || '...'}</div><div className="letter-pool">{tokens.map(token => <button key={token} disabled={s.letters.includes(token)} onClick={() => set({ ...s, letters: [...s.letters, token], feedback: '' })}>{token}</button>)}</div><div className="game-actions"><button className="small-button" onClick={() => set({ ...s, step: s.letters.join('') === 'AIRA' ? 3 : 2, feedback: s.letters.join('') === 'AIRA' ? '' : 'wrong' })}>{t('Selesai','Finish')[lang]}</button><button className="text-button" onClick={() => set({ ...s, letters: [], feedback: '' })}><X size={13}/>{t('Hapus','Clear')[lang]}</button></div>{s.feedback && <Feedback good={false} lang={lang}/>}</>}
    {s.step === 3 && <div className="game-result"><Trophy/><h3>{t('Tiga kunci terbuka.','All three keys opened.')[lang]}</h3><p>{t('Hadiahmu: izin resmi mengingatkan Shivam bahwa kamu menyelesaikan tantangannya. Kejutan penutup tetap ada di halaman 200.', 'Your reward: official permission to remind Shivam you finished his challenge. The closing surprise is still waiting on page 200.')[lang]}</p></div>}
    <Restart lang={lang} onClick={() => set({ step: 0, taps: 0, time: '', letters: [], feedback: '' })}/></>;
}

const games = [Quiz, Memory, Decode, Either, Scramble, FindHearts, Guess, Puzzle, Challenge];
export function Game({ index, lang }: Props & { index: number }) {
  const Component = games[index];
  return <div className="game-container" data-interactive="true" onPointerDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}><Component key={index} lang={lang}/></div>;
}