# Meet Playbook setup and maintenance

## Document Header

- **Audience:** Developers and Codex
- **Purpose:** Initialize the pinned Playbook and deliberately review future updates.
- **Status:** reference
- **Authority:** Project owner's Playbook integration request; canonical integration module.
- **Last updated:** 2026-10-11

## Integration boundary

The selected module is
[Playbook submodule integration](../../playbook/docs/templates/2-development/dev-1--project-setup/modules/playbook-integration/module--dev-1--playbook-submodule-integration.md).
This bounded integration covers agent guidance, helpers, documentation and tooling
exclusions. It does not replace the existing application foundation or approve a
full Dev 1 lifecycle milestone. Next.js/TypeScript starter, CMS, design and
Cloudflare Worker modules are not selected. Backend modernization (Phase 7A),
frontend modernization and deployment remain separately authorized work.

The integration commit is `010d714`; its Playbook Gitlink is
`162a9d832acd73c9cb105ad5a5bc16b8135fb6ce`. The current parent branch's committed
Gitlink, not an upstream branch, is authoritative after branch changes.

`playbook/` is read-only reference material. Project-specific outputs live in
Meet, normally under `docs/`; existing historical root reports stay in place.
Never store project decisions inside Playbook or copy its reusable templates as
new competing authorities.

## Initialize a new clone

Clone normally, then run from the project root:

```sh
./scripts/setup-playbook.sh
./scripts/setup-playbook.sh --check
```

Alternatively clone with `git clone --recurse-submodules <project-url>`, then run
the same setup helper to configure sparse checkout. Setup synchronizes the
registered URL, initializes/checks out the exact committed pin and configures:

```text
docs/templates/0-ai
docs/templates/0-project-management
docs/templates/1-pre-development
docs/templates/2-development
docs/templates/3-post-development
```

A fresh or incomplete clone may need network access to GitHub. Setup never uses
`--remote`, upgrades dependencies, edits tracked Playbook content, stages or
commits. Detached HEAD in Playbook is expected. It refuses local Playbook changes,
changed .gitmodules and an already-staged Gitlink update. Preserve/review those
changes rather than forcing or discarding them. A clean checkout at another
revision is restored to the parent HEAD pin by setup.

After branch switches, merges or pulls that change the pin, repeat setup.
`--check` is read-only/offline and verifies clean state, exact revision, the five
sparse paths and canonical module availability.

## Deliberate update

Only after the project owner approves a specific upstream commit:

```sh
./scripts/update-playbook.sh <approved-full-40-character-commit-sha>
git diff --submodule=log -- playbook
git -C playbook status --short
```

No argument, a branch/tag or an abbreviated SHA is rejected before fetching.
The helper requires a clean checkout matching the existing parent pin, fetches
only the selected revision, checks it out detached and reapplies sparse checkout.
Selecting the existing pin is an offline no-op. The helper leaves the changed
Gitlink visible for review, without staging or committing. It is intentionally
stricter than an automatic latest-upstream update: Meet requires explicit update
approval.

Review relevant changed Playbook guidance and run project validation. Acceptance
of the revision and committing its pointer are separate authorized actions; a
future approved pointer commit can use the canonical module's
`git commit --only playbook` workflow. This integration task authorizes neither an
update nor a commit. To restore the committed pin after a rejected update, run
setup only after confirming there are no local Playbook edits to preserve.

## Codex and tool boundaries

Root [AGENTS.md](../../AGENTS.md) is the automatic Codex discovery entry point.
It routes tasks to canonical execution, development, planning and documentation
instructions without adopting unrelated framework-specific examples. No global
Codex settings or automatic package install hooks are needed.

Vite builds root `index.html` and its frontend import graph; do not import
Playbook examples into runtime source. Vite watching explicitly excludes
`playbook/**`, Jest roots remain `src/`, and `.prettierignore` excludes Playbook.
There is no standalone frontend/backend lint or formatter command. No TypeScript
configuration is needed for this JavaScript project.

## Validation

```sh
bash -n scripts/playbook-common.sh scripts/setup-playbook.sh scripts/update-playbook.sh
./scripts/setup-playbook.sh --check
npm test
npm test --prefix auth-server
npm run build
git diff --check
```

The Vite build does not perform lint checks. Browser regression tests
are available separately with the local mock server and external request
blocking; do not run live OAuth for workflow changes. Record actual validation,
remaining warnings and deferred work in project documentation.
