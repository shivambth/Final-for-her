# Our Little Forever

A four-month anniversary keepsake for Aira, from Shivam.

## What's Included

- A chocolate hardcover, cream-paper reader, 3D cover opening and two-sided page turns.
- 200 actual numbered pages, arranged into 18 chapters. On desktop, the left sheet previews the previous numbered page; the right sheet is the current page counted by the navigation. Mobile shows the current page only.
- 12 distinct Indonesian letters, each 450-550 words, each with a complete English translation. Each letter occupies three real pages.
- Exactly 50 individually written, bilingual reasons, followed by the requested afterword.
- Nine different playable games, ten opening envelopes, ten hidden-heart notes, an interactive timeline, questions, bookmarks, and a local guestbook.
- Indonesian by default, English on demand. Language changes do not reset reading or game progress.
- Fifty photo spaces distributed across 35 pages using different scrapbook layouts. Images are contained without stretching faces.
- A private JPEG importer, original-filename preservation, IndexedDB storage, lightbox, mobile photo swiping, optional adjustable crop preview, and personalised ZIP export.
- Local fonts, original SVG decorations and icons, optional synthesised page sounds, final confetti, and reduced-motion support.

## Important Photo Status

**No personal photographs or original filenames were supplied with the request. This delivery does not contain 50 personal photographs.** No filenames have been invented and no strangers' photographs have been substituted. All 50 slots are registered centrally in `source/src/data/photos.ts`, with null sources until real files are supplied. The printed memory spaces are deliberate placeholders, not broken image links.

The photo manager is available under **Hal-hal kecil / Little things > Foto-foto kecil kita / Our little photos**, or from **Tentang buku / About the book**. Select up to 50 original JPEG files in the intended order. Their names, spelling, spaces, punctuation, and file bytes are preserved. The first selected file occupies slot 1, the second slot 2, and so on. Importing another batch replaces the matching slots from slot 1 onward. Duplicate filenames in a batch are rejected rather than silently renamed. Each file may be up to 20 MB.

Imported photographs are saved to this browser, not uploaded. Click **Unduh buku + foto asli / Download book + original photos** to obtain a new complete static ZIP with the imported original files and exact manifest references inside it. Deploy that personalised archive to share the real photos with Aira; importing photos alone does not change a remotely hosted website for other visitors.

If adding files manually, place their unchanged originals in `assets/photos/` and register their exact names in `assets/photos/manifest.json`. Its value is an array of objects with `slot` (zero-based), `filename`, `src`, `focalX`, and `focalY`. Use `encodeURIComponent` for the filename part of the source URL; do not rename the physical file. The UI importer produces the complete manifest automatically. Missing external files fall back to a memory space.

## Static Website

The archive root contains the complete, already-built website:

```
aira-anniversary-book/
  index.html
  style.css
  script.js
  README.md
  PHOTO-STATUS.txt
  QA_REPORT.md
  .nojekyll
  assets/
    photos/manifest.json
    fonts/
    stickers/
    decorations/
    icons/
  source/
  licenses/
```

There is no required server application, account, database service, API key, paid backend, CDN, or external font request. The static files run on ordinary HTTP/HTTPS hosting. Use a local static server instead of double-clicking `index.html`, because browser security restrictions for `file://` can block JavaScript, IndexedDB, or manifest requests. For example, run `python3 -m http.server 8080` inside the extracted folder and open `http://localhost:8080`.

### GitHub Pages

Upload the **contents** of `aira-anniversary-book/` to a repository, keeping `index.html`, `style.css`, `script.js`, `.nojekyll`, and `assets/` together at the publishing root. In the repository's Settings > Pages, choose Deploy from a branch, then the branch and root folder. All deployment asset URLs are relative, including when served under a repository subpath. The `source/`, `licenses/`, and documentation files may remain; they do not need any build command for the ready-made edition.

**Privacy:** GitHub Pages is public hosting. Do not publish intimate or sensitive photos there without both people's informed consent. Local photo import is private, but photos placed in a published static archive are public to anyone who can access the site.

## Reading & Controls

Click the cover or the main opening button. Use the previous/next buttons, left/right keyboard arrows, a horizontal mouse drag, or a horizontal mobile swipe. Vertical movement scrolls a long page rather than turning it. Home/End jump to the first/last page. Games, forms, envelopes, photographs, and lightboxes are isolated from book-turn gestures.

The contents dialog has chapter search, exact page-number jumping (1-200), and saved bookmarks. The reading slider jumps to a genuine populated page. Close the book with the top-right X in the reader; your place stays saved. Sound starts disabled and only plays after a user enables it. It is an original short Web Audio paper sound and closing chime, not an included music track.

The last page has a final-surprise button and reveals the exact requested **LESBICUUUU ❤️**. Confetti can be replayed. Reduced-motion preferences suppress decorative motion.

## Saving & Guestbook

Reading position, language, game state, envelope state, answers, discovered notes, final reveal, and bookmarks use localStorage under the `aira:` prefix. Imported JPEG blobs use IndexedDB `aira-keepsake-photos`. Guestbook entries are stored **on the current device only**. They do not automatically reach Shivam. Download the notes file and send it yourself if you want to share it. Entries can be deleted individually. Browser privacy settings or clearing site data may remove local saves. Download a personalised ZIP to retain photographs independently of browser storage.

## Editable Source

The provided application environment requires a React entry point. Consequently, the editable source is React 19 + TypeScript in `source/src/App.tsx`, built with Vite and Tailwind v4. The root `script.js` is the complete self-contained compiled JavaScript, including its bundled runtime; it is **not** a separately hand-authored vanilla-JavaScript rewrite. No React installation is required to deploy or run the ready-built static edition.

Inside `source/`, use `npm ci`, then `npm run dev` to develop. Run `npx tsc --noEmit` for type checking. Run `node scripts/validate-content.mjs` for the actual content checks. Run `npm run build` followed by `node scripts/package.mjs` to regenerate the static edition and ZIP. The packaging command writes `delivery/aira-anniversary-book/` and `public/aira-anniversary-book.zip`. Browser tests are in `tests/browser-qa.mjs`; install Chromium with `npx playwright install chromium` if needed and run a Vite server before testing.

Content is separated into `src/data/book.ts`, `letters.ts`, `reasons.ts`, `envelopes.ts`, `photos.ts`, and `types.ts`. Game mechanics are in `src/components/Games.tsx`. Photos and ZIP export are in `src/lib/photos.ts`. UI rendering and photo components are reusable and do not fabricate memories or original filenames.

## Story Accuracy

The relationship starts on **6 July 2026 at 10:29 PM**. They met on Litmatch and moved to WhatsApp that night. The roughly first ten days included misunderstandings and small fights, followed by gradually understanding each other and becoming closer. The first call and early kiss are acknowledged without invented dates, dialogue, locations, or duration. Meeting next year is a hope, with Aira's occasional 2028 mentioned respectfully, not a confirmed plan. No new specific memories or promises have been manufactured.

## Verification

See `QA_REPORT.md` and `tests/content-report.json` for checks actually performed. Chromium mobile emulation is not a claim of testing on a physical iPhone or in Safari. Personal photos cannot be verified against absent originals; photo loading and filename preservation are tested with clearly marked synthetic JPEG fixtures that are not included as personal photographs.

## Credits & Licenses

Original book design, SVG ornaments, captions and content are included. Cormorant Garamond, DM Sans, and Caveat are bundled under their SIL Open Font Licenses in `assets/fonts/`. React and React DOM use the MIT License; Lucide uses the ISC License; fflate uses the MIT License. Bundled dependency license files are in `licenses/`. The procedural paper grain and Web Audio sounds require no downloaded media assets.