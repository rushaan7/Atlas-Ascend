# Atlas Ascend

Atlas Ascend is a production-style interactive geography game inspired by Sporcle and Worldle. It uses an animated map workflow and robust guessing logic to help users identify countries and territories.

## Tech stack

- Next.js + React + TypeScript
- Tailwind CSS design system
- Leaflet + vector GeoJSON boundaries
- Zustand state management with persistence
- RESTful API routes with error contracts and rate limiting
- Jest + React Testing Library
- Docker + GitHub Actions CI pipeline

## Key features

- Three game modes:
  - Continent (practice)
  - Guess All Marathon (persistent progress)
  - Survival (one chance, timed by continent)
- Fuzzy guess matching + autocorrect suggestions
- North-to-south sequential order for continent runs
- Skip/reveal controls with keyboard shortcuts (disabled in survival)
- Animated map zoom to the active target
- Persistent marathon progress across sessions
- Settings panel (timer, contrast, sound), stats panel, toasts
- End-of-run overlays with missed/correct summaries
- Offline support via service worker + PWA manifest
- Admin dashboard for alias/content updates (`/admin`)

## Local development

1. Install dependencies:
   `npm ci`
2. Run development server:
   `npm run dev`
3. Open:
   `http://localhost:3000`
4. If an old browser service worker causes stale behavior, hard refresh once (`Ctrl+Shift+R`).

## Tests

- Run all tests:
  `npm run test`
- Coverage:
  `npm run test:coverage`

## Docker

- Build:
  `docker build -t geographic-challenge .`
- Run:
  `docker run -p 3000:3000 geographic-challenge`

## API overview

- `GET /api/countries`
- `GET /api/session`
- `POST /api/session`
- `GET /api/session/:id`
- `DELETE /api/session/:id`
- `GET /api/admin/aliases`
- `POST /api/admin/aliases`

## Quality gates

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

See docs in [`docs/API.md`](docs/API.md), [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md), and [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md).
