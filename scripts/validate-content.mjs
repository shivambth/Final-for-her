import { build } from 'esbuild';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

await build({ entryPoints: ['src/data/book.ts','src/data/letters.ts','src/data/reasons.ts','src/data/envelopes.ts','src/data/photos.ts'], bundle: true, platform: 'node', format: 'cjs', outdir: '/tmp/aira-content', logLevel: 'silent' });
const require = createRequire(import.meta.url);
const { pages, chapters } = require('/tmp/aira-content/book.js');
const { letters } = require('/tmp/aira-content/letters.js');
const { reasons, reasonsAfterword } = require('/tmp/aira-content/reasons.js');
const { envelopes } = require('/tmp/aira-content/envelopes.js');
const { photoManifest } = require('/tmp/aira-content/photos.js');
const checks = [];
const check = (name, fn) => { fn(); checks.push({ name, passed: true }); };
check('Exactly 200 populated pages with distinct IDs', () => {
  assert.equal(pages.length, 200); assert.equal(new Set(pages.map(p => p.id)).size, 200);
  pages.forEach((page, i) => { assert.equal(page.number, i + 1); assert.ok(page.title.id && page.title.en && page.body.id && page.body.en); assert.ok(page.chapter >= 0); });
});
check('Chapter ranges cover each page exactly once', () => pages.forEach(page => assert.equal(chapters.filter(c => page.number >= c.start && page.number <= c.end).length, 1)));
check('50 unique reasons in both languages', () => { assert.equal(reasons.length, 50); for (const lang of ['id','en']) assert.equal(new Set(reasons.map(r => r[lang])).size, 50); });
check('Every reason rendered exactly once', () => assert.deepEqual(pages.flatMap(p => p.reasons || []), Array.from({ length: 50 }, (_, i) => i)));
check('Exact required afterword in English', () => assert.equal(reasonsAfterword.en, 'These 50 reasons are only the beginning. There are so many more reasons that I could make unlimited books just to explain why you are special to me.'));
check('50 distinct photo slots, each intentionally placed once', () => {
  assert.equal(photoManifest.length, 50); const placed = pages.flatMap(p => p.photos || []);
  assert.equal(placed.length, 50); assert.equal(new Set(placed).size, 50); assert.deepEqual([...placed].sort((a,b)=>a-b), Array.from({ length: 50 }, (_,i)=>i));
});
check('No invented original photo filenames or broken placeholder paths', () => photoManifest.forEach(p => { assert.equal(p.src, null); assert.equal(p.filename, null); }));
check('All nine distinct games occupy real pages', () => assert.deepEqual(pages.filter(p=>p.kind==='game').map(p=>p.game), [0,1,2,3,4,5,6,7,8]));
check('Ten distinct bilingual envelopes occupy real pages', () => { assert.equal(envelopes.length, 10); assert.equal(new Set(envelopes.map(e=>e.body.id)).size, 10); assert.equal(pages.filter(p=>p.kind==='envelope').length, 10); envelopes.forEach(e=>assert.ok(e.body.en)); });
const letterCounts = letters.map((letter, i) => ({ number:i+1, title:letter.title.en, id:letter.parts.map(p=>p.id).join(' ').trim().split(/\s+/).length, en:letter.parts.map(p=>p.en).join(' ').trim().split(/\s+/).length }));
check('12 complete bilingual letters, three individually rendered parts each', () => {
  assert.equal(letters.length,12); assert.equal(pages.filter(p=>p.kind==='letter').length,36);
  letters.forEach((letter,i)=> { assert.equal(letter.parts.length,3); for(const lang of ['id','en']) letter.parts.forEach(part=>assert.ok(part[lang].length>500)); assert.equal(pages.filter(p=>p.letter===i).length,3); });
});
check('Every Indonesian letter is 450-550 words', () => letterCounts.forEach(letter=>assert.ok(letter.id>=450 && letter.id<=550, `Letter ${letter.number}: ${letter.id} words`)));
check('No duplicated letter paragraphs in either language', () => { for(const lang of ['id','en']) { const paragraphs=letters.flatMap(l=>l.parts.flatMap(p=>p[lang].split('\n\n'))); assert.equal(new Set(paragraphs).size,paragraphs.length); } });
check('Required final surprise on page 200 in both languages', () => { assert.equal(pages[199].body.id,'LESBICUUUU ❤️'); assert.equal(pages[199].body.en,'LESBICUUUU ❤️'); });
const report = { checks, letterCounts, totals: { pages:pages.length, photos:photoManifest.length, suppliedPhotoFiles:0, reasons:reasons.length, letters:letters.length, games:9, envelopes:envelopes.length } };
writeFileSync('tests/content-report.json',JSON.stringify(report,null,2));
console.table(letterCounts);
console.log(`${checks.length} content checks passed.`);