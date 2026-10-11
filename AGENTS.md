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
- `./scripts/setup-playbook.sh --check`: read-only pin/sparse check.
- `git diff --check`: whitespace check.

Run checks appropriate to the change and report actual results. There is no
standalone lint/formatter/type-check command. Frontend Jest roots are `src/`;
Vite watching and formatter exclusions protect Playbook. Never import its examples
into runtime source. See [frontend workflow](docs/2-development/workflow--frontend--development.md),
[backend workflow](auth-server/README.md) and [authentication](AUTHENTICATION.md).

## Selective Playbook use

`playbook/` is read-only and pinned by the parent Gitlink. Do not edit it or advance
its revision without explicit approval. See [setup/update instructions](docs/2-development/workflow--playbook--integration.md).
Consult only relevant guidance under `playbook/docs/templates/`:

- `0-ai/system/system--execution--chatgpt-codex-protocol.md` for bounded execution.
- `2-development/2-development-index.md` and the applicable setup controller/module
  when setup work is requested; verify paths before use.
- `0-ai/system/system--docs--naming-contract.md` and
  `system--docs--metadata-contract.md` for authored documentation.

A direct implementation request authorizes its scope; do not add a confirmation
gate solely from a generic workflow. Small tasks do not require full planning,
audit or artifact procedures. Next.js/Worker examples are not Meet requirements.

AI context artifacts are optional generated ChatGPT handoff outputs, not tracked
operational documentation. When explicitly needed, use the canonical artifact
controller/spec/generators and regenerate a complete verified pack. Keep outputs
local and Git-ignored; confirm that exclusion before generating them. Never copy
secrets or ignored exports into a handoff. No artifact generation is automatic.
