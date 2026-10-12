# Meet authentication contracts

The owner has verified OAuth state/S256 PKCE and Calendar integration live against
the isolated `localtest` backend. The old `/dev` API remains separate and incompatible
with these contracts. Production cutover requires coordinated configuration.

## API and browser security

| Purpose | Request | Response |
| --- | --- | --- |
| Authorization URL | POST `/api/get-auth-url`, JSON `{state, redirectUri, codeChallenge}` | `{authUrl}` |
| Code exchange | POST `/api/token`, JSON `{code, redirectUri, codeVerifier}` | `{access_token, token_type, expires_in}` |
| Calendar events | GET `/api/get-events`, `Authorization: Bearer …` | `{events}` |

Errors are sanitized `{error: {code, message}}`. The browser creates 256-bit random
state and S256 PKCE, storing a 10-minute, single-use transaction and continuity
status in sessionStorage. It consumes the transaction before exchange and promptly
removes callback parameters from browser history. The approved redirect must match
the page and stored transaction. Lambda uses a request-scoped Google OAuth client.

After code exchange, only the access token and its absolute expiration timestamp
are saved in `meet.oauth.session` in sessionStorage. Refreshes restore the same
expiry within the current tab; the token must remain valid beyond a 30-second
margin. Malformed/expired records are discarded, and unavailable storage fails
closed. Tokens remain JavaScript-readable: XSS can steal them. No refresh tokens
are requested or stored, and tokens never enter localStorage, URLs or PWA caches.

Expiry, Calendar 401, reauthorization and explicit Sign out clear credentials,
protected UI data and `lastEvents`. A timer expires the session at the safety
margin; request-time checks also enforce expiry. Pending requests from an
invalidated session cannot restore tokens or events. Sign out ends the local Meet
session; it does not sign out of Google or revoke the Google access token.

Offline Calendar data requires a valid session; cached events are not proof of
authorization. Mock mode remains an explicit development/testing exception.
Requests retain no-store/no-referrer behavior, and the PWA never caches
authentication responses. No monitoring service instruments the flow.

## Configuration and CORS

Public frontend configuration is described in the
[frontend workflow](docs/2-development/workflow--frontend--development.md).
Backend variables are `CLIENT_ID`, `CLIENT_SECRET`, `CALENDAR_ID` and
`OAUTH_REDIRECT_URIS`; supply them privately through deployment configuration,
never frontend variables, Git, documentation or AI artifacts. Calendar access uses
`calendar.events.public.readonly`; the demonstration calendar must be public.

For localtest, use the development client and exact callback allowlist:
`["http://localhost:3000/"]`. The YAML default is the legacy production callback,
so localtest must explicitly override it. Do not substitute another hostname,
port or `/meet/`. Production source now supports the separate `prod` stage for
`https://meet.marksavilledesigns.com/`. Its guarded commands require production
credentials and `OAUTH_REDIRECT_URIS=["https://meet.marksavilledesigns.com/"]`;
the production backend has not been deployed. See [backend maintenance](auth-server/README.md)
for the explicit offline checks and later deployment commands. `localtest` and
historical `/dev` remain separate.

CORS derives exact approved origins from callbacks, handles
OPTIONS and allows Content-Type/Authorization without cookies or wildcard origins.
A second client in the existing Google project shares consent/audience and quotas;
it is not an independent sandbox. Protect the production client/project settings.

## Future production cutover

Register the exact approved Cloudflare callback with the intended production client,
configure the matching backend allowlist/CORS and public frontend API/callback,
and verify compatible frontend/backend behavior together. Do not reuse testing
secrets for production or deploy this frontend against the old API contracts.
Retain existing deployments until replacement is explicitly authorized.
API Gateway and Lambda diagnostics must not expose bodies, authorization headers,
OAuth codes or tokens. See [backend maintenance](auth-server/README.md).
