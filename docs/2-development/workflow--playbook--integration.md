# Playbook setup and updates

## Document Header

- **Audience:** Developers and Codex
- **Purpose:** Initialize and deliberately update the read-only Playbook submodule.
- **Status:** reference
- **Last updated:** 2026-10-12

`playbook/` is pinned by the parent Gitlink; never edit its files or automatically
track upstream. The current integration pin is
`162a9d832acd73c9cb105ad5a5bc16b8135fb6ce`; the parent branch's committed Gitlink
is authoritative after switching branches. Project outputs stay outside Playbook.

## Initialize or restore the committed pin

From the project root after cloning or changing branches:

```sh
./scripts/setup-playbook.sh
./scripts/setup-playbook.sh --check
```

Setup synchronizes the registered URL, initializes/checks out the exact parent pin
and configures sparse checkout for `docs/templates/0-ai`, `0-project-management`,
`1-pre-development`, `2-development` and `3-post-development`. Initial setup may
need GitHub access. `--check` is offline/read-only. Detached HEAD is expected.
Helpers refuse conflicting local submodule changes; preserve and review them.
They do not install dependencies, stage changes or commit.

## Update only to an explicitly approved revision

```sh
./scripts/update-playbook.sh <approved-full-40-character-commit-sha>
git diff --submodule=log -- playbook
```

The helper requires a clean checkout matching the current pin, fetches only the
approved revision and reapplies sparse checkout. Branch names, tags and abbreviated
SHAs are rejected. Review changed guidance and the Gitlink before any separately
authorized commit. To restore the committed pin, run setup after preserving local
work; never force away edits.

Root [AGENTS.md](../../AGENTS.md) routes selective guidance. Vite watching and
formatter exclusions protect Playbook; do not import reference examples into
runtime source. Small changes do not require full planning or context-pack runs.
The canonical [integration module](../../playbook/docs/templates/2-development/dev-1--project-setup/modules/playbook-integration/module--dev-1--playbook-submodule-integration.md)
remains the setup authority. Context packs are optional on-demand handoffs.
