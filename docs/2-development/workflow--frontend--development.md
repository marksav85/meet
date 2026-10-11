# Frontend development

## Document Header

- **Audience:** Developers and Codex
- **Purpose:** Run the frontend, configure local OAuth and author event categories.
- **Status:** reference
- **Last updated:** 2026-10-12

React 18 / JavaScript uses Vite **8.3.4** and Vite PWA. Use Node.js 24:

```sh
npm ci
npm start
npm test
npm run test:browser # keep the mock development server running
npm run build
npm run preview
```

Development is exactly **http://localhost:3000/**; an occupied port fails rather
than changing the callback. Localhost defaults to mock mode. For regression tests,
force `VITE_DATA_MODE=mock npm start` if local OAuth overrides exist. Preview uses
localhost:4173 to separate production workers from the development origin.
Build output is `dist/` with base `/`, ready for future root-path hosting; it is
not a drop-in GitHub Pages `/meet/` deployment. No deployment command is supplied.

Jest uses jsdom for components and a separate Node environment for Puppeteer browser
tests, which block external requests. Normal npm installation downloads matching
Chrome; if scripts were disabled, use the installed package's
`npx puppeteer browsers install chrome`. Last verification passed **120 frontend
tests** (111 unit/component/Gherkin and nine browser). The production audit had zero
findings; 23 moderate/eight high development findings remain in coverage/Gherkin
and browser-download dependencies. Puppeteer 25's full-suite ESM compatibility
problem remains deferred. The build passes with a >500 kB chunk warning.
No standalone lint command exists; Vite build is not lint verification.

## Public local OAuth configuration

Copy `.env.example` to ignored `.env.development.local`:

```dotenv
VITE_DATA_MODE=oauth
VITE_API_BASE_URL=https://npecrd9ykd.execute-api.eu-central-1.amazonaws.com/localtest
VITE_OAUTH_REDIRECT_URI=http://localhost:3000/
```

Restart Vite after changes. These values are public and bundled: never add client
secrets, AWS keys or tokens. Legacy `REACT_APP_*` overrides must use `VITE_*` names.
Non-local defaults still reference the legacy API/callback; future production must
explicitly select a compatible API and approved root-host callback. The owner has
verified isolated live integration; automated tests remain mocked. See
[authentication](../../AUTHENTICATION.md) and [backend maintenance](../../auth-server/README.md).

## PWA and offline behavior

Vite PWA precaches shell/static assets; existing `lastEvents` preserves non-sensitive
event data. There is no external API runtime caching. Callback URLs carrying
`code`, `state` or `error` bypass shell fallback. Authentication responses/tokens
are never cached. New production workers skip waiting and clean old precaches but
do not claim active pages or force reloads during PKCE; next navigation uses updates.

Development registers no worker and unregisters its own scope if found. If an old
worker serves a legacy page before Vite loads, clear that origin's worker/cache once;
do not clear session storage during authorization. Future hosting should revalidate
HTML/worker files and cache only hashed assets immutably. Hosting/installability
checks remain pending; no current Lighthouse claim is made.

## Calendar category markers

Definitions/colors live in `src/event-categories.js`. Add **exactly one** of these
lines on its own line in each event description:

```text
Category: Web Development
Category: AI & Emerging Tech
Category: UX & Creative Tech
Category: Cloud & DevOps
Category: Gaming & Interactive
Category: Startups & Networking
```

Choose one, not all six; put ordinary description text on subsequent lines.
Use canonical spelling. Parsing tolerates case/whitespace, CRLF, common Calendar
HTML breaks and `&amp;`. Missing, unknown or multiple markers leave events out of
the pie, while preserving their list/city-chart visibility. Percentages cover only
categorized events; titles are not inferred. Existing mocks explicitly use Web
Development. Category-filter UI belongs to the pending redesign.
