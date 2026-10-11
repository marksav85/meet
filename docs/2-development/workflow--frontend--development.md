# Meet frontend development

## Document Header

- **Audience:** Developers and Codex
- **Purpose:** Run and verify the React frontend after the bounded CRA-to-Vite migration.
- **Status:** reference
- **Authority:** Project owner's frontend modernization request; local verification.
- **Last updated:** 2026-10-11

## Setup and commands

Use Node.js 24 (verified with 24.21.0) and npm. Run `npm ci` from the root;
the backend has its own package and lockfile. Then:

```sh
npm start
npm test
npm run test:browser # keep the mock development server running
npm run build
npm run preview
```

Development is exactly `http://localhost:3000/` with a strict port. Mock mode is
the localhost default. Preview uses `http://localhost:4173/` to keep production
service workers separate from the OAuth development origin. Close an occupied
port's server explicitly; Vite does not silently choose another callback port.
Production output is `dist/`, with base `/`, ready for eventual root-path hosting.
No deployment command or Cloudflare configuration was added. The existing
GitHub Pages deployment and AWS `/dev` resources remain unchanged. The new root
build is not a drop-in `/meet/` deployment; production cutover remains a separate,
coordinated frontend/backend/callback task.

Vite 8.3.4, React plugin 6.1.2 and vite-plugin-pwa 2.0.0 replace CRA. React and
React DOM remain 18.2.0. JSX-bearing application files use `.jsx`; their component
contents, styling and genre categories are unchanged. Jest 30.5.2 with Babel
retains the existing tests and Gherkin intent. The test-only Babel transform maps
`import.meta.env` to the test process environment; an actual Vite build separately
verified public environment replacement. Test discovery remains inside `src/`.
Vite watches exclude Playbook; its reference files are not runtime imports.
The production build no longer supplies CRA's implicit ESLint checks. There is
currently no standalone lint command; the build must not be reported as lint.

## Public OAuth configuration

Copy `.env.example` to ignored `.env.development.local` and set:

```dotenv
VITE_DATA_MODE=oauth
VITE_API_BASE_URL=https://npecrd9ykd.execute-api.eu-central-1.amazonaws.com/localtest
VITE_OAUTH_REDIRECT_URI=http://localhost:3000/
```

Restart Vite after changing variables. Vite embeds these **public** values; never
put client secrets, access tokens, AWS keys or backend credential files here.
Existing `REACT_APP_*` overrides must be manually renamed to `VITE_*`; unrelated
local environment files were preserved. Force `VITE_DATA_MODE=mock npm start`
for browser regression tests if local OAuth overrides are present.

Non-local legacy defaults were retained to avoid silently switching production
APIs. They still refer to the original GitHub Pages callback and old `/dev` API;
these are not a compatible new production deployment. A future root-hosted OAuth
build must explicitly configure its approved production API and exact callback.
No testing deployment URL was added to runtime source. Missing local OAuth API
configuration fails closed before network access.

The state/S256 PKCE flow, session-bound single-use transaction, memory-only token,
POST exchange, bearer Calendar requests, safe errors and reauthorization remain
unchanged except environment access. The owner reports successful live OAuth and
Calendar testing of the isolated backend. This migration did not repeat live
verification. The new demonstration calendar is being populated separately.

## Offline and service worker behavior

The established Vite PWA plugin generates `service-worker.js` and precaches the
shell, versioned JS/CSS, manifest and icons. Event data continues using the existing
non-sensitive `lastEvents` cache. No external API runtime caching is configured.
OAuth URLs containing `code`, `state` or `error` bypass navigation fallback; an
offline callback fails at the network rather than replaying a cached callback.
Tokens, authenticated responses and authorization URLs are not cached.

Development does not register a worker and unregisters a worker at its own base
scope if one is found. Preview has a separate origin/port. If a legacy worker
already controls localhost:3000 and serves an old CRA page before Vite can load,
clear that origin's worker/site cache once in browser developer tools. Avoid
clearing session storage during an active authorization transaction.

Production registration bypasses the HTTP worker cache and requests updates.
New workers skip waiting and remove outdated precaches; they do not claim active
pages or trigger reloads, so updates cannot interrupt callback consumption or
PKCE exchange. The next navigation uses the new worker; already-open pages keep
their loaded application until navigation. Before a future deployment, configure
hosting to revalidate HTML and `service-worker.js` and use immutable caching only
for hashed assets. No such deployment or server configuration was performed.
Installability across devices and hosting-specific headers remain future live
checks; no Lighthouse result is claimed.

## Migration verification and remaining findings

- 91 unit/component/Gherkin tests passed (the original 88 plus three environment checks).
- Nine external-network-blocked mock browser tests passed.
- Root-path production build passed: JS 626.26 kB / 169.58 kB gzip; Vite reports
  its standard >500 kB chunk warning. Splitting the chart bundle is deferred.
- Separate public `localtest` OAuth build passed and embedded the intended API
  and localhost callback, without a login or cloud request.
- Production Chromium smoke check confirmed worker control, offline shell and
  32 fixture events, no authentication cache entries and callback bypass.
  Development had no registered worker. These were local smoke checks, not added
  claims of cross-browser PWA coverage.
- Playbook pin check and `git diff --check` passed. Backend and Playbook files
  were not changed; backend tests were not rerun for this frontend-only task.
- Atatus package, initialization/key and all runtime references were removed.
  Unused CRA Web Vitals, direct Workbox packages, Babel workarounds and gh-pages
  publishing scripts/package were removed. PWA's supported Workbox dependency
  now supplies the generated worker.

At the initial Vite migration, non-modifying `npm audit` reported **45 dependency findings**: three low,
27 moderate, 13 high and two critical. The critical development findings are
`form-data` through Jest's jsdom tree and `protobufjs` through retained
jest-cucumber/Gherkin. Puppeteer 18 and legacy Gherkin/Jest transitive packages
also contribute findings. The initial production-only audit reported **two findings**:
moderate `@babel/runtime` and high `lodash`, both reachable through retained
Recharts 2.8 dependencies. Advisory counts are not proof that the application
executes the affected APIs. No forced audit fix or unrelated upgrade was run.
A separately scoped dependency maintenance pass should review and remediate
these findings before production cutover, including browser tooling and chart
compatibility. The initial migration intentionally retained React/testing/chart versions; the focused cleanup below supersedes that dependency state.

Essential Playbook execution/setup and documentation naming/metadata guidance
were consulted. Historical phase reports and AI context artifacts were preserved;
no full planning/audit workflow or artifact regeneration was started. The AI
source snapshots still describe the earlier frontend and need a deliberate
refresh when the next handoff requires them.

References: [Vite setup](https://vite.dev/guide/),
[Vite PWA registration](https://vite-pwa-org.netlify.app/guide/register-service-worker),
[Vite PWA worker update behavior](https://vite-pwa-org.netlify.app/guide/auto-update).

## Focused dependency cleanup (2026-10-11)

Recharts is now 3.10.1 with React-compatible `react-is` 18.2.0; React remains
18.2.0. Recharts removes the old production Lodash/runtime dependency chain.
The only chart adaptation is `itemSorter={null}` on the genre legend, preserving
its existing category order. Browser assertions now also check that order.
The data, colors and genre categories are unchanged. See the official
[Recharts migration guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide).

jest-cucumber 4.5.0 removes the obsolete Jest 26/Gherkin/protobufjs chain while
retaining the feature definitions. Explicit jsdom 26.1.0 aligns Jest 30's wildcard
peer with its supported DOM version instead of the old hoisted jsdom 16.
Compatible transitive updates include Babel runtime 7.29.10 and Lodash 4.18.1;
no forced fixes, broad overrides or test-framework migration were used.

Puppeteer is pinned to 24.43.1 with matching Chrome 148. Its CommonJS driver
passes the full browser suite without changing test assertions or adding ESM
flags. Browser tests now use a separate Node environment so the WebSocket driver
is not resolved to jsdom's browser implementation. Unit tests retain jsdom/Babel.

Puppeteer 25 was assessed but not retained: 25.13.0's matching Chrome download
failed; 25.12.0's Chrome downloaded and an isolated test passed, but the full suite
stalled under Jest's experimental ESM loader. Addressing that reliably is deferred
rather than broadening the task into an ESM test-runner migration. No experimental
VM flag or intermediate Puppeteer 25 dependency remains in the final setup.
See [Jest ESM support](https://jestjs.io/docs/ecmascript-modules) and
[Puppeteer installation](https://pptr.dev/guides/installation).
Normal `npm ci` downloads matching Chrome through Puppeteer's install script.
If install scripts were disabled, run `npx puppeteer browsers install chrome`
using the installed package. This cleanup's browser cache was isolated under
`/tmp/meet-clean-puppeteer`, selected with `PUPPETEER_CACHE_DIR` during verification.

Final audits report **zero production findings** and **31 development findings**:
23 moderate and eight high, with zero low/critical findings. This improves the
initial 45 findings (three low, 27 moderate, 13 high, two critical). Both critical
advisories were removed. Moderate advisory roots remain in `sprintf-js` through
Jest/Babel coverage's js-yaml 3/argparse chain and `uuid` 10 through
jest-cucumber/Gherkin. High advisory roots remain in `basic-ftp` and `extract-zip`
through Puppeteer's browser-download/proxy dependencies. npm counts affected
parent packages too; these counts are not 31 independent advisory roots.

Compatible range refreshes cannot remove these remaining advisories. Audit's
suggested jest-cucumber downgrade is not a safe remediation and was not applied.
Puppeteer 25 removed its high findings, but its full-suite compatibility issue
prevented retention. Leave these for upstream fixes or a separately scoped
coverage/Gherkin/ESM browser-tool review rather than forcing transitive overrides.

All **100 frontend tests passed**: 91 unit/component/Gherkin and nine mocked
external-network-blocked browser tests, including real chart SVGs, count/filter
updates, tooltips and the preserved legend category order. `git diff --check`
passed. No functionality, chart categories or styling were rewritten.

The production Vite/PWA build passes, with JS 578.45 kB / 162.58 kB gzip.
The >500 kB chunk warning remains. Backend, OAuth and PWA implementation, Playbook
pin and unrelated local migration work are preserved. No deployment, live OAuth,
calendar changes, commit or push occurred.

## Calendar event categories

Category names and chart colors are centralized in `src/event-categories.js`.
For each upcoming Google Calendar event, include **exactly one** of these lines
in its description, on its own line (choose the event's category):

```text
Category: Web Development
Category: AI & Emerging Tech
Category: UX & Creative Tech
Category: Cloud & DevOps
Category: Gaming & Interactive
Category: Startups & Networking
```

Do not paste all six lines into one event. For example:

```text
Category: AI & Emerging Tech

A practical workshop exploring responsible AI applications.
```

Use these canonical spellings for calendar authoring. The parser tolerates case,
surrounding whitespace, CRLF, common Calendar HTML line breaks and `&amp;`.
Missing, unknown or multiple category markers leave the event uncategorized;
it remains visible in the event list and city chart but contributes no pie slice.
Pie percentages apply to categorized events only. Category assignment does not
infer titles or change API contracts, city filtering or event-count limits.

Existing React/JavaScript mock fixtures receive an explicit Web Development
marker at export, retaining their original titles and description text. No live
calendar entries were changed. No category-filter UI or redesign was introduced.

Category verification: 111 unit/component/Gherkin tests and nine mock browser
tests passed (120 total), including extraction, unknown/ambiguous markers,
category counts and chart updates. Production Vite/PWA build and
`git diff --check` passed; the existing >500 kB chunk warning remains.
