# Meet App — Operations Runbook

## Document header

- **Audience:** Project owner and authorized release operators
- **Purpose:** Describe source-verified routine operation and identify dashboard-dependent steps.
- **Status:** reference
- **Last updated:** 2026-10-29

## Service overview and current evidence

Meet serves a static React/Vite application from Cloudflare Pages and uses AWS API
Gateway/Lambda in `eu-central-1` for Google OAuth and Calendar access. The owner
previously reported the frontend at
[`meet.marksavilledesigns.com`](https://meet.marksavilledesigns.com/) and the
backend `prod` endpoint documented in [`AUTHENTICATION.md`](../AUTHENTICATION.md).
Those deployments were not independently checked during finalization Pass 1.

Google OAuth and the public demonstration Calendar are external dependencies. The
Calendar is the event source of truth; Meet has no application database to restore.
The project owner is the operational contact. Current account ownership, dashboard
permissions, deployment triggers and recovery access must be confirmed in Cloudflare,
AWS and Google before an operational change.

## Local development and verification

Use Node.js 24. Frontend and backend dependencies are separate.

```sh
npm ci
VITE_DATA_MODE=mock npm start
```

The local frontend is `http://localhost:3000/`; Vite uses a strict port. Preview
serves the production build at `http://localhost:4173/`, separate from the development
origin. Mock mode uses bundled fixtures and does not require OAuth or AWS. To test
the isolated local OAuth backend, use these public build values and restart Vite
after changes:

```dotenv
VITE_DATA_MODE=oauth
VITE_API_BASE_URL=https://npecrd9ykd.execute-api.eu-central-1.amazonaws.com/localtest
VITE_OAUTH_REDIRECT_URI=http://localhost:3000/
```

Run the unit/component/Gherkin suite with `npm test`. For browser tests, keep the
mock server running in one terminal and run `npm run test:browser` in another. The
suite blocks external requests and requires matching Puppeteer Chrome. A normal
`npm ci` downloads it; if install scripts were skipped, the maintained package
command is `npx puppeteer browsers install chrome`. Installing packages or Chrome
is outside routine verification and requires the appropriate approval.

For backend checks, install its lockfile separately when needed, then run:

```sh
npm test --prefix auth-server
npm run check:local --prefix auth-server
npm run check:prod --prefix auth-server
```

The backend test suite uses offline fixtures/fake transports. Both configuration
checks are local static checks; they do not contact AWS or validate a generated
CloudFormation stack. Pass 1 recorded 164 frontend Jest tests across 17 suites, 80
backend tests, passing offline backend configuration checks and a successful
Vite/PWA production build. On 29 October 2026, all 16 Puppeteer browser cases passed
in one suite with Chrome for Testing 148.0.7778.97 (Puppeteer 24.43.1), against the
local Vite server at `http://localhost:3000/` in mock mode. A first attempt was
blocked by a sandbox Chrome launch restriction; an authorized retry passed without
application or test changes. The suite uses local fixtures and does not verify live
Google OAuth, Calendar or AWS behavior. See the [`Development Handbook`](development-handbook.md)
for architecture context and earlier historical test records.

## Configuration and secrets

The frontend build consumes public `VITE_DATA_MODE`, `VITE_API_BASE_URL` and
`VITE_OAUTH_REDIRECT_URI` values. They are embedded at build time and must never
contain client secrets, AWS credentials or tokens. The local OAuth example is above.
Non-local hosts have no API/callback fallback; missing values fail closed.
Production values below are the last documented targets; confirm them against
approved current settings before release. The build guard checks URL shape and
`/prod` stage selection; it does not prove ownership, dashboard values or live
service behavior.

The backend reads `CLIENT_ID`, `CLIENT_SECRET`, `CALENDAR_ID` and
`OAUTH_REDIRECT_URIS` from private deployment configuration. Supply the callback
allowlist as the exact JSON array documented in [`AUTHENTICATION.md`](../AUTHENTICATION.md).
The historical `localtest` YAML callback default is not the local OAuth callback;
override it explicitly for local integration. Never place backend secrets in
frontend variables, Git, logs, docs or support artifacts.

For a production frontend build, the previously reported target values are:

```sh
VITE_DATA_MODE=oauth \
VITE_API_BASE_URL=https://as4vfvezdg.execute-api.eu-central-1.amazonaws.com/prod \
VITE_OAUTH_REDIRECT_URI=https://meet.marksavilledesigns.com/ \
npm run build
```

The API URL and callback are public configuration values, not proof of current
deployment state. The guard requires OAuth mode, HTTPS, `/prod` and an exact root
callback with a trailing slash; mock, local, GitHub Pages and legacy `/dev` targets
are rejected for production builds. The build writes `dist/`; it does not publish
the site.

## Release responsibilities

### Cloudflare Pages frontend

Source config sets Vite `base: '/'` and outputs `dist/`, for root-path hosting; it
is not a drop-in GitHub Pages `/meet/` build. The repository has no Cloudflare
deployment configuration or deploy command. Verify the connected
repository/branch, build command, output directory, build environment variables and
current deployment status in the Cloudflare dashboard. Because `VITE_*` values are
build-time inputs, a new frontend build is required when they change. Dashboard
settings and the rollback procedure are not verified here; confirm them before a
release. The supported build command is `npm run build` with the explicit production
values above. A successful local build alone does not deploy or verify the site.
For future hosting changes, revalidate HTML and worker files and cache only hashed
assets immutably.

### AWS Lambda and API Gateway

Source targets Node.js 24 in `eu-central-1` and permits only `localtest` and `prod`.
Use the guarded commands and preflight documented in
[`auth-server/README.md`](../auth-server/README.md). The production deploy wrapper is
`npm run deploy:prod --prefix auth-server -- --stage prod`; package and deploy
operations require separate authorization and private environment configuration.
Packaging can write Serverless deployment storage, and local stage guards do not
replace AWS IAM. No generic removal command is supplied. Preserve the protected
historical `/dev` deployment and do not alter cloud settings as part of routine
documentation work.

## Production verification

On 29 October 2026, the owner confirmed a manual production smoke test in which all
eight checks passed: Google sign-in and event loading; filters; charts; event
details; themes; responsive layout; session continuity; and sign-out. This records
owner acceptance of the observed application behavior only. It is not automated
test evidence or independent verification of Cloudflare, AWS, Google configuration
or infrastructure health.

After an explicitly authorized release, confirm the expected frontend host and
backend `/prod` endpoint in their dashboards. Test the primary Google sign-in and
Calendar journey, exact callback/CORS behavior, event retrieval, refresh/session
expiry, sign-out and browser cache behavior using an authorized account. Confirm
that localtest and historical `/dev` remain unchanged. Never use a successful build
or prior deployment report as evidence of current production behavior. During Pass 1,
no live OAuth, Calendar request or cloud service was independently tested; the manual
owner acceptance above is separate and does not independently verify infrastructure.

## Troubleshooting

| Symptom | Checks and safe response |
| --- | --- |
| OAuth cannot start or callback is rejected | Confirm the page origin, trailing slash and exact `OAUTH_REDIRECT_URIS` entry match. Restart sign-in from the Meet button; state/PKCE transactions are single-use and expire. Never paste callback codes into logs. |
| `401` or expired authorization | The client clears the local session and protected events. Sign in again through the explicit Google button. Meet sign-out does not revoke Google credentials. |
| `403` / access denied | Check the allowed origin and public Calendar availability/permissions. Backend CORS is exact-origin and does not allow wildcard origins. |
| Temporary `503` / Google busy | The backend maps Google throttling to a temporary upstream error. Retry later; do not loop production requests. |
| Configuration or generic service error | Check public Vite variable names and private backend environment in their dashboards. Never print secret values. Confirm the frontend is not targeting legacy `/dev` contracts. |
| Stale shell or unexpected offline page | Check the registered service worker and deployed static assets. The worker caches static files, not auth/API responses. If clearing a legacy worker/cache is necessary, do not clear session storage during an OAuth callback. |

Detailed OAuth error contracts and cache boundaries are in
[`AUTHENTICATION.md`](../AUTHENTICATION.md); frontend worker implementation is in
the [`Development Handbook`](development-handbook.md).

## Monitoring, recovery and maintenance

Source disables API Gateway access/execution logging and sets Lambda log retention
to 14 days. Handler diagnostics are limited to safe operation, error code and
status. No external monitoring or alerting service is configured in source; verify
the deployed dashboard state and arrange owner escalation before relying on it.

No Meet-owned event database or backup/restore process exists. Cloudflare Pages
deployment rollback and AWS stack recovery have not been verified in this runbook;
confirm current platform options, permissions and the intended recovery target before
releasing. Do not remove stacks or shared deployment storage. The guarded backend
procedures and operational cautions are maintained in
[`auth-server/README.md`](../auth-server/README.md).

## Operational evidence gaps

- Current Cloudflare, AWS and Google dashboard configuration and live health remain
  unverified.
- Production OAuth/Calendar behavior and the platform rollback paths need an
  authorized operator check.
- Pass 1 dependency audits were inconclusive because `registry.npmjs.org` was
  unreachable. No fresh audit was performed; this is a historical limitation, not
  a blocker for retrospective finalization.
- Monitoring ownership, alert routing and account access should be confirmed by
  the project owner.
