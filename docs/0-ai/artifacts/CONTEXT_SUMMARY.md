---
artifactId: CONTEXT_SUMMARY
packId: "2026-10-11T14:19:37Z"
generatedAt: "2026-10-11T14:19:37Z"
generator: "prompt--artifact--generate-context-summary.md"
---

# Meet App — repository context after Phase 7B.1 preparation

## Purpose, framework and routing
Meet is a JavaScript React 18 event-discovery portfolio PWA: city filtering,
expandable event details, valid event-count selection and city/genre charts.
CRA 5 is still the frontend toolchain. One view mounts through src/index.js and
src/App.js under React.StrictMode, without Next.js or a route library.
SRC_TREE covers 15 production JS files and 3 directories under src/; tests,
helpers, mocks/static data/assets are excluded, with empty directories retained.
The canonical tree/snapshot schema is frontend-only; backend inventory is in
the Library companion and backend workflow/review documentation.

## Architecture
App owns event loading/retry/auth messages, selected city/count and connectivity;
hooks derive filters locally and discard stale request completions. Optional
fields normalize safely; dates use starts/all-day dates. Components under
src/components include CitySearch, NumberOfEvents, EventList/Event, both charts,
Alert classes and EventErrorBoundary. Phase 5 repaired count/filter/date/chart
and error behaviors. src/api.js delegates to injectable src/auth.js and uses
separate local mock data. The snapshot includes App, its shared components and
core API/auth utilities as exact text, not runnable TypeScript.

## Backend and Phase 7A implemented locally
Independent auth-server CommonJS package now pins googleapis 185.0.0 and
Serverless 4.43.0 as a dev dependency, with an updated lockfile. Engines require
Node >=24 <25; .nvmrc declares 24. Serverless YAML targets nodejs24.x in
eu-central-1. Tests/build ran on Node 24.21.0/npm 11.19.0. Handler.js is unchanged:
getAuthURL/getAccessToken/getCalendarEvents preserve Phase 6 secure contracts.
Local stage map permits only localtest; packaging wrapper requires explicit
--stage localtest and exposes no deployment operation. Legacy dev is excluded.
Credentials now resolve from backend deployment environment names rather than
reading local credential files. No actual credentials were read or provisioned.
esbuild is disabled; classic package inputs allow handler and production modules,
excluding service secrets/tests/docs/scripts and dependency declarations/maps.
API Gateway logging is disabled and Lambda log retention configured for 14 days;
final generated IAM/CloudFormation remains unverified.

## OAuth and Calendar security
Lambda generates Google's authorization URL. POST /api/get-auth-url uses
state/redirect/challenge; POST /api/token uses code/redirect/verifier;
GET /api/get-events carries Authorization bearer. Calendar v3 retrieves ordered
upcoming single events using public-readonly scope; no token-info query remains.
Browser state is cryptographic 256-bit, single-use and bound to a 10-minute
session transaction with S256 PKCE. Consume-before-exchange rejects replay,
missing/mismatched/expired/duplicate callbacks. Tokens remain in memory; session
storage contains only transaction/status continuity. No persistent refresh tokens
are requested/returned/stored, and legacy persistent access tokens are removed.
Callback parameters are promptly replaced; expiry/401/denial require explicit
reauthorization. Backend validates JSON/methods/bearer and trusted redirect/origin
allowlists, handles OPTIONS, uses request-scoped clients and sanitized errors.

## Configuration and PWA
Public frontend variables remain REACT_APP_DATA_MODE, REACT_APP_API_BASE_URL,
REACT_APP_OAUTH_REDIRECT_URI. Localhost defaults to mocks. Future isolated OAuth
callback is http://localhost:3000/; production callback remains
https://marksav85.github.io/meet/. Backend CLIENT_ID/CLIENT_SECRET/CALENDAR_ID
are required environment names; OAUTH_REDIRECT_URIS is a trusted explicit array.
No secret values belong in frontend variables or artifacts. Requests use
no-store/no-referrer. Atatus remains installed and runs only in mock mode without
callbacks; removal is planned. Workbox precaches shell/navigation and same-origin
images, not auth API responses. Non-sensitive lastEvents offline cache retains
safe parsing. Manifest/icons/registration support PWA installation, but current
Lighthouse/installability and historical IE11/90% coverage goals are unverified.

## Fresh Phase 7B.1 verification versus historical/live evidence
Fresh local results: 52 backend tests (46 handler + 3 real SDK fake-transport +
3 config/guard); 88 frontend component/Gherkin tests; 9 mock browser tests;
successful frontend production build. Tests use Node runner, CRA Jest/RTL,
jest-cucumber and Puppeteer, with SDK/network/navigation replacements and
external browser request blocking. Repeated SDK tests also pass against trimmed
production rehearsal dependencies. Phase 7A audit historically fell from 6 entries to zero; no new audit ran in 7B.1.
Phase 6 historically recorded 97 frontend/41 backend tests and successful build;
subsequent integration historically recorded 88 unit/Gherkin/41 backend/build.

Official Serverless packaging/config/template validation was not executed:
v4 requires vendor authentication and AWS credentials; packaging may write S3/SSM. Postinstall
was skipped; its vendor binary/embedded dependency inventory was not downloaded
or audited. No account/terms/Dashboard or AWS/Google operation occurred. An
isolated production-only ZIP rehearsal contains 1,860 files, 8,816,951 compressed
and 62,522,833 uncompressed bytes; it is not an official deployment artifact.
Runtime JS/JSON/licenses are retained; type/maps removal avoids SDK size pressure.
Phase 7A accessed npm/advisories; 7B.1 uses official docs and installed offline tools.
Google consent, real PKCE exchange, API Gateway resolution, permissions and
account publishing remain unverified. The existing live /dev uses old API
contracts per project records; no live configuration was inspected or modified.
The secure local contracts remain incompatible: do not deploy frontend alone.

## Checkpoints and documentation
Phase 5: 3888770; Phase 6: eb561aa; submodule: 010d714;
workflow/context integration: 8c6cd7e; Phase 7A: 6289ae6 (current HEAD on main).
Phase 7B.1 documentation is uncommitted; source/config/dependencies are unchanged.
Playbook remains pinned at 162a9d832acd73c9cb105ad5a5bc16b8135fb6ce.
Project execution plan, progress logs 001/002 and Phase 7A/7B.1 reviews record the
bounded adoption and validation; no retrospective full lifecycle approval is
invented. Root AGENTS routes to canonical Playbook guidance. Historical Phase
5 standalone report and older root-doc naming remain gaps; no completed code
was automatically rewritten.

## Remaining work and constraints
Phase 7A is committed; Phase 7B.1 offline preparation is complete. The report at
docs/2-development/review--testing--phase-7b-1.md supplies manual setup, configuration
matrix, expected localtest resources, cost/security review and 7B.2 checklist.
Official package/template verification and live integration remain blocked pending
owner authorization, vendor eligibility/auth, AWS identity/permissions/storage and
development Google client. v4 regional S3/SSM storage may be shared, so packaging
is not guaranteed read-only. A second client shares the existing project's production
audience; keep its publishing status and production client unchanged.
localtest must explicitly allow only ["http://localhost:3000/"] and use development
client credentials. Configure only a separate localhost frontend session with the
actual future localtest URL. Protect resolved templates/state as secret-bearing.
Untracked AWS export files are preserved and credential contents not inspected.
Current /dev stays intact; no frontend-only deployment of incompatible contracts.
7B.2 deployment/live OAuth, Vite/Atatus/UI/Cloudflare and backend lint/format remain
future work. Legacy frontend dependency/deprecation warnings are retained.
No source/config/dependencies, live infrastructure, Playbook, commit/push or account
terms changed in preparation. Library upload remains pending; manifest anchors
freshness/integrity. Source tree/snapshot are verified unchanged, not regenerated.
