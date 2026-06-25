# NTU ECAT Quiz & Study Dashboard

A free, static, no-backend quiz and study dashboard for NTU ECAT entry-test preparation: read topic notes, practice in guided quiz mode with instant explanations, simulate full 2-hour model papers, and track your own progress — all stored locally in your browser, nothing sent anywhere.

**Live app:** https://fsabainme.github.io/ntu-ecat-quiz-app/

## Features

- **Volume I (Preparation Guide):** 9 subjects, topic notes, and 3 practice sets of 25 questions each, with instant explanations and quick tactics after every answer.
- **Volume II (Model Papers):** 40 full-length 100-question papers (10 each for Pre-Medical, Pre-Engineering/DAE, ICS-Physics, ICS-Statistics), with a 120-minute timer, a question navigator, and a post-submission review grouped by section.
- **Dashboard:** progress across all 27 practice sets and 40 model papers, per-subject and per-group breakdowns, recent activity, and a "focus next" suggestion based on what you've missed most.
- **Works offline** after the first visit (installable as a PWA — "Add to Home Screen" on a phone, or install from the browser address bar on desktop).
- **No account, no backend, no tracking.** Progress lives only in this browser's `localStorage`. Export/import/reset are available in Settings.

## Running it locally

Just open `index.html` directly (double-click, or drag into a browser window) — no server, no build step, no install required. This works fully offline from the start, including on a phone if you copy the folder over.

One platform limitation: service workers (used for the "installable app" / explicit offline-cache feature) can't register under `file://` — that's a browser/OS restriction, not a bug. The quiz, notes, and exam features all work regardless; only the "Install as app" prompt requires the deployed (or locally-served) version below.

To test the installable/offline-PWA behavior locally, serve it over HTTP instead of opening the file directly:
```
python -m http.server 8000
```
then visit `http://localhost:8000/`.

## Updating the question data

The question bank lives in a separate project (`naseer2`) as the source of truth. To pull in updated content:

1. Edit/regenerate `naseer2/data/volume1.json` or `volume2.json`.
2. Run `naseer2/scripts/build_webapp_data.py` (using that project's Python environment) — it reads those JSON files and regenerates this repo's `data/*.data.js` files.
3. Bump `CACHE_VERSION` in `service-worker.js` (so visitors actually receive the new data, not a stale cached copy).
4. Commit and push `data/*.data.js` and `service-worker.js` from this repo. GitHub Pages redeploys automatically within about a minute of pushing to `main`.

## Project structure

```
index.html             entry point; all views render into <main id="view-root">
manifest.json           PWA manifest
service-worker.js       cache-first offline support
css/                    variables (book colour palette), base, components, per-view styles
js/                     router, localStorage-backed progress store, data lookup indexes, view modules
data/*.data.js          the question bank, generated -- do not hand-edit, regenerate instead
assets/icons/           app icons (placeholder, generated)
```

No bundler, no framework, no npm runtime dependency — plain HTML/CSS/JS, loaded via classic `<script>` tags (not ES modules, for reliable behavior under `file://`).

## Disclaimer

This is an unofficial, independently built study tool. Admission rules, eligibility, merit formulas and test dates change between cycles — always verify current information against the official NTU admissions portal before relying on it.
