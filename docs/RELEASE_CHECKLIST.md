# Release Checklist

Use this checklist before tagging a production release.

## 1. Code quality gates

- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## 2. Functional verification

- Verify all three modes: Continent, Marathon, Survival.
- Verify sequential order runs north-to-south in each continent.
- Verify survival timing per continent and timeout behavior.
- Verify end-of-session overlays (correct/missed summaries).
- Verify map highlights:
  - green for correct/wrong-guessed countries in survival summary
  - red for missed target countries

## 3. API and data checks

- `GET /api/countries` returns countries, continents, and stats.
- `POST /api/session` accepts and sanitizes session payloads.
- `GET /api/session` and `GET /api/session/:id` behave as expected.
- `GET/POST /api/admin/aliases` can read/write alias overrides.
- Validate rate-limiting responses (`429`) for abuse scenarios.

## 4. Security checks

- Confirm CSP and security headers are present.
- Confirm HTTPS redirect behavior in production environment.
- Confirm input sanitization and XSS-safe rendering paths.
- Confirm CORS behavior is intentional for public API routes.

## 5. Performance and UX

- Lighthouse (mobile + desktop) >= 90 on Performance/Best Practices/SEO/Accessibility.
- First load remains smooth; map interactions are responsive.
- No visual regressions on mobile/tablet/desktop breakpoints.
- Keyboard navigation and focus indicators work across core flows.

## 6. PWA/offline sanity

- Production build registers service worker successfully.
- Offline fallback page loads when network is unavailable.
- Development mode does not keep stale service workers/chunk cache.

## 7. Deployment readiness

- Docker image builds and runs:
  - `docker build -t geographic-challenge .`
  - `docker run -p 3000:3000 geographic-challenge`
- CI pipeline passes on clean clone.
- `.env` and secrets are set in deployment environment.
- Monitoring hooks configured (error/performance analytics if enabled).

## 8. Release notes

- Summarize user-facing changes.
- Note breaking changes (if any).
- Link migration notes or operational steps (if any).
