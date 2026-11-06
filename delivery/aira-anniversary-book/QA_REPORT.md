# Verification Report

Generated from recorded checks, not estimated results.

## Summary

- Content validation: 13/13 checks passed.
- Development browser suite: 30/30 checks passed, Playwright Chromium.
- Extracted static-site browser suite: 30/30 checks passed, Playwright Chromium.
- Static URL tested: http://localhost:8088/aira-anniversary-book/
- Static browser test recorded: 2026-11-06T07:47:58.445Z
- Uncaught JavaScript errors in recorded suites: 0.
- All 200 real pages were visited and their counters checked in each browser suite.
- All nine games were completed using their working controls, then restarted.
- All ten envelopes were opened and translated without losing their state.
- Fifty synthetic, explicitly labelled JPEG fixtures were imported, rendered in their 50 assigned slots, persisted, and exported with their exact filenames and file bytes.
- Static font loading and asset paths were checked separately: all three font families loaded, no external requests, and no failed asset requests on the cover.
- TypeScript checking and production builds passed.
- npm audit reported zero production vulnerabilities, and the development tooling was updated to patched versions.

## Content Checks

- PASS: Exactly 200 populated pages with distinct IDs
- PASS: Chapter ranges cover each page exactly once
- PASS: 50 unique reasons in both languages
- PASS: Every reason rendered exactly once
- PASS: Exact required afterword in English
- PASS: 50 distinct photo slots, each intentionally placed once
- PASS: No invented original photo filenames or broken placeholder paths
- PASS: All nine distinct games occupy real pages
- PASS: Ten distinct bilingual envelopes occupy real pages
- PASS: 12 complete bilingual letters, three individually rendered parts each
- PASS: Every Indonesian letter is 450-550 words
- PASS: No duplicated letter paragraphs in either language
- PASS: Required final surprise on page 200 in both languages

## Letter Word Counts

Each Indonesian letter is required to contain 450-550 words. Each has a complete, individually written English version.

| Letter | Indonesian | English |
| --- | ---: | ---: |
| 1. The night that became our beginning | 491 | 551 |
| 2. About us and Litmatch | 478 | 536 |
| 3. Ten days that were not tidy | 484 | 543 |
| 4. Why it became you | 488 | 528 |
| 5. A dictionary only we understand | 476 | 521 |
| 6. Our first call | 499 | 587 |
| 7. Learning to understand, not guess | 485 | 541 |
| 8. Moody, lazy, and still you | 481 | 544 |
| 9. Little things that turn out to matter | 496 | 563 |
| 10. When we finally meet | 502 | 561 |
| 11. For a day that feels heavy | 505 | 570 |
| 12. Four months, and a book | 501 | 535 |

## Browser Checks

The following passed both development and extracted-static-site tests:

- PASS: Cover renders with exact dedication and starts in Indonesian
- PASS: Hardcover opens to an actual first page
- PASS: Next, previous, keyboard arrows and desktop mouse drag work
- PASS: Chapter search and exact number navigation work
- PASS: All 200 pages render real content; counters and slider match
- PASS: Current page changes entirely to English without resetting position
- PASS: Bookmark, close, reopen, and reload preserve the real reading position
- PASS: Game 1: quiz scoring, wrong answer feedback, language retention and restart
- PASS: Game 2: all six memory pairs, move count, and restart
- PASS: Game 3: all emoji decode questions, real typed answers and restart
- PASS: Game 4: this-or-that choices produce an individual summary and restart
- PASS: Game 5: letter selection, all scramble words, checking and restart
- PASS: Game 6: hidden-heart search counts misses and all discoveries, then restarts
- PASS: Game 7: three typed guesses, feedback, completion and restart
- PASS: Game 8: real timeline reorder controls, validation and restart
- PASS: Game 9: heart taps, time lock, token puzzle, completion and restart
- PASS: All ten envelopes open distinct bilingual messages without losing open state
- PASS: Hidden heart notes and question answers persist through navigation and language changes
- PASS: Relationship timeline expands actual events and labels the future as a hope
- PASS: Guestbook saves, translates, exports, reloads, and deletes local notes
- PASS: Missing-photo spaces open the lightbox with captions and real previous/next controls
- PASS: All 50 JPEGs import, decode, preserve exact original names and persist locally
- PASS: All 50 photographs render across their assigned real book pages without repeats
- PASS: Imported photo lightbox loads the real image, preserves filename, and provides adjustable focal preview
- PASS: Personalised ZIP includes complete static site, all 50 actual imported bytes and exact manifest paths
- PASS: Final surprise displays exact required text and confetti can replay
- PASS: Optional sound toggle responds without auto-playing on first visit
- PASS: A nonexistent external photo falls back gracefully, including in lightbox
- PASS: iPhone-sized mobile layout, native swipe, interaction isolation, and no horizontal overflow
- PASS: No uncaught JavaScript errors during the entire tested experience

## Boundaries

- No personal photograph files or original filenames were supplied. None are claimed to be included, and no test fixtures are included as personal photographs in the delivery. Real-photo identity, correspondence, and intended ordering cannot be verified without those originals.
- Mobile tests used Chromium touch emulation at 320, 375 and 390 CSS pixels wide, including native touch event swiping for the book and lightbox. This is not a physical iPhone or Safari test.
- The optional sound toggle and Web Audio code were exercised without errors; audio quality was not checked by human listening.
- GitHub Pages itself was not used for live deployment. Its repository-subfolder URL structure was tested locally with a standard Python HTTP static server.
- The guestbook is deliberately device-local. No cross-device backend or automatic message delivery is claimed.
- The editable implementation is React and TypeScript, required by the application environment; the delivered root is compiled static HTML, CSS and JavaScript, not a separate handwritten vanilla-JavaScript implementation.

## Reproducing

From the source project run `node scripts/validate-content.mjs` and `npx tsc --noEmit`. Start Vite, then run `node tests/browser-qa.mjs`. To test the extracted static edition, serve the delivery folder and set `AIRA_TEST_URL` to its subfolder URL before running the same test script.

## Personalised Static Export

A fresh browser context loaded all 50 labelled synthetic JPEGs from the exported static archive across 35 book pages, without relying on imported browser blobs. The original filename containing spaces and parentheses was preserved. Both the root and editable-source folders contained all original bytes. Focal positioning survived an immediate reload for externally served photos, and a second-generation export preserved all 50 files byte-for-byte. No uncaught JavaScript errors were recorded. These are test fixtures, not supplied personal photographs.
