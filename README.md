# UK Driving Licence Prep

A study aid for the UK DVSA theory and practical driving tests. This repo has two apps that share the same underlying content:

- **The mobile app** (this directory) — Ionic + Angular + Capacitor, targeting Android. This is the actively developed version.
- **[`web/`](web/)** — the original dependency-free HTML/CSS/JS single-page site. Kept as-is; see [`web/README.md`](web/README.md).

No login, no backend. Everything runs on-device.

## Running the mobile app

```bash
npm install
npm start          # ng serve — dev server at http://localhost:4200
npm run build       # production build to www/
```

### On Android

```bash
npm run android      # build + cap sync + open android/ in Android Studio
# or, individually:
npm run build
npx cap sync android
npx cap open android  # requires Android Studio + an Android SDK install
```

The `android/` folder is a real, committed native project (not just generated on demand) — open it directly in Android Studio if you'd rather not go through the CLI. Building and running on a device/emulator needs Android Studio and an SDK installed locally; that step wasn't possible to verify in the environment this was built in, but the web build, dark/light theming, and every feature flow were verified against a served build with Playwright, and the native project was scaffolded and synced without errors.

## What's in the app

Two tabs' worth of content from the original site, reorganised into five bottom tabs for a clearer "reading vs testing" split on mobile:

- **Home** — quick stats and shortcuts.
- **Study** — reading-mode theory categories (question *and* answer shown together, no score, no timer), the hazard perception explainer, Show Me Tell Me flashcards, and the practical test checklist.
- **Practice** — the scored category quiz and the timed 50-question mock test (57 minutes, 43/50 pass mark), reusing the same category-list UI as Study's reading mode in a different mode rather than duplicating it.
- **Centres** — search/filter over a small sample of real DVSA test centres.
- **Progress** — weakest-category breakdown, mock test history, and the light/dark/system theme picker.

Progress persists in `localStorage` (not the web version's `sessionStorage` — a mobile app closed and reopened should keep your progress, not wipe it).

## Content notes (carried over from the web app, still true here)

- **Theory questions are original**, written for this app to cover the same knowledge areas as the real test — not DVSA's official (copyrighted) question bank. Independently fact-checked and corrected against the Highway Code during development.
- **The hazard perception explainer hedges its numbers on purpose** (clip counts, pass marks) and points to gov.uk for the current figures rather than asserting them as fixed, since this app can't reproduce the real video-clip test.
- **The centre finder data is a small starting sample** compiled from public sources, not DVSA's live system — the road-type notes are this app's own general impression of each area, not official DVSA routes. Always verify on [gov.uk](https://www.gov.uk/browse/driving/learning-to-drive) before booking.

## Tech

- Angular 20 (standalone components, signals) + Ionic 8 + Capacitor 8, pinned to the exact versions requested.
- `src/theme/variables.scss` — a full custom light/dark Ionic colour palette (calm blue/green), toggled via ThemeService adding/removing the `.ion-palette-dark` class on `<html>` — resolves a `light` / `dark` / `system` user choice against a live `matchMedia` listener, and best-effort syncs the native status bar style under Capacitor.
- `public/assets/data/*.json` — the common data folder both apps' content is derived from (categories, questions, flashcards, centres, checklist). Add a row to the relevant JSON file and it shows up in the app; no code changes needed. See the JSON shape documented in [`web/README.md`](web/README.md#extending-it).
- `src/app/core/services/` — data loading (`TheoryDataService`, `PracticalDataService`), progress/state (`TheoryStatsService`, `PracticalStateService`), the timed mock test (`MockTestService`), theming, storage, haptics, and platform init. Pages read these as signals rather than holding their own copies of state.
- Routing: Ionic tabs with lazy-loaded standalone pages (`src/app/app.routes.ts` → `tabs/tabs.routes` per tab).
