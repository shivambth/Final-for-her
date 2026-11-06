import { t, type PhotoRecord } from './types';

const captions = [
  ['Satu tempat kecil buat kamu.', 'A little place just for you.'], ['Yang ingin kulihat sekali lagi.', 'Something I want to see again.'],
  ['Dua ruang untuk cerita kita.', 'Two spaces for our story.'], ['Di sebelahnya, masih kita.', 'Beside it, still us.'],
  ['Versimu juga punya tempat.', 'Your version belongs here too.'], ['Di dekat angka 10:29.', 'Beside the time 10:29.'],
  ['Catatan kecil di pinggir.', 'A little note in the margin.'], ['Tidak harus dijelaskan panjang.', 'No long explanation needed.'],
  ['Sebelum membalik halaman.', 'Before turning the page.'], ['Bagian yang tidak kupoles.', 'The part I did not polish.'],
  ['Satu.', 'One.'], ['Dua.', 'Two.'], ['Dan ruang untuk yang ketiga.', 'And room for a third.'],
  ['Pelan-pelan menjadi dekat.', 'Gradually growing closer.'], ['Sebuah sudut untukmu.', 'A corner for you.'],
  ['Tidak perlu judul besar.', 'No grand heading needed.'], ['Cukup dilihat sebentar.', 'Just take a moment to look.'],
  ['Masih ingin mengenalmu.', 'Still wanting to know you.'], ['Di sela cerita panggilan pertama.', 'Between the pages about our first call.'],
  ['Ada yang boleh tetap pribadi.', 'Some things can stay private.'], ['Kenangan punya ruang sendiri.', 'Memories have their own space.'],
  ['Di sampingnya, satu lagi.', 'And another beside it.'], ['Panggil saja Duniyakuu.', 'Just call her Duniyakuu.'],
  ['Kamus kita, dalam gambar.', 'Our dictionary, in pictures.'], ['Tidak perlu masuk akal untuk semua orang.', 'It need not make sense to everyone.'],
  ['Untuk Aira yang nyata.', 'For the real Aira.'], ['Bahkan saat mood-nya biasa saja.', 'Even on an ordinary-mood day.'],
  ['Sisi yang manis.', 'The sweet side.'], ['Sisi yang agak konyol.', 'The slightly silly side.'], ['Semuanya tetap kamu.', 'All of it is still you.'],
  ['Detail kecil, sengaja kusimpan.', 'A little detail, deliberately kept.'], ['Ruang untuk berhenti sebentar.', 'A space to pause.'],
  ['Lihat pelan-pelan, ya.', 'Take your time looking.'], ['Boleh dilanjutkan besok.', 'We can continue tomorrow.'],
  ['Sebelum surat-suratnya.', 'Before the letters.'], ['Satu halaman yang tenang.', 'One quiet page.'],
  ['Di dekat sebuah harapan.', 'Beside a hope.'], ['Yang sekarang juga berarti.', 'The present matters too.'],
  ['Bukan sekadar menunggu.', 'More than just waiting.'], ['Ruang untuk yang belum terjadi.', 'Room for what has not happened.'],
  ['Awal.', 'The beginning.'], ['Proses.', 'The process.'], ['Dan kita yang sekarang.', 'And who we are now.'],
  ['Halaman berikutnya masih ada.', 'There is still another page.'], ['Tidak perlu buru-buru.', 'No need to hurry.'],
  ['Hadiah boleh cuma menemani.', 'A gift can simply keep you company.'], ['Tidak meminta reaksi apa-apa.', 'Asking for no particular reaction.'],
  ['Kamu boleh ikut menulis.', 'You can write here too.'], ['Sebelum penutupnya.', 'Before the closing.'], ['Foto terakhir, bukan cerita terakhir.', 'The last photo, not the last chapter.'],
];

// No personal files or filenames were supplied. Never invent references or use strangers' pictures.
export const photoManifest: PhotoRecord[] = captions.map(([id, en], i) => ({
  id: `photo-${String(i + 1).padStart(2, '0')}`,
  src: null,
  filename: null,
  caption: t(id, en),
  alt: t(`Foto pribadi ${i + 1} dari Shivam dan Aira`, `Personal photograph ${i + 1} from Shivam and Aira`),
  category: i < 36 ? 'memories' : i < 44 ? 'hopes' : 'little-things',
  focalX: 50,
  focalY: 50,
}));
