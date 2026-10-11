---
artifactId: CONTEXT_SUMMARY
packId: "2026-10-11T12:00:32Z"
generatedAt: "2026-10-11T12:00:32Z"
generator: "prompt--artifact--generate-context-summary.md"
---

# Meet App — repository context

## Purpose and project type
Meet is a JavaScript React 18 event-discovery portfolio PWA. It filters Google
Calendar events by city, toggles details, limits event counts and displays city
and genre charts. Local development defaults to mock events. CRA 5 remains the
frontend toolchain; no Vite migration or TypeScript adoption has occurred.

## Routing and source scope
One application view, no route library, Next.js router or filesystem page tree.
`src/index.js` mounts App in React.StrictMode; `src/App.js` is the view/container.
SRC_TREE inventories 15 production JavaScript files in 3 directories under
`src/`. It excludes tests/helpers/mocks/assets; empty test/feature directories
remain structural entries. Source snapshot contains selected view/components
and auth utilities. Backend inventory is in the Library handoff companion,
because the canonical source-tree/snapshot schemas explicitly cover only src/.

## Component architecture
`src/components/` contains CitySearch, NumberOfEvents, EventList/Event,
CityEventsChart, EventGenresChart, Alert classes and EventErrorBoundary.
App owns loaded events, loading/retry/auth messages, selected city and count;
filters derive locally via hooks. Fetches clean up stale completions. Events
normalize optional fields; dates use event starts with all-day handling.
Charts receive derived event collections. Functional repairs preserve valid
counts and isolate rendering failures with a retry boundary.

## Frontend and backend integration
`src/api.js` is a facade over injectable `src/auth.js`; mock fixtures are separate.
The independent `auth-server/` CommonJS package uses googleapis ^110.0.0.
Its handler.js exports getAuthURL, getAccessToken and getCalendarEvents.
Serverless configuration declares AWS Lambda nodejs18.x, eu-central-1,
Framework 3 and API Gateway HTTP events. These local settings are unchanged;
no live runtime/stage/configuration was inspected during this artifact run.
The local secure contracts are POST /api/get-auth-url with state/redirect/challenge,
POST /api/token with code/redirect/verifier and GET /api/get-events with bearer
header. Lambda generates Google's URL and retrieves ordered upcoming single
Calendar events with public-readonly scope. Google detects invalid/expired tokens;
the former separate token-info query is removed.

## Authentication security implemented locally
256-bit random state and S256 PKCE bind a 10-minute single-use session transaction.
State is consumed before exchange; missing/mismatched/expired/duplicate/replayed
callbacks fail closed. Access tokens live in memory; only transaction/status
continuity uses sessionStorage. No refresh tokens are requested/returned/stored;
legacy localStorage tokens are deleted. Callback query parameters are promptly
removed with history.replaceState. Expiry/401/denial require explicit controlled
reauthorization rather than repeated redirects. Backend validates methods,
JSON, exact allowlisted redirects/origins and bearer headers, handles OPTIONS,
uses per-request clients, and emits sanitized JSON/errors/diagnostics.
No secret/environment values or authentication responses are context inputs.

## Configuration and PWA boundaries
Frontend public variables: REACT_APP_DATA_MODE, REACT_APP_API_BASE_URL and
REACT_APP_OAUTH_REDIRECT_URI. Backend-only credentials remain in backend config;
OAUTH_REDIRECT_URIS is a trusted explicit callback allowlist. Local callback is
http://localhost:3000/ for future isolated testing; existing production callback
is https://marksav85.github.io/meet/. Local OAuth needs explicit configuration.
No-referrer and no-store protect requests. Atatus remains installed and starts
only in mock mode without callbacks; removal is planned. Workbox service worker
registration, shell precaching/navigation fallback and same-origin PNG caching
remain; external auth API responses are not cached. lastEvents is a separate
non-sensitive offline cache with controlled parsing failures. Public manifest/
icons support installation. Current Lighthouse/installability was not audited.

## Testing and historical verification
Frontend uses CRA Jest, React Testing Library/user-event, jest-cucumber feature
tests and Puppeteer browser checks. Test fetch/navigation are mocked; browser
checks block external requests. Backend node:test replaces the Google SDK.
Phase 6 report records 97 frontend tests (88 unit/Gherkin + 9 browser), 41 backend
tests and successful production build. Subsequent integration review records
88 unit/Gherkin, 41 backend tests and successful build, without rerunning browsers.
These are verified historical reports, not new test execution in this artifact
run. Live Google consent/PKCE, API Gateway behavior and account verification
remain unverified. No claim of >=90% coverage or IE11 support is substantiated.

## Modernization checkpoints and current working tree
Phase 5 functional/test reliability checkpoint: 3888770.
Phase 6 OAuth/backend security checkpoint: eb561aa.
Playbook submodule checkpoint: 010d714 (current HEAD, branch main).
Full HEAD: 010d71449a4de3b4c25900b9387a5e6d97e5ef49.
Playbook pin: 162a9d832acd73c9cb105ad5a5bc16b8135fb6ce.
Root AGENTS.md, helper scripts, exclusions and integration documentation exist
as uncommitted working-tree changes; artifact generation preserves them.
This pack describes that checkout, not only committed HEAD. Library sync pending.

## Remaining work, decisions and constraints
Phase 7A backend modernization is pending: select a supported Lambda runtime and
evaluate pinned Serverless v4 in its separately authorized phase. Dependency
risks/old tooling, outdated Browserslist data and uneven backend lint/format
coverage remain. No upgrade/install was performed. Standalone Phase 5 report and
formal Playbook execution-plan/progress/setup mapping are absent; legacy root
reports retain older naming/metadata. The integration review records these gaps.
Vite frontend migration, Atatus removal, Google Stitch UI redesign and final
Cloudflare hosting are planned, not implemented. OAuth/AWS Lambda/Google Calendar
are retained. Future real OAuth uses a separate testing stage/client; production
replacement requires coordinated frontend/backend deployment after verification.
The existing live AWS deployment still uses the old insecure API contract as
reported by project records. New local contracts are incompatible with it;
do not deploy this frontend alone. Preserve the current live deployment until
its tested replacement is approved. No live service, deployment, commit/push,
Playbook edits, application changes or Phase 7A work are authorized by generation.

## Context maintenance
ARTIFACT_PACK_MANIFEST is the pack identity/integrity anchor. Upload all generated
members together; Library synchronization has not occurred. Refresh through the
canonical controller after modernization and docs/config/source changes. Use
the companion handoff for backend inventory, schema limits and upload details.
