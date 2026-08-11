# UK Driving Licence Prep

A single-page study aid for the UK DVSA theory and practical driving tests. No login, no backend, no build step — open `index.html` and go.

## Running it

There's no build process. Either:

- Open `index.html` directly in a browser, or
- Serve the folder with any static file server, e.g. `python3 -m http.server` from this directory, then visit `http://localhost:8000`.

All state (quiz scores, checklist ticks, flashcard ratings) is kept in the browser's `sessionStorage` — it lives only in the current browser tab and is cleared when that tab closes. There's no account and nothing is sent anywhere.

## What's in it

**Theory Test Prep**
- *Practice by Category* — 158 original multiple-choice questions across the 13 DVSA theory categories, 10 at a time with instant feedback and explanations.
- *Mock Test* — a timed 50-question test drawn across all categories, mirroring the real format (57-minute limit, 43/50 pass mark, flag-for-review navigator, no feedback until you submit).
- *My Progress* — aggregates every answer from both modes into a weakest-category breakdown and mock test history.
- *Hazard Perception* — a written and diagram-based explainer of the skill the real (video-based) test measures, since this app can't generate video clips.

**Practical Test & Centre Finder**
- *Requirements Checklist* — what the test involves, grouped in the order it happens, with a persisted progress tracker.
- *Show Me, Tell Me* — a flip-card quiz over the 20 vehicle safety questions, with an optional "known / still learning" self-rating.
- *Centre Finder* — a searchable, filterable sample of real DVSA test centres (7 London, 6 Greater Manchester).

## Important content notes

- **The theory questions are original**, written for this app to cover the same knowledge areas as the real test — they are not DVSA's official question bank, which is copyrighted. The Highway Code and gov.uk remain the authoritative source.
- **The hazard perception explainer hedges its numbers on purpose.** Clip counts and pass marks can change; it points to gov.uk for the current figures rather than asserting them as fixed.
- **The centre finder data is a small starting sample**, compiled from public sources rather than DVSA's live system, and the road-type notes (roundabouts, dual carriageway, etc.) are this app's own general impression of each area — not official DVSA routes. DVSA doesn't publish official test routes, and the actual route depends on the examiner and the day. Always verify centre details and book on [gov.uk](https://www.gov.uk/browse/driving/learning-to-drive) directly.

## Extending it

Everything content-related lives under `js/data/`, as plain arrays — add an entry and it's picked up automatically, no other code changes needed:

- `questions.js` — theory questions (`{ id, category, question, options[4], correctIndex, explanation }`). A category id must exist in the `CATEGORIES` array in the same file. A small self-check at the bottom of the file warns in the console if an id collides, a category reference is wrong, or a category has very few questions.
- `showMeTellMe.js` — flashcards (`{ id, type: "tell-me" | "show-me", question, answer }`).
- `testCentres.js` — test centres (`{ id, name, region, town, postcode, address, roadFeatures[], notes }`). The region filter dropdown is generated from whatever regions appear in the data.
- `practicalChecklist.js` — checklist sections and items.

## Structure

Plain HTML/CSS/JS, no framework or bundler — scripts are loaded in dependency order as classic `<script>` tags (see the bottom of `index.html`) and communicate through two small namespace objects, `TheoryApp` and `PracticalApp`, that each feature file registers an `init()` callback with. `js/util.js` and `js/storage.js` hold shared helpers (shuffling, formatting, a sessionStorage wrapper) used across features.
