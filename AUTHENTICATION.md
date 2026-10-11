# Phase 6 authentication contracts

These local changes require a coordinated frontend/backend deployment. They are
incompatible with the currently deployed AWS API. Nothing has been deployed.

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

- `REACT_APP_DATA_MODE`: `mock` (localhost default) or `oauth`.
- `REACT_APP_API_BASE_URL`: an explicitly configured isolated API for localhost OAuth.
- `REACT_APP_OAUTH_REDIRECT_URI`: `http://localhost:3000/` for future testing,
  `https://marksav85.github.io/meet/` for current production hosting.

Never place a client secret in frontend variables. Backend CLIENT_ID,
CLIENT_SECRET and CALENDAR_ID retain the existing configuration mechanism.
`OAUTH_REDIRECT_URIS` is a JSON array of exact approved callbacks. It defaults
only to `["https://marksav85.github.io/meet/"]`. CORS derives approved origins
from these callbacks; it rejects absent/unapproved Origin headers, and provides
OPTIONS responses for each route. It permits Content-Type and Authorization,
without cookies or wildcard origins. Set the array explicitly for the future
isolated testing stage; do not broaden the existing live stage now.

Atatus remains installed and is initialized only in mock mode without an OAuth
callback. It never instruments the real OAuth flow. Referrer policy is
no-referrer. API requests and responses use no-store. The service worker caches
the application shell and same-origin images, not the external authentication
API; no authenticated responses or token-bearing URLs are cached. The unsafe
legacy diagnostic page has been retired.

## Verification and later deployment

Run frontend tests with `CI=true npm test -- --watchAll=false --runInBand` while
the local mock server is running (browser tests require Chrome); run backend
mocked tests with `npm test --prefix auth-server`. Backend tests replace the
Google SDK and frontend auth tests replace fetch/navigation; browser tests
block external hosts.

Before any live verification, provision a separate testing stage and development
OAuth client/callback with explicit approval. Deploy matching routes and frontend
configuration together. Verify preflight, Google consent/state/PKCE, denial,
expired tokens, API Gateway-generated errors and caching in that isolated stage.
Confirm Google Calendar permissions and OAuth publishing/verification status.
API Gateway access/execution logs must not record request bodies or Authorization
headers; Lambda's own diagnostics contain only operation, error code and status.

In a later authorized phase, select a supported Lambda Node runtime and evaluate
pinned Serverless v4 separately. Neither runtime nor dependencies changed here.
Eventually register the exact Cloudflare callback, configure its approved origin,
and deploy the replacement only after testing, retaining the existing deployment
until then. Do not reuse a testing client or secret for production.
