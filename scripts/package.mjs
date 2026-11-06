import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { zipSync } from 'fflate';
import path from 'node:path';

const destination = 'delivery/aira-anniversary-book';
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
let html = await readFile('dist/index.html', 'utf8');
const script = [...html.matchAll(/<script\b[^>]*type="module"[^>]*>([\s\S]*?)<\/script>/g)].map(match => match[1]).join('\n');
const styles = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(match => match[1]).join('\n').replace(/url\((["']?)\/assets\//g, 'url($1./assets/');
if (!script || !styles) throw new Error('The production build must contain its script and styles.');
html = html.replace(/<script\b[^>]*type="module"[^>]*>[\s\S]*?<\/script>/g, '<script defer src="./script.js"></script>').replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, '<link rel="stylesheet" href="./style.css">').replaceAll('"/assets/', '"./assets/');
if (script.includes('import.meta')) throw new Error('Compiled script requires module handling.');
await Promise.all([
  writeFile(`${destination}/index.html`, html), writeFile(`${destination}/script.js`, script), writeFile(`${destination}/style.css`, styles),
  writeFile(`${destination}/.nojekyll`, ''), cp('public/assets', `${destination}/assets`, { recursive: true }), cp('README.md', `${destination}/README.md`),
  writeFile(`${destination}/PHOTO-STATUS.txt`, 'No personal JPEG files or original filenames were supplied. 50 real photo slots are distributed across the book. Add the originals through the photo manager, then export a personalised ZIP.\n'),
]);
const source = `${destination}/source`;
await mkdir(`${source}/public`, { recursive: true });
await mkdir(`${source}/tests`, { recursive: true });
for (const filename of ['package.json','package-lock.json','vite.config.ts','tsconfig.json','index.html','README.md']) await cp(filename,`${source}/${filename}`);
for (const folder of ['src','scripts']) await cp(folder,`${source}/${folder}`, { recursive: true });
await cp('public/assets',`${source}/public/assets`,{ recursive: true });
for (const filename of ['content-report.json','browser-qa.mjs','browser-report.json','dev-browser-report.json','static-browser-report.json','personalized-qa.mjs','personalized-report.json']) await cp(`tests/${filename}`,`${source}/tests/${filename}`).catch(()=>{});
await cp('QA_REPORT.md',`${destination}/QA_REPORT.md`).catch(()=>writeFile(`${destination}/QA_REPORT.md`,'Content and browser QA reports are generated separately. No unperformed browser tests are claimed.\n'));
await mkdir(`${destination}/licenses`, { recursive: true });
for (const name of ['react','react-dom','lucide-react','fflate']) {
  for (const filename of ['LICENSE','LICENSE.txt','LICENSE.md']) {
    try { await cp(`node_modules/${name}/${filename}`,`${destination}/licenses/${name}.txt`); break; } catch { /* License filename differs between packages. */ }
  }
}
async function collect(directory, prefix = '') {
  const files = {};
  for (const item of await readdir(directory,{withFileTypes:true})) {
    const relative = prefix + item.name;
    if (item.isDirectory()) Object.assign(files,await collect(path.join(directory,item.name),relative+'/'));
    else files[relative] = new Uint8Array(await readFile(path.join(directory,item.name)));
  }
  return files;
}
const files = await collect(destination,'aira-anniversary-book/');
// A finite nested base archive keeps the in-site download link functional after extraction.
const baseZip = zipSync(files,{level:6});
await writeFile(`${destination}/aira-anniversary-book.zip`,baseZip);
files['aira-anniversary-book/aira-anniversary-book.zip']=baseZip;
const archive = zipSync(files,{level:6});
await writeFile('public/aira-anniversary-book.zip',archive);
await writeFile('dist/aira-anniversary-book.zip',archive);
console.log(`Packaged ${Object.keys(files).length} files; ZIP ${(archive.length/1048576).toFixed(2)} MB. No personal photographs were supplied.`);