# Meet — development guidance

Meet has a React 18 / JavaScript Vite frontend (`src/`, `public/`) and an independent
Node.js 24 Lambda backend (`auth-server/`). Preserve those boundaries and current
OAuth/API contracts. Work within the requested scope in this repository. Inspect Git
status and relevant operational docs before work; preserve unrelated local changes.
Read [README.md](README.md) for current status.

Use the user's request as the scope. Do not introduce TypeScript, new frameworks,
dependencies, redesigns or later phases without authorization. Do not commit, push,
deploy, change cloud configuration or run live OAuth unless specifically authorized.
Protect the existing `/dev` deployment. Never read or print credentials, tokens,
resolved secret-bearing deployment state or ignored credential/export contents.

## Validation

- `npm test`: frontend unit/component/Gherkin tests.
- `npm run test:browser`: browser tests against `VITE_DATA_MODE=mock npm start`;
  external requests are blocked. Matching Puppeteer Chrome must be installed.
- `npm run build`: Vite/PWA build; it is not a lint check.
- `npm test --prefix auth-server`: offline backend tests.
- `npm run check:local --prefix auth-server`: offline backend config checks.
- `git diff --check`: whitespace check.

Run checks appropriate to the change and report actual results. There is no
standalone lint/formatter/type-check command. Frontend Jest roots are `src/`.
See the [Development Handbook](docs/development-handbook.md),
[Operations Runbook](docs/operations-runbook.md),
[backend workflow](auth-server/README.md) and [authentication](AUTHENTICATION.md).

## AI handoff artifacts

AI context artifacts are optional local handoff outputs, not tracked operational
documentation. Generate them only when explicitly requested and keep them
Git-ignored. Never copy secrets or ignored exports into a handoff.
