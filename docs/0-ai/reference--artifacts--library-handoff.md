# Meet artifact generation and Library handoff

## Document Header

- **Audience:** Project owner, ChatGPT Web and Codex
- **Purpose:** Record artifact scope, backend context and pending Library synchronization.
- **Status:** reference
- **Last updated:** 2026-10-11

## Generation authorities

Canonical instructions under `playbook/docs/templates/0-ai/` were consulted:
`system/system--artifact-pack--spec.md`, `prompts/prompt--artifact--controller.md`,
and all five `prompt--artifact--generate-*` generators (src-tree, docs-tree,
project-overview, context-summary, snapshot). The integration module, root
AGENTS.md, execution protocol, naming and metadata contracts also apply.

The current user request authorizes generation of the full missing pack, including
required companions. No previous manifest/freshness baseline exists. All members
are regenerated; no artifact is acknowledged or skipped. Current HEAD is
`010d71449a4de3b4c25900b9387a5e6d97e5ef49`, branch `main`; Playbook is pinned at
`162a9d832acd73c9cb105ad5a5bc16b8135fb6ce`. Existing integration changes were
uncommitted before this run and remain preserved. The manifest records dirty
state; commit-only scope heads cannot capture those changes. The docs scope has
no committed history yet. No tests/build were rerun for this artifact task.

## Canonical schema boundaries and decisions

- SRC_TREE's generator explicitly requires `src/` only and excludes test/mock
  files, assets and external source. It cannot include `auth-server/` without
  violating the schema. Backend context is recorded below and in CONTEXT_SUMMARY.
- PROJECT_OVERVIEW prescribes root structure, frontend package JSON, dependency
  categories and Next.js/Tailwind detection; it has no prescribed backend-package
  or modernization-state fields. Those facts are recorded in the companion and
  summary, rather than inventing JSON fields. `nextRouterType: unknown` means
  no Next.js routing was detected, not that Meet's single-view routing is unknown.
- DOCS_TREE includes only `docs/`; root README, AGENTS.md, PHASE6_REPORT.md and
  AUTHENTICATION.md are referenced by the local docs index/summary rather than
  inserted into a different tree root. Playbook is not traversed or duplicated.
- Tree and overview generators say to use exactly their JSON structures. Their
  generatedAt is retained; identity/packId are authoritative in the manifest.
  Optional top-level meta objects were not added in conflict with exact schemas.
- No external JSON Schema files are supplied by these generators. Validation
  therefore checks their prescribed structures/field rules, inventories, sizes,
  hashes and metadata directly; it is not validation against an invented schema.
- Snapshot output keeps the canonical `.tsx` extension even though Meet is
  JavaScript. It is an exact-text context container, not runnable TypeScript or
  a dependency/compiler change. App.js is the single-view page equivalent;
  snapshot selection uses SRC_TREE and explicitly selected direct imports/core
  auth utilities, without recursive dependency bundling. Monitoring entry-point
  details are summarized instead of unnecessarily copying its public identifier.
- DOCS_TREE includes its own output and the manifest. Sizes are calculated after
  generation to a stable rounded-size inventory; the manifest omits its own
  self-referential hash and size as the controller permits.

Source tree excludes test/spec/storybook/mock files, test helpers, static data,
CSS/images, node_modules, builds, caches, Git internals and submodule internals.
Empty included source directories are retained. Root overview lists public/scripts
one level deep and other directories as names only; sensitive config/environment
contents are never read or copied. API endpoints/callbacks are public architecture
information, not secret credentials.

## Backend inventory and package context (project-owned companion)

| Repository-relative path | Role |
| --- | --- |
| `auth-server/handler.js` | CommonJS getAuthURL/getAccessToken/getCalendarEvents Lambda handlers; input/CORS validation and sanitized errors |
| `auth-server/serverless.yml` | Framework 3 declaration, nodejs18.x runtime, eu-central-1, POST/GET/OPTIONS API Gateway routes and packaging exclusions |
| `auth-server/package.json` | Independent auth-server 1.0.0 package; googleapis ^110.0.0; test script `node test/handler.test.js` |
| `auth-server/package-lock.json` | Backend dependency lock, not copied into the pack |
| `auth-server/test/handler.test.js` | Built-in node:test with replaced Google SDK, 41 historical passing checks |
| `auth-server/.gitignore` | Backend-local generated/secret exclusions |

Backend uses backend-only credential configuration. No config/environment values,
SDK exception payloads, bearer tokens or OAuth codes are included in the pack.
Backend implementation/test files are not duplicated as a noncanonical snapshot.
Upload the individual safe handler/config/test files separately only if a later
focused backend review needs exact source; never upload credential configuration.
No canonical backend snapshot schema exists in the pinned generator set.

## Validation and historical evidence

Generation validation covers exact JSON key sets/types, ISO timestamps, directory
nesting, repository-relative paths, source exclusions and resolved local imports,
counts, sizeKB rounding, controlled docs classification/tags, snapshot byte equality,
manifest SHA-256/byte sizes and consistency, and a sensitive-content scan.
The summary is below 150 lines. The docs index includes all new outputs.

Historical Phase 6 result: 97 frontend tests (88 unit/Gherkin plus 9 browser),
41 backend tests and successful build. Historical subsequent integration result:
88 frontend unit/Gherkin, 41 backend tests and successful build. Browser tests
were not rerun in that integration. These are recorded reports, not fresh test
execution during generation. Local OAuth was mocked; the live AWS API remains
on old contracts and was not contacted or inspected.

## Library Synchronization Handoff — pending

All six pack artifacts below are new and ready for upload after local generation
validation. Upload together so ChatGPT Web can verify the pack. Destination:
this Meet project's ChatGPT Web Library; Playbook defines no folder/collection
name beyond that. Nothing has been uploaded or marked Library-confirmed.

| Canonical filename | Repository-relative path | Purpose |
| --- | --- | --- |
| CONTEXT_SUMMARY.md | docs/0-ai/artifacts/CONTEXT_SUMMARY.md | Architecture, security, phase status, historical evidence and constraints |
| PROJECT_OVERVIEW.json | docs/0-ai/artifacts/PROJECT_OVERVIEW.json | Root/tooling/public/scripts and frontend package metadata |
| DOCS_TREE.json | docs/0-ai/artifacts/DOCS_TREE.json | Classified project-owned docs/generated inventory |
| SRC_TREE.json | docs/0-ai/artifacts/SRC_TREE.json | Canonical production frontend source/import inventory |
| SRC_SNAPSHOT_1.tsx | docs/0-ai/artifacts/SRC_SNAPSHOT_1.tsx | Exact selected frontend/auth source context |
| ARTIFACT_PACK_MANIFEST.json | docs/0-ai/artifacts/ARTIFACT_PACK_MANIFEST.json | Pack identity, provenance, integrity and freshness anchor |

Also upload this project-owned companion at
`docs/0-ai/reference--artifacts--library-handoff.md` for backend package/inventory
coverage and schema limitations. It is supporting documentation, not a pack
member. Reusable Playbook templates are not part of the handoff.

Predev-stage bundles are optional, require a selected approved stage manifest,
and compile reusable template sources. No Predev bundle or bespoke combined
bundle was generated for this backend modernization context. Audit reports are
not mandatory pack members; this companion records the generation review.

After Phase 7A, refresh overview/summary/backend companion and the full manifest;
check trees and snapshots for source/config impacts. After Vite/Atatus changes,
refresh overview/source tree/snapshot/summary. After UI redesign, refresh source
tree/snapshot/summary; after Cloudflare deployment, refresh overview/summary and
record actual live evidence. Refresh DOCS_TREE whenever project docs change.
Prefer a full controller run after each phase and upload refreshed outputs plus
manifest. Approval of a broader backend JSON/snapshot schema is a future
Playbook maintenance decision; no submodule changes are made here.
