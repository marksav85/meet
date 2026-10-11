# Phase 6 — OAuth and backend security repairs

## A. Security repairs completed

The working tree was clean at the start. Phase 5 checkpoint `3888770` exists.
Its 68 unit/Gherkin tests and production build passed before editing. No
existing work was discarded. No commit or deployment was created.

| Issue | Repair | Evidence |
| --- | --- | --- |
| Missing callback binding/replay protection | Cryptographic 256-bit state, session-bound 10-minute transaction consumed before exchange; S256 PKCE; fail closed on missing/mismatched/expired/duplicate/replayed callbacks | Mocked auth regression tests |
| Codes/tokens in application API URLs | POST JSON exchange, bearer calendar header; removed token-info call and unsafe legacy diagnostic | Request assertions, handler tests, source inspection |
| Persistent credentials | Memory-only access token; only transaction/status in sessionStorage; delete legacy localStorage token; no refresh fields returned/stored | Successful callback and expiry tests |
| Redirect loops and denial | Explicit reauthorization after denial, expiry, 401 or failed exchange; session status blocks automatic retries | Auth and UI tests |
| Callback/monitoring leakage | Early history.replaceState; no-referrer metadata/request policy; Atatus retained but disabled for OAuth mode/callbacks | Cleanup tests and entry-point inspection |
| Raw SDK exceptions/shared credentials | Request-scoped OAuth clients, sanitized JSON errors and operation/code/status diagnostics only | Backend failure and client-isolation tests |
| Unrestricted callback/CORS | Exact callback allowlist, derived origins, validated JSON/methods/headers and OPTIONS handlers | Backend callback/preflight tests |
| Caching credentials | no-store API requests/responses; existing service worker only caches shell/images; non-sensitive event cache preserved | Source review and unchanged cache regressions |

## B. API contract changes

| Operation | Previous | New |
| --- | --- | --- |
| Authorization URL | GET `/api/get-auth-url` | POST same path; JSON `{state, redirectUri, codeChallenge}`; response `{authUrl}` |
| Exchange | GET `/api/token/{code}` | POST `/api/token`; JSON `{code, redirectUri, codeVerifier}`; response `{access_token, token_type, expires_in}` |
| Events | GET `/api/get-events/{token}` | GET `/api/get-events`; Authorization bearer header; response `{events}` |
| Separate validation | Google token-info query | Removed; calendar 401 invalidates token |

Errors use `{error: {code, message}}`: 400 malformed input, 401 invalid/expired
credentials, 403 access/origin rejection, 405 method rejection, 502 upstream
failure/invalid response, 503 upstream throttling, 500 configuration/unexpected
failure. Approved-origin responses include CORS headers; unapproved origins
receive no allow-origin header. OPTIONS returns 204 for approved preflights.

The Google callback necessarily arrives with a code in its URL; the app removes
it immediately. Codes and access tokens never appear in application API URLs.

**The revised local contracts are incompatible with the old deployed backend.
Do not deploy this frontend alone. The existing live deployment is unchanged.**

## C. Files changed

| File | Purpose |
| --- | --- |
| `src/auth.js` (new) | Injectable state/PKCE, callback, memory-token and request lifecycle |
| `src/api.js` | Thin facade preserving event/location/cache exports |
| `src/App.js` | Safe auth messages and explicit authorization button |
| `src/index.js` | Cleanup before initialization; restrict Atatus instrumentation |
| `public/index.html` | No-referrer policy |
| `src/setupTests.js` | Mock auth navigation entry point for safe UI tests |
| `src/_tests_/Auth.test.js` (new) | 18 mocked auth regression tests |
| `src/_tests_/AuthUI.test.js` (new) | Two safe UI/authorization tests |
| `auth-server/handler.js` | Validated secure contracts, CORS, scoped clients, errors |
| `auth-server/serverless.yml` | POST/GET/OPTIONS routes, explicit callback configuration, exclude config/test files from packaging |
| `auth-server/package.json` | Built-in Node test runner script; dependencies unchanged |
| `auth-server/test/handler.test.js` (new) | 41 mocked SDK/handler tests; no new dependency |
| `static-site-test/test-auth-server.html` | Retire unsafe credential-displaying live diagnostic |
| `AUTHENTICATION.md` (new) | Contracts, non-secret configuration, later deployment checklist |
| `PHASE6_REPORT.md` (new) | This report |

## D. Testing results

- Complete frontend suite: **97 passed**, 14 suites: 88 unit/Gherkin tests and
  nine real local browser tests. All 77 Phase 5 tests remain intact and pass.
- Backend: **41 passed**, using built-in node:test and a mocked Google SDK.
- Production build: compiled successfully for the existing `/meet/` base path.
- `git diff --check`: clean.
- Installed Google auth SDK source was checked for support of `codeVerifier`.
- No live Google/AWS authentication or Calendar/API requests occurred. Browser
  tests intercept and abort every external host, including monitoring/fonts.
  Auth unit tests inject fetch/navigation; backend tests replace the SDK.
- Existing warnings: outdated Browserslist data and Node/webpack dev-server
  deprecations. No dependency update was attempted; no React warning suppression
  was added. No new frontend build/lint warnings were reported.

Verification logs are under `/tmp/meet-phase6-*.log` for this session. This is
mocked authentication verification, not real end-to-end OAuth verification.

## E. Remaining security limitations

Real Google consent, PKCE acceptance, callback registration, permissions,
expiry/revocation and account publishing/verification remain unverified. CORS
is a browser boundary, not API authentication; Calendar relies on Google's
bearer validation. This design intentionally has no persistent login or refresh
token; reloads require reauthorization. Same-origin malicious scripts/XSS can
still compromise browser memory/session storage; no claim of XSS prevention is
made. The code-level protections do not remediate the old deployed API yet.

API Gateway-generated errors, execution/access logs, infrastructure encryption,
and secret configuration must be verified in an authorized testing stage. Do
not enable body/Authorization logging there. Current local dependencies/runtime
are retained; their earlier dependency risks await the modernization phase.

## F. Deployment preparation

Create a distinct isolated AWS testing stage and development Google OAuth client
in a later authorized phase. Register `http://localhost:3000/`, explicitly set
backend OAUTH_REDIRECT_URIS and frontend OAuth mode/API/callback, and deploy
matching contracts together. Keep the current production callback approved and
leave its live stage untouched until replacement verification passes.

Modernize to a supported Lambda Node runtime and evaluate pinned Serverless v4
in that later phase, with separate dependency/packaging validation. Eventually
register the exact Cloudflare callback/origin and configure both sides before a
coordinated production migration. Atatus removal, CRA migration and visual
redesign remain deferred.

## G. Outstanding decisions

No blocker requires approval for the completed local implementation. Later live
work requires explicit authorization and selection of the isolated testing
stage/client, supported runtime, Serverless version and final Cloudflare URL.
No infrastructure changes, credentials, upgrades, commits or pushes were made.
