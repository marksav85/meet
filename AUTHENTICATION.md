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
state and S256 PKCE, storing only a 10-minute, single-use transaction and continuity
status in sessionStorage. It consumes the transaction before exchange and promptly
removes callback parameters from browser history. The approved redirect must match
the page and stored transaction. Lambda uses a request-scoped Google OAuth client.

Access tokens stay in memory. No refresh tokens are requested or stored; reload,
expiry, denial or Calendar 401 requires controlled reauthorization. Legacy persistent
tokens are removed. `lastEvents` stores non-sensitive event data independently.
Requests use no-store/no-referrer, and the PWA never caches authentication responses.
No monitoring service instruments the flow.

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
port or `/meet/`. CORS derives exact approved origins from callbacks, handles
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
