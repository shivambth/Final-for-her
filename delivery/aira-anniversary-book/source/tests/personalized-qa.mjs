import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { unzipSync, strFromU8 } from 'fflate';
import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';

// This archive is produced by browser-qa.mjs with explicitly labelled synthetic JPEGs.
const archive=unzipSync(new Uint8Array(await readFile('/tmp/aira-personal-qa.zip')));
const root='aira-anniversary-book/';
const manifest=JSON.parse(strFromU8(archive[root+'assets/photos/manifest.json']));
assert.equal(manifest.length,50);
for(const photo of manifest) {
  assert.ok(archive[root+'assets/photos/'+photo.filename]);
  assert.deepEqual(archive[root+'source/public/assets/photos/'+photo.filename],archive[root+'assets/photos/'+photo.filename]);
}
const server=createServer((request,response)=>{
  const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
  const relative=pathname.replace(/^\/gift\//,'')||'index.html';
  const file=archive[root+relative];
  const types={js:'text/javascript',css:'text/css',html:'text/html',json:'application/json',jpeg:'image/jpeg',jpg:'image/jpeg',svg:'image/svg+xml',ttf:'font/ttf',zip:'application/zip'};
  if(!file){response.writeHead(404);response.end('Not found');return;}
  response.writeHead(200,{'Content-Type':types[relative.split('.').at(-1)]||'application/octet-stream'});response.end(file);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(`http://127.0.0.1:${server.address().port}/gift/`);
await page.locator('.primary-button').click();await expect(page.locator('.current-page')).toBeVisible();await page.waitForTimeout(750);
const placement=[6,9,12,15,19,22,24,28,32,36,40,43,46,49,52,54,58,62,66,70,74,78,81,84,86,168,170,173,177,180,183,186,190,196,199];
let total=0;
for(const n of placement){
  await page.locator('.reading-progress input').evaluate((el,n)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,String(n));el.dispatchEvent(new Event('input',{bubbles:true}));},n);
  await expect(page.locator('.right-paper .current-page')).toHaveAttribute('data-page',String(n));
  const images=page.locator('.right-paper .photo-window img');
  await expect.poll(()=>images.evaluateAll(imgs=>imgs.length>0&&imgs.every(img=>img.complete&&img.naturalWidth===240))).toBe(true);
  total+=await images.count();
}
assert.equal(total,50);
await page.locator('.reading-progress input').evaluate(el=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'6');el.dispatchEvent(new Event('input',{bubbles:true}));});
await expect(page.locator('.right-paper .current-page')).toHaveAttribute('data-page','6');await page.locator('.right-paper .polaroid').click();
await expect(page.locator('.original-filename')).toHaveText('QA original 01 (test only).jpeg');
await page.locator('.focal-settings summary').click();await page.locator('.focal-settings input[type=range]').first().fill('31');
await page.keyboard.press('Escape');await page.reload();await page.locator('.primary-button').click();await expect(page.locator('.right-paper .current-page')).toHaveAttribute('data-page','6');await page.waitForTimeout(750);await page.locator('.right-paper .polaroid').click();await page.locator('.focal-settings summary').click();await expect(page.locator('.focal-settings input[type=range]').first()).toHaveValue('31');await page.keyboard.press('Escape');
await page.locator('.site-footer button').click();await page.locator('.about-actions button').click();const download=page.waitForEvent('download');await page.locator('.photo-manager-actions .small-button').click();const file=await download;await file.saveAs('/tmp/aira-second-generation-qa.zip');
const exported=unzipSync(new Uint8Array(await readFile('/tmp/aira-second-generation-qa.zip')));
assert.equal(JSON.parse(strFromU8(exported[root+'assets/photos/manifest.json'])).length,50);
for(const photo of manifest)assert.deepEqual(exported[root+'assets/photos/'+photo.filename],archive[root+'assets/photos/'+photo.filename]);
assert.deepEqual(errors,[]);
const report={passed:true,photosLoaded:50,photoPages:35,sourceOriginalsIncluded:true,originalFilenameWithSpacesPreserved:true,focalPositionPersistsForStaticImages:true,secondGenerationExportPreservesAllBytes:true,uncaughtErrors:errors,testImagesAreSynthetic:true};
await writeFile('tests/personalized-report.json',JSON.stringify(report,null,2));
console.log('PASS: personalised static deployment loads all 50 JPEGs across 35 pages; filenames, source files, focal position, and re-export verified.');
await browser.close();server.close();