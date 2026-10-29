# Meet — development guidance

Meet has a React 18 / JavaScript Vite frontend (`src/`, `public/`) and an independent
Node.js 24 Lambda backend (`auth-server/`). Preserve those boundaries and current
OAuth/API contracts. Inspect Git status and relevant operational docs before work;
preserve unrelated local changes. Read [README.md](README.md) for current status.

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

## Working scope

A direct implementation request authorizes its scope within the active repository,
subject to the global workspace-safety instructions in `~/.codex/AGENTS.md`. It does
not authorize cross-repository modifications or override external-access permissions.
Do not add a confirmation gate solely from a generic workflow. Small tasks do not
require full planning, audit or artifact procedures.

AI context artifacts are optional local handoff outputs, not tracked operational
documentation. Generate them only when explicitly requested and keep them
Git-ignored. Never copy secrets or ignored exports into a handoff.

## Shared development standards

When relevant, consult the MSD Projects Playbook for applicable development workflows, standards, templates and documentation requirements.

Use the Playbook location and access permissions defined in the global Codex instructions (`~/.codex/AGENTS.md`).

Treat the Playbook as read-only reference material when working in another repository. Do not modify Playbook or any other external Git repository from the current Codex session.

Do not add a Git submodule, create a separate checkout or duplicate Playbook files solely to access its documentation.

If Playbook modifications are needed, prepare a separate task for a Codex session opened directly in the Playbook repository.
