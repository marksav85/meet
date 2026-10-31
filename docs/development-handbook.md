# Meet App — Development Handbook

## Document header

- **Audience:** Project owner and future maintainers
- **Purpose:** Preserve the verified implementation model and constraints for future development.
- **Status:** reference
- **Last updated:** 2026-10-29

## Project context

Meet is a portfolio application for discovering fictional technology events. Google
sign-in protects the event feed; the public demonstration Calendar is its data
source. Meet does not register attendees or maintain its own event database. The
production frontend and backend deployment have been reported complete, but live
service status was not independently checked during finalization Pass 1.

The project is a React 18 / JavaScript frontend built with Vite 8.3.4 and the Vite
PWA plugin, plus a separate Node.js 24 AWS Lambda backend exposed through API
Gateway. Cloudflare Pages hosts the static frontend. Keep these deployment and
dependency boundaries independent.

## Features and implementation map

- `src/App.jsx` coordinates sign-in state, event loading, error feedback, filters,
  the capped feed and analytics. It sorts upcoming events and limits the dataset to
  50 before filtering.
- `src/components/` contains the city search, category filter, event cards/list,
  theme control, alerts and lazy-loaded charts.
- `src/event-categories.js` parses one canonical `Category:` line from each event
  description. Missing, unknown or multiple markers do not assign a category.
- City and category filters apply to the event feed and charts. Event dates are
  presented in the viewer's local time zone.
- `src/auth.js` implements the browser OAuth transaction, bounded tab session,
  event retrieval, offline cache and sign-out behavior.
- `src/serviceWorkerRegistration.js`, `vite.config.mjs` and
  `public/manifest.json` implement installability and the static asset cache.

### Calendar category contract

Add exactly one canonical marker line to each Calendar event description:

```text
Category: Web Development
Category: AI & Emerging Tech
Category: UX & Creative Tech
Category: Cloud & DevOps
Category: Gaming & Interactive
Category: Startups & Networking
```

The parser tolerates case and surrounding whitespace, CRLF, common Calendar HTML
breaks and `&amp;`. It does not infer categories from titles. Missing, unknown or
multiple markers leave an event unclassified; it remains visible in the feed and
under All Categories but is omitted from category-specific counts.

## Architecture and data flow

```text
Browser (React/Vite static app)
  ├─ Google OAuth authorization and callback
  └─ HTTPS API Gateway → AWS Lambda → Google OAuth / Calendar API
```

The frontend starts OAuth only after an explicit user action. Lambda exposes
`POST /api/get-auth-url`, `POST /api/token` and `GET /api/get-events`. The backend
uses request-scoped Google OAuth clients, validates exact allowed callbacks/origins
and returns sanitized errors. Calendar requests use the public read-only events
scope. The API contract and browser security details are maintained in
[`AUTHENTICATION.md`](../AUTHENTICATION.md).

The backend asks Calendar for upcoming expanded occurrences in start-time order.
The frontend normalizes records, sorts them, caps the feed at 50 and then applies
city/category filters. Category charts use the filtered events; category metadata
comes from description markers rather than event titles.

## Authentication and data boundaries

The browser generates random state and an S256 PKCE verifier/challenge. It stores a
single-use, ten-minute authorization transaction in `sessionStorage`, consumes it
before code exchange and removes callback parameters from browser history. Only a
short-lived access token and absolute expiry are kept in the tab session; no refresh
token is requested. The token is JavaScript-readable, so XSS remains a documented
risk.

`lastEvents` and the explicit theme preference use `localStorage`; cached events do
not establish authentication. The worker precaches static assets only and does not
cache API/OAuth responses. Sign-out and rejected/expired credentials clear the
protected event state and cache. See [`AUTHENTICATION.md`](../AUTHENTICATION.md) for
the full contract.

The production worker skips waiting and cleans outdated precaches but does not take
control of active pages or force a reload during PKCE. Callback URLs containing
`code`, `state` or `error` bypass shell fallback. Development unregisters its own
worker scope. Detailed cache recovery guidance is in the
[`Operations Runbook`](operations-runbook.md).

## Engineering decisions and constraints

- Keep the frontend JavaScript/Vite app and the independent Lambda backend; their
  package manifests and lockfiles are separate.
- Keep charts lazy-loaded to reduce the initial interface/authentication bundle.
- Frontend `VITE_*` values are public build inputs. Private Google credentials and
  calendar configuration belong only in backend deployment settings.
- Build guards require explicit production OAuth mode, a `/prod` API URL and an
  exact HTTPS root callback. Backend wrappers allow only `localtest` and `prod`;
  these local guards are not cloud IAM controls.

## Development and verification

Use Node.js 24. The [`Operations Runbook`](operations-runbook.md) describes local
setup, browser testing, configuration and production build inputs. The independent
backend checks and guarded operations are in
[`auth-server/README.md`](../auth-server/README.md).

Frontend Jest uses jsdom, React Testing Library and Gherkin scenarios; a separate
Puppeteer suite exercises the local mock app while blocking external requests.
Backend Node tests use fake SDK transports, while the config scripts inspect local
source only. None of these automated checks proves the current live OAuth/Calendar
integration.

Pass 1 recorded 164 frontend Jest tests across 17 suites, 80 backend tests, passing
offline backend configuration checks and a successful Vite/PWA build. These are
prior-pass results, not tests rerun during later documentation work. On 29 October
2026, the Puppeteer suite passed all 16 executable cases in one suite using Chrome
for Testing 148.0.7778.97, matching Puppeteer 24.43.1, against the local Vite server
at `http://localhost:3000/` in mock mode. The first attempt was blocked by a
sandbox-related Chrome launch restriction; an authorized retry passed without
application or test changes. The browser tests used local fixtures and did not
exercise production Google OAuth, Calendar or AWS services. Those services were
not independently tested during Pass 1. Dependency audits were inconclusive because
`registry.npmjs.org` could not be resolved; no fresh audit was performed.

An earlier pre-release guide recorded 176 frontend tests (161 unit/component/Gherkin
and 15 browser), zero production audit findings, and 23 moderate/eight high
development findings. Those counts are historical and were not reproduced in Pass 1;
the later audit attempt could not reach the registry. The earlier Puppeteer 25 ESM
compatibility note also predates the current Puppeteer 24.43.1 manifest pin.

## Limitations and future work

- The reported production deployment and current Cloudflare/AWS/Google dashboard
  state still require an authorized live verification.
- No external monitoring service is configured in source. API Gateway request
  logging is disabled in `serverless.yml`; Lambda log retention is configured for
  14 days. Confirm deployed settings in the relevant dashboards.
- If desired, repeat dependency audits when registry access is available. This is
  optional follow-up; do not treat historical audit counts above as current findings.
- Do not add frameworks, dependencies, features or modernization work solely to
  close this retrospective finalization.

## Evidence and references

- Application entry and flow: `src/index.jsx`, `src/App.jsx`, `src/auth.js`
- Backend routes and error handling: `auth-server/handler.js`
- Frontend build/PWA configuration: `vite.config.mjs`,
  `scripts/check-frontend-build.cjs`
- Backend stage/deployment guards: `auth-server/serverless.yml`,
  `auth-server/scripts/`
- Public overview: [`README.md`](../README.md)
- Operations: [`operations runbook`](operations-runbook.md)
