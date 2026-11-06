import { chromium, expect } from '@playwright/test';
import { writeFile, readFile } from 'node:fs/promises';
import { unzipSync, strFromU8 } from 'fflate';
import assert from 'node:assert/strict';

const base = process.env.AIRA_TEST_URL || 'http://localhost:5173';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width:1440, height:1000 }, acceptDownloads:true });
const page = await context.newPage();
const errors = [];
page.on('pageerror',error=>errors.push(error.message));
const results = [];
async function check(name, fn) {
  try { await fn(); results.push({ name, passed:true }); console.log('PASS',name); }
  catch(error) { results.push({ name, passed:false, error:String(error.message).slice(0,1800) }); console.error('FAIL',name,String(error.message).slice(0,350)); }
}
const current = () => page.locator('.right-paper .current-page');
async function number(n) {
  await page.locator('.reading-progress input').evaluate((element,value)=>{
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(element,String(value));
    element.dispatchEvent(new Event('input',{bubbles:true}));
    element.dispatchEvent(new Event('change',{bubbles:true}));
  },n);
  await expect(current()).toHaveAttribute('data-page',String(n));
}
async function language(lang) { await page.locator(`.language-toggle button`).nth(lang==='id'?0:1).click(); await expect(page.locator('html')).toHaveAttribute('lang',lang); }
async function restart() { await current().locator('.restart').click(); }
async function swipe(target, direction, p = page) {
  const box = await target.boundingBox();
  const start = direction < 0 ? box.x+box.width-35 : box.x+35;
  const end = direction < 0 ? box.x+35 : box.x+box.width-35;
  const y = box.y+70;
  const cdp = await p.context().newCDPSession(p);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:start,y}]});
  for(let i=1;i<=6;i++) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start+(end-start)*i/6,y}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await cdp.detach();
}

await page.goto(base);
await page.waitForTimeout(1400);
await check('Cover renders with exact dedication and starts in Indonesian',async()=>{
  await expect(page.locator('html')).toHaveAttribute('lang','id');
  await expect(page.locator('.cover-for')).toHaveText('FOR AIRA');
  await expect(page.locator('.cover-date')).toContainText('6 July 2026');
  await expect(page.locator('.cover-date')).toContainText('10:29 PM');
  await page.screenshot({path:'tests/cover-desktop.png',fullPage:true});
});
await check('Hardcover opens to an actual first page',async()=>{
  await page.locator('.hardcover').click();
  await expect(current()).toHaveAttribute('data-page','1');
  await expect(current().locator('h2')).toHaveText('Untuk kamu, Aira.');
  await page.waitForTimeout(700);
});
await check('Next, previous, keyboard arrows and desktop mouse drag work',async()=>{
  const first = await current().innerText();
  await page.locator('.outer-page-button.next').click();
  await expect(current()).toHaveAttribute('data-page','2');
  assert.notEqual(await current().innerText(),first); await page.waitForTimeout(650);
  await page.locator('.outer-page-button.previous').click(); await expect(current()).toHaveAttribute('data-page','1'); await page.waitForTimeout(650);
  await page.evaluate(()=>document.activeElement?.blur()); await page.keyboard.press('ArrowRight'); await expect(current()).toHaveAttribute('data-page','2'); await page.waitForTimeout(650);
  await page.keyboard.press('ArrowLeft'); await expect(current()).toHaveAttribute('data-page','1'); await page.waitForTimeout(650);
  const b=await page.locator('.right-paper').boundingBox();
  await page.mouse.move(b.x+b.width-35,b.y+60);await page.mouse.down();await page.mouse.move(b.x+60,b.y+60,{steps:8});await page.mouse.up();
  await expect(current()).toHaveAttribute('data-page','2'); await page.waitForTimeout(650);
});
await check('Chapter search and exact number navigation work',async()=>{
  await page.locator('.reader-toolbar>.text-button').click();
  await page.locator('.chapter-search input').fill('Litmatch');
  await expect(page.locator('.chapter-list>button')).toHaveCount(1);
  await page.locator('#jump-number').fill('20');await page.locator('.jump-form button').click();
  await expect(current()).toHaveAttribute('data-page','20');await expect(current().locator('h2')).toHaveText('Bukan tanggal acak.');
});
await check('All 200 pages render real content; counters and slider match',async()=>{
  const snapshots={};
  for(let i=1;i<=200;i++) {
    await number(i); const text=await current().locator('.paper-content').innerText();
    assert.ok(text.trim().length>20,`Blank page ${i}`);
    await expect(page.locator('.reading-position strong')).toHaveText(String(i));
    if([1,2,20,50,100,200].includes(i))snapshots[i]=text;
  }
  assert.equal(new Set(Object.values(snapshots)).size,6);
});
await check('Current page changes entirely to English without resetting position',async()=>{
  await number(100);const id=await current().locator('.prose').innerText();
  await language('en');await expect(current()).toHaveAttribute('data-page','100');
  assert.notEqual(await current().locator('.prose').innerText(),id);
  await expect(current().locator('h2')).toHaveText('A dictionary only we understand');
  await language('id');
});
await check('Bookmark, close, reopen, and reload preserve the real reading position',async()=>{
  await number(50);await page.locator('.bookmark-button').click();await expect(page.locator('.bookmark-button')).toHaveAttribute('aria-pressed','true');
  await page.locator('.reader-toolbar button[aria-label="Tutup buku"]').click();await expect(page.locator('.cover-view')).toBeVisible();await expect(page.locator('.cover-call-to-action .handwritten')).toContainText('50');
  await page.reload();await page.locator('.primary-button').click();await expect(current()).toHaveAttribute('data-page','50');await expect(page.locator('.bookmark-button')).toHaveAttribute('aria-pressed','true');await page.waitForTimeout(700);
});
await check('Game 1: quiz scoring, wrong answer feedback, language retention and restart',async()=>{
  await number(148);await restart();
  await current().locator('.choice').nth(0).click();await expect(current().locator('.game-feedback')).toContainText('Jawabannya');
  await language('en');await expect(current().locator('.choice.selected')).toHaveCount(1);await expect(current()).toHaveAttribute('data-page','148');await language('id');await restart();
  for(const answer of [1,0,1,1,1]) {await current().locator('.choice').nth(answer).click();await expect(current().locator('.game-feedback')).toHaveClass(/correct/);await current().locator('.small-button').click();}
  await expect(current().locator('.game-result h3')).toHaveText('5 / 5');await restart();await expect(current().locator('.choices')).toBeVisible();
});
await check('Game 2: all six memory pairs, move count, and restart',async()=>{
  await number(149);await restart();
  const deck=await page.evaluate(()=>JSON.parse(localStorage.getItem('aira:game-memory')).deck);
  for(const value of [...new Set(deck)]) {const indices=deck.flatMap((v,i)=>v===value?[i]:[]);for(const i of indices)await current().locator('.memory-card').nth(i).click();await page.waitForTimeout(440);}
  await expect(current().locator('.memory-card.matched')).toHaveCount(12);await expect(current().locator('.game-feedback')).toHaveClass(/correct/);
  await restart();await expect(current().locator('.memory-card.matched')).toHaveCount(0);
});
await check('Game 3: all emoji decode questions, real typed answers and restart',async()=>{
  await number(150);await restart();
  await current().locator('input').fill('salah');await current().locator('form button').click();await expect(current().locator('.game-feedback')).toHaveClass(/incorrect/);
  for(const answer of ['WhatsApp','panggilan pertama','cium','empat bulan']) {await current().locator('input').fill(answer);await current().locator('form button').click();await expect(current().locator('.game-feedback')).toHaveClass(/correct/);await current().getByRole('button',{name:'Kode berikutnya',exact:true}).click();}
  await expect(current().locator('.game-result')).toBeVisible();await restart();await expect(current().locator('input')).toHaveValue('');
});
await check('Game 4: this-or-that choices produce an individual summary and restart',async()=>{
  await number(151);await restart();for(let i=0;i<5;i++)await current().locator('.either-options>button').nth(i%2).click();
  await expect(current().locator('.choice-summary>li')).toHaveCount(5);await restart();await expect(current().locator('.either-options')).toBeVisible();
});
await check('Game 5: letter selection, all scramble words, checking and restart',async()=>{
  await number(152);await restart();
  for(const word of ['AIRA','LITMATCH','BEBYYCUU','DARLINGCUUU']) {
    const pool=await page.evaluate(()=>JSON.parse(localStorage.getItem('aira:game-scramble')).pool);const used=[];
    for(const letter of word){const i=pool.findIndex((v,i)=>v===letter&&!used.includes(i));used.push(i);await current().locator('.letter-pool>button').nth(i).click();}
    await current().getByRole('button',{name:'Cek susunan',exact:true}).click();await expect(current().locator('.game-feedback')).toHaveClass(/correct/);await current().getByRole('button',{name:'Kata berikutnya',exact:true}).click();
  }
  await expect(current().locator('.game-result')).toBeVisible();await restart();await expect(current().locator('.letter-pool>button')).toHaveCount(4);
});
await check('Game 6: hidden-heart search counts misses and all discoveries, then restarts',async()=>{
  await number(153);await restart();const positions=await page.evaluate(()=>JSON.parse(localStorage.getItem('aira:game-hearts')).positions);
  const miss=Array.from({length:25},(_,i)=>i).find(i=>!positions.includes(i));await current().locator('.heart-garden>button').nth(miss).click();
  for(const i of positions)await current().locator('.heart-garden>button').nth(i).click();
  await expect(current().locator('.heart-garden>.found')).toHaveCount(5);await expect(current().locator('.game-feedback')).toHaveClass(/correct/);await restart();await expect(current().locator('.heart-garden>.found')).toHaveCount(0);
});
await check('Game 7: three typed guesses, feedback, completion and restart',async()=>{
  await number(154);await restart();
  for(const answer of ['Lesbian','tahun depan','Aira']){await current().locator('input').fill(answer);await current().locator('form button').click();await expect(current().locator('.game-feedback')).toHaveClass(/correct/);await current().getByRole('button',{name:'Pertanyaan berikutnya',exact:true}).click();}
  await expect(current().locator('.game-result')).toBeVisible();await restart();await expect(current().locator('input')).toHaveValue('');
});
await check('Game 8: real timeline reorder controls, validation and restart',async()=>{
  await number(155);await restart();
  for(let desired=0;desired<5;desired++) {
    let order=await page.evaluate(()=>JSON.parse(localStorage.getItem('aira:game-puzzle')).order);let index=order.indexOf(desired);
    while(index>desired){await current().locator('.timeline-puzzle>li').nth(index).locator('button').first().click();index--;}
  }
  await current().getByRole('button',{name:'Cek urutan',exact:true}).click();await expect(current().locator('.game-feedback')).toHaveClass(/correct/);await restart();
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('aira:game-puzzle')).order),[2,4,0,3,1]);
});
await check('Game 9: heart taps, time lock, token puzzle, completion and restart',async()=>{
  await number(156);await restart();for(let i=0;i<4;i++)await current().locator('.challenge-heart').click();
  await current().locator('input').fill('10:28');await current().locator('form button').click();await expect(current().locator('.game-feedback')).toHaveClass(/incorrect/);
  await current().locator('input').fill('10:29');await current().locator('form button').click();
  await current().getByRole('button',{name:'AI',exact:true}).click();await current().getByRole('button',{name:'RA',exact:true}).click();await current().getByRole('button',{name:'Selesai',exact:true}).click();
  await expect(current().locator('.game-result')).toBeVisible();await expect(current()).toHaveAttribute('data-page','156');await restart();await expect(current().locator('.challenge-heart')).toBeVisible();
});
await check('All ten envelopes open distinct bilingual messages without losing open state',async()=>{
  const messages=[];
  for(let n=157;n<=166;n++){
    await number(n);if(await current().locator('.envelope.is-open').count())await current().locator('.envelope').click();await current().locator('.envelope').click();
    await expect(current().locator('.envelope-letter')).toBeVisible();const id=await current().locator('.envelope-letter').innerText();messages.push(id);
    await language('en');await expect(current().locator('.envelope.is-open')).toBeVisible();assert.notEqual(await current().locator('.envelope-letter').innerText(),id);await language('id');
  }
  assert.equal(new Set(messages).size,10);
});
await check('Hidden heart notes and question answers persist through navigation and language changes',async()=>{
  await number(5);await current().locator('.hidden-note>button').click();await expect(current().locator('.hidden-note>p')).toBeVisible();
  await number(15);await current().locator('textarea').fill('Jawaban uji Aira, disimpan lokal.');await language('en');await expect(current().locator('textarea')).toHaveValue('Jawaban uji Aira, disimpan lokal.');await language('id');
  await number(20);await number(15);await expect(current().locator('textarea')).toHaveValue('Jawaban uji Aira, disimpan lokal.');await number(5);await expect(current().locator('.hidden-note>p')).toBeVisible();
});
await check('Relationship timeline expands actual events and labels the future as a hope',async()=>{
  await number(175);await current().locator('.relationship-timeline>li').last().locator('button').click();await expect(current().locator('.relationship-timeline>li').last().locator('p')).toContainText('2028');
});
await check('Guestbook saves, translates, exports, reloads, and deletes local notes',async()=>{
  await number(191);await current().locator('#guest-name').fill('Aira');await current().locator('#guest-message').fill('Catatan QA lokal, bukan kenangan yang dibuat-buat.');await current().locator('form .small-button').click();
  await expect(current().locator('.guest-entry')).toHaveCount(1);await language('en');await expect(current().locator('.guest-entry')).toContainText('Catatan QA lokal');await language('id');
  const download=page.waitForEvent('download');await current().locator('.guestbook-actions button').click();const file=await download;assert.equal(file.suggestedFilename(),'aira-and-shivam-notes.txt');
  await page.reload();await page.locator('.primary-button').click();await expect(current()).toHaveAttribute('data-page','191');await expect(current().locator('.guest-entry')).toHaveCount(1);await page.waitForTimeout(700);
  await current().locator('.guest-entry .icon-button').click();await expect(current().locator('.guest-entry')).toHaveCount(0);
});
await check('Missing-photo spaces open the lightbox with captions and real previous/next controls',async()=>{
  await number(6);await current().locator('.polaroid').click();await expect(page.locator('.lightbox')).toBeVisible();await expect(page.locator('.missing-notice')).toBeVisible();
  await expect(page.locator('.lightbox-top>span').nth(1)).toHaveText('01 / 50');await page.locator('.lightbox-bottom>.round-button').last().click();await expect(page.locator('.lightbox-top>span').nth(1)).toHaveText('02 / 50');await page.keyboard.press('ArrowLeft');await expect(page.locator('.lightbox-top>span').nth(1)).toHaveText('01 / 50');await page.keyboard.press('Escape');await expect(current()).toHaveAttribute('data-page','6');
});
let jpeg, filenames;
await check('All 50 JPEGs import, decode, preserve exact original names and persist locally',async()=>{
  jpeg=Buffer.from(await page.evaluate(()=>{const c=document.createElement('canvas');c.width=240;c.height=320;const x=c.getContext('2d');x.fillStyle='#e4d3b4';x.fillRect(0,0,240,320);x.fillStyle='#6c5035';x.font='16px sans-serif';x.textAlign='center';x.fillText('QA TEST FIXTURE',120,145);x.fillText('NOT A PERSONAL PHOTO',120,175);return c.toDataURL('image/jpeg').split(',')[1];}),'base64');
  filenames=Array.from({length:50},(_,i)=>i===0?'QA original 01 (test only).jpeg':`QA-fixture-${String(i+1).padStart(2,'0')}.jpeg`);
  await page.locator('.site-footer button').click();await page.locator('.about-actions button').click();
  await page.locator('input[type=file]').setInputFiles(filenames.map(name=>({name,mimeType:'image/jpeg',buffer:jpeg})));
  await expect(page.locator('.photo-manager-intro>strong')).toContainText('50 / 50');await expect(page.locator('.import-status.success')).toBeVisible();await expect(page.locator('.photo-slots img')).toHaveCount(50);
  assert.equal(await page.locator('.slot-filename').first().innerText(),filenames[0]);
  await page.keyboard.press('Escape');await page.reload();await page.locator('.primary-button').click();await expect(current()).toHaveAttribute('data-page','6');await page.waitForTimeout(700);
  await expect(current().locator('.photo-window img')).toBeVisible();await expect.poll(()=>current().locator('.photo-window img').evaluate(img=>img.naturalWidth)).toBe(240);
});
await check('All 50 photographs render across their assigned real book pages without repeats',async()=>{
  const placement=[6,9,12,15,19,22,24,28,32,36,40,43,46,49,52,54,58,62,66,70,74,78,81,84,86,168,170,173,177,180,183,186,190,196,199];
  const loaded=[];
  for(const n of placement){await number(n);const images=current().locator('.photo-window img');await expect.poll(()=>images.evaluateAll(imgs=>imgs.every(img=>img.complete&&img.naturalWidth>0))).toBe(true);loaded.push(...await images.evaluateAll(imgs=>imgs.map(img=>img.src)));}
  assert.equal(loaded.length,50);assert.equal(new Set(loaded).size,50);
});
await check('Imported photo lightbox loads the real image, preserves filename, and provides adjustable focal preview',async()=>{
  await number(6);await current().locator('.polaroid').click();await expect(page.locator('.lightbox-image img.loaded')).toBeVisible();await expect(page.locator('.original-filename')).toHaveText(filenames[0]);
  await page.locator('.focal-settings summary').click();await page.locator('.focal-settings input[type=checkbox]').check();await page.locator('.focal-settings input[type=range]').first().fill('65');
  await expect(page.locator('.lightbox-image img')).toHaveCSS('object-fit','cover');await expect(current()).toHaveAttribute('data-page','6');await page.keyboard.press('Escape');
});
await check('Personalised ZIP includes complete static site, all 50 actual imported bytes and exact manifest paths',async()=>{
  await page.locator('.site-footer button').click();await page.locator('.about-actions button').click();const waiting=page.waitForEvent('download',{timeout:30000});
  await page.locator('.photo-manager-actions .small-button').click();const download=await waiting;await download.saveAs('/tmp/aira-personal-qa.zip');
  const archive=unzipSync(new Uint8Array(await readFile('/tmp/aira-personal-qa.zip')));const root='aira-anniversary-book/';
  for(const filename of ['index.html','style.css','script.js','README.md','aira-anniversary-book.zip'])assert.ok(archive[root+filename],filename);
  const manifest=JSON.parse(strFromU8(archive[root+'assets/photos/manifest.json']));assert.equal(manifest.length,50);
  for(let i=0;i<50;i++){assert.equal(manifest[i].filename,filenames[i]);assert.equal(manifest[i].src,'./assets/photos/'+encodeURIComponent(filenames[i]));assert.deepEqual(Buffer.from(archive[root+'assets/photos/'+filenames[i]]),jpeg);}
  await page.keyboard.press('Escape');
});
await check('Final surprise displays exact required text and confetti can replay',async()=>{
  await number(200);await current().getByRole('button',{name:'Buka kejutan terakhir',exact:true}).click();await expect(current().locator('.final-surprise>h3')).toHaveText('LESBICUUUU ❤️');await expect(page.locator('.confetti>i')).toHaveCount(70);
  await current().getByRole('button',{name:'Rayakan sekali lagi',exact:true}).click();await expect(page.locator('.confetti>i')).toHaveCount(70);await language('en');await expect(current().locator('.final-surprise>h3')).toHaveText('LESBICUUUU ❤️');await language('id');
});
await check('Optional sound toggle responds without auto-playing on first visit',async()=>{
  await expect(page.locator('.sound-button')).toHaveAttribute('aria-pressed','false');await page.locator('.sound-button').click();await expect(page.locator('.sound-button')).toHaveAttribute('aria-pressed','true');await page.locator('.sound-button').click();await expect(page.locator('.sound-button')).toHaveAttribute('aria-pressed','false');
});
await check('A nonexistent external photo falls back gracefully, including in lightbox',async()=>{
  const ctx=await browser.newContext({viewport:{width:1000,height:850}});const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/assets/photos/manifest.json',route=>route.fulfill({contentType:'application/json',body:JSON.stringify([{slot:0,filename:'QA-missing.jpeg',src:'./assets/photos/QA-missing.jpeg'}])}));await p.route('**/assets/photos/QA-missing.jpeg',route=>route.fulfill({status:404,body:'Missing test fixture'}));
  await p.goto(base);await p.locator('.primary-button').click();await expect(p.locator('.current-page')).toBeVisible();await p.waitForTimeout(700);
  await p.locator('.reading-progress input').evaluate(el=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'6');el.dispatchEvent(new Event('input',{bubbles:true}));});await expect(p.locator('.right-paper .current-page')).toHaveAttribute('data-page','6');
  await expect(p.locator('.right-paper .photo-placeholder')).toBeVisible();await p.locator('.right-paper .polaroid').click();await expect(p.locator('.missing-notice')).toBeVisible();await ctx.close();
});
await check('iPhone-sized mobile layout, native swipe, interaction isolation, and no horizontal overflow',async()=>{
  const mobileContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});const m=await mobileContext.newPage();m.on('pageerror',e=>errors.push(e.message));await m.goto(base);await m.waitForTimeout(1500);await m.screenshot({path:'tests/cover-mobile.png',fullPage:true});
  for(const width of [320,375,390]){await m.setViewportSize({width,height:844});assert.equal(await m.evaluate(()=>document.documentElement.scrollWidth),width);}
  await m.setViewportSize({width:390,height:844});await m.locator('.primary-button').click();await expect(m.locator('.right-paper .current-page')).toHaveAttribute('data-page','1');await m.waitForTimeout(700);
  await swipe(m.locator('.right-paper'),-1,m);await expect(m.locator('.right-paper .current-page')).toHaveAttribute('data-page','2');await m.waitForTimeout(650);
  await swipe(m.locator('.right-paper'),1,m);await expect(m.locator('.right-paper .current-page')).toHaveAttribute('data-page','1');await m.waitForTimeout(650);
  await m.getByRole('button',{name:'Berikutnya',exact:true}).click();await expect(m.locator('.right-paper .current-page')).toHaveAttribute('data-page','2');await m.waitForTimeout(650);await m.getByRole('button',{name:'Sebelumnya',exact:true}).click();await m.waitForTimeout(650);
  await m.locator('.reader-toolbar>.text-button').click();await m.locator('#jump-number').fill('153');await m.locator('.jump-form button').click();await expect(m.locator('.right-paper .current-page')).toHaveAttribute('data-page','153');await m.locator('.right-paper .heart-garden>button').first().click();await expect(m.locator('.right-paper .current-page')).toHaveAttribute('data-page','153');
  await m.locator('.reader-toolbar>.text-button').click();await m.locator('#jump-number').fill('6');await m.locator('.jump-form button').click();await m.locator('.right-paper .polaroid').click();
  await swipe(m.locator('.lightbox-image'),-1,m);await expect(m.locator('.lightbox-top>span').nth(1)).toHaveText('02 / 50');await expect(m.locator('.right-paper .current-page')).toHaveAttribute('data-page','6');
  await swipe(m.locator('.lightbox-image'),1,m);await expect(m.locator('.lightbox-top>span').nth(1)).toHaveText('01 / 50');await m.locator('.lightbox-top .icon-button').click();
  await m.locator('.reader-toolbar>.text-button').click();await m.locator('#jump-number').fill('100');await m.locator('.jump-form button').click();
  const scrollBefore=await m.locator('.right-paper .paper-content').evaluate(el=>el.scrollTop);
  const box=await m.locator('.right-paper .paper-content').boundingBox();const vertical=await mobileContext.newCDPSession(m);
  await vertical.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height-25}]});
  for(let i=1;i<=5;i++)await vertical.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height-25-i*45}]});
  await vertical.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await vertical.detach();
  await expect(m.locator('.right-paper .current-page')).toHaveAttribute('data-page','100');
  assert.ok(await m.locator('.right-paper .paper-content').evaluate(el=>el.scrollTop)>=scrollBefore);
  for(const width of [320,375,390]){await m.setViewportSize({width,height:844});assert.equal(await m.evaluate(()=>document.documentElement.scrollWidth),width);}
  await m.screenshot({path:'tests/reader-mobile.png',fullPage:true});await mobileContext.close();
});
await check('No uncaught JavaScript errors during the entire tested experience',async()=>assert.deepEqual(errors,[]));
await writeFile('tests/browser-report.json',JSON.stringify({base,testedAt:new Date().toISOString(),browser:'Playwright Chromium',physicalDeviceTested:false,results,uncaughtErrors:errors},null,2));
console.log(`\n${results.filter(r=>r.passed).length}/${results.length} browser checks passed.`);
await browser.close();
if(results.some(r=>!r.passed))process.exitCode=1;
