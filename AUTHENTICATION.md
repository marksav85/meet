# Phase 6 authentication contracts

The owner reports that the isolated `localtest` backend has passed live OAuth
and Calendar integration testing. The original `/dev` API remains unchanged and
incompatible with these contracts. Production frontend/backend cutover remains
separately authorized. Historical phase reports retain their original evidence.

## Requests

| Purpose | Previous contract | Revised contract |
| --- | --- | --- |
| Authorization URL | GET `/api/get-auth-url` | POST `/api/get-auth-url`, JSON `{state, redirectUri, codeChallenge}` → `{authUrl}` |
| Code exchange | GET `/api/token/{code}` | POST `/api/token`, JSON `{code, redirectUri, codeVerifier}` → `{access_token, token_type, expires_in}` |
| Calendar | GET `/api/get-events/{token}` | GET `/api/get-events`, `Authorization: Bearer …` → `{events}` |
| Token validation | Google token-info URL query | Removed; Calendar 401 invalidates authorization |

Errors have `{error: {code, message}}` with sanitized messages. Codes/credentials
never belong in application API URLs. The Google authorization callback still
necessarily carries its short-lived code; the app immediately replaces its URL.

The browser creates 256-bit random state and an S256 PKCE verifier. Only the
10-minute, single-use transaction is kept in sessionStorage. State is consumed
before exchange, including failures. The approved redirect must match the
browser page and the stored transaction. Google binds the exchanged code to
that redirect and verifier. Lambda uses a new OAuth client per invocation.
Access tokens live only in memory; reloads and expiry require explicit
authorization. No refresh tokens are requested, returned or stored. Session
status prevents automatic redirect loops. Non-sensitive `lastEvents` caching
continues independently of authentication; legacy localStorage tokens are deleted.

## Configuration

Frontend variables are public, bundled at build time:

- `VITE_DATA_MODE`: `mock` (localhost default) or `oauth`.
- `VITE_API_BASE_URL`: an explicitly configured isolated API for localhost OAuth.
- `VITE_OAUTH_REDIRECT_URI`: `http://localhost:3000/` for local testing,
  `https://marksav85.github.io/meet/` for current production hosting.

Never place a client secret in frontend variables. Backend CLIENT_ID,
CLIENT_SECRET and CALENDAR_ID now resolve from backend deployment environment variables; local credential files are not read by the Phase 7A YAML.
`OAUTH_REDIRECT_URIS` is a JSON array of exact approved callbacks. It defaults
only to `["https://marksav85.github.io/meet/"]`. CORS derives approved origins
from these callbacks; it rejects absent/unapproved Origin headers, and provides
OPTIONS responses for each route. It permits Content-Type and Authorization,
without cookies or wildcard origins. Set the array explicitly for the future
isolated testing stage; do not broaden the existing live stage now.

Atatus has been removed. Referrer policy is
no-referrer. API requests and responses use no-store. The service worker caches
the application shell and same-origin images, not the external authentication
API; no authenticated responses or token-bearing URLs are cached. The unsafe
legacy diagnostic page has been retired.

## Verification and later deployment

Run `npm test` for mocked unit/component/Gherkin tests and `npm run test:browser`
with the local Vite mock server running. Browser tests block external hosts.
Backend tests remain independent (`npm test --prefix auth-server`).

See [frontend setup](docs/2-development/workflow--frontend--development.md) for
public Vite variables, PWA behavior and verification. The successful live tests
are owner-reported evidence; this migration performs no live OAuth or cloud calls.
Future production cutover must register the exact hosting callback, approve its
backend origin and coordinate compatible frontend/backend deployment. Do not
reuse a testing client or secret for production. API Gateway logs must not record
request bodies or Authorization headers.
