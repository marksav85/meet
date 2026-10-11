# Meet App — Codex guidance

Meet is an existing JavaScript React 18 / Vite frontend (`src/`, `public/`) with
an independent Node.js Google OAuth / AWS Lambda backend (`auth-server/`).
Retain these boundaries. Do not introduce TypeScript, Next.js, a new framework,
or dependencies because a Playbook example uses them.

## Playbook discovery and authority

The read-only `playbook/` Git submodule is pinned by the parent Gitlink. Never
edit its files or advance its revision without explicit approval. Root
`AGENTS.md` is discovered by Codex for this project; Playbook's own AGENTS.md
applies to maintenance inside that separate repository, not to Meet source.

Before a task, inspect current Git status and relevant project documents,
including `PHASE6_REPORT.md`, `AUTHENTICATION.md`, and
`docs/2-development/workflow--playbook--integration.md`. Preserve local work.
Use the current user request as the execution scope; review completed code
against standards without automatically rewriting it.

Read the applicable canonical authorities under `playbook/docs/templates/`:

- `0-ai/system/system--execution--chatgpt-codex-protocol.md`: bounded review,
  implementation and completion evidence. A direct user instruction to implement
  authorizes that task; do not ask again solely for the protocol review gate.
- `2-development/2-development-index.md`: locate relevant development material;
  verify actual paths because index entries may be stale or placeholders.
- `2-development/dev-1--project-setup/dev-1--controller--project-setup.md`:
  setup scope, selected modules, validation, deferrals and lifecycle boundaries.
- `2-development/dev-1--project-setup/modules/playbook-integration/module--dev-1--playbook-submodule-integration.md`:
  submodule setup, sparse checkout, pins and updates.
- `2-development/dev-1--project-setup/audits/audit--dev-1--application-foundation.md`:
  evidence checklist when foundation review is requested; technical checks do
  not grant lifecycle approval.
- For authored docs, `0-ai/system/system--docs--naming-contract.md` and
  `0-ai/system/system--docs--metadata-contract.md`: keep project outputs outside
  Playbook, update the local docs index, preserve historical reports.
- For planning/handoff work,
  `0-project-management/project-management--controller.md` and
  `0-project-management/templates/template--project-execution-plan.md`.

Read only relevant controllers/modules. Do not apply Next.js starter, CMS,
Cloudflare Worker, localisation, design or deployment instructions unless the
current task selects them. Unavailable or conflicting guidance must be reported;
do not fetch a newer Playbook automatically or invent a missing module.

## Modernization boundaries

Phases 5, 6 and 7A are committed. The owner reports successful live OAuth and
Calendar integration against the isolated `localtest` backend. The original
`/dev` deployment remains protected. Frontend production cutover requires
separate authorization; do not run live OAuth as a local regression test.
No commits, pushes, deployments, credential changes, dependency upgrades, or
later phases without authorization. Never print secrets or raw SDK/request data.

## Validation and tooling

Use installed tools; no automatic installs/upgrades or package-manager hooks that
update Playbook. Vite builds from root `index.html` and frontend imports; Jest discovery is scoped
to `src/`. Playbook is excluded from formatter discovery and Vite watching;
never import it into runtime source. Backend tests run independently.

- `./scripts/setup-playbook.sh --check`: read-only pin/sparse/cleanliness check.
- `npm test`:
  mocked frontend unit/Gherkin tests.
- `npm test --prefix auth-server`: mocked backend tests.
- `npm run build`: production Vite/PWA build; this is not a lint check.
- `npm run test:browser`: browser tests require the local mock server and external request blocking;
  run only when useful for the change. Do not start live OAuth mode for them.
- `git diff --check`: patch whitespace check.

There is currently no independent backend lint/formatter or type-check command.
Do not claim those checks ran. Report actual checks, warnings, exceptions and
remaining live verification separately. New reusable standards remain in the
canonical Playbook; project decisions and evidence belong in Meet documentation.
