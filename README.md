# Meet App

Meet is a React 18 / JavaScript portfolio PWA for discovering technology events.
It supports city search, event-count selection, expandable details, city/category
charts, accessible interactions and offline access to previously loaded events.
The frontend uses Vite 8.3.4 and Vite PWA; a separate AWS Lambda backend handles
Google OAuth and Calendar retrieval. Atatus has been removed.

## Quick start

Use Node.js 24, then run from the project root:

```sh
npm ci
npm start
npm test
npm run build
```

Development runs at **http://localhost:3000/** in mock mode by default. The port
is strict. Build output is `dist/` with base `/`; `npm run preview` serves it at
localhost:4173. Run `npm run test:browser` with the mock development server running.
See [frontend development](docs/2-development/workflow--frontend--development.md)
for local OAuth, PWA behavior and the six category-description markers.

## Current status and remaining work

The isolated `localtest` backend in eu-central-1 has been deployed successfully.
The owner verified Google OAuth state/PKCE and Calendar integration live. Backend
versions are Node.js 24, Serverless Framework 4.43.0 and Google APIs SDK 185.0.0.
The existing `/dev` deployment and [legacy GitHub Pages site](https://marksav85.github.io/meet/)
remain separate; this root-path build is not a replacement `/meet/` deployment.

At last verification, **120 frontend tests** and **52 backend tests** passed.
The frontend production dependency audit had zero findings; development-only
findings remain (23 moderate, eight high). The build passes with a >500 kB chunk
warning. These are recorded results, not a fresh audit or live test on every edit.

Remaining work: populate the international demonstration calendar, implement the
visual redesign, deploy to Cloudflare and coordinate approved production OAuth
client/callback, CORS and backend/frontend configuration. Deployment permissions
still need a reviewed least-privilege approach; the removed placeholder IAM drafts
were not a verified policy. **Revoke temporary AWS administrator access and delete
its access key after deployment work is finished.** This is an outstanding owner
operation, not an action performed by documentation cleanup.

## Documentation and Playbook

- [Documentation index](docs/README.md)
- [Authentication contracts](AUTHENTICATION.md)
- [Backend maintenance](auth-server/README.md)
- [Playbook initialization and updates](docs/2-development/workflow--playbook--integration.md)
- [Codex guidance](AGENTS.md)

Playbook is a pinned, read-only submodule. Run `./scripts/setup-playbook.sh` after
cloning and `./scripts/setup-playbook.sh --check` to verify it. Updates require
approval of an exact revision. Historical modernization details remain in Git history.
