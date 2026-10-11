# Meet incremental modernization execution plan

## Document Header
- **Audience:** Project owner and Codex
- **Purpose:** Bound incremental modernization and distinguish preparation from approved live execution.
- **Status:** reference
- **Authority:** Explicit Phase 7A user instruction; not retrospective full lifecycle approval.
- **Last updated:** 2026-10-11

## Scope and sequence
Phases 5 and 6 are committed at 3888770 and eb561aa. Playbook integration/artifacts
are committed at 8c6cd7e; the clean starting HEAD was that checkpoint. Existing
live AWS /dev remains on old contracts and must not be targeted.

Selected Playbook authorities: execution protocol, Dev 1 controller (bounded
existing-project work), integration module, foundation audit, execution-plan and
progress-log guidance, documentation naming/metadata, artifact controller and
five generators. No Next.js or Cloudflare Worker module is selected.

Phase 7A authorizes: baseline tests/audit; supported Node 24 configuration;
exact Serverless v4 and Google SDK dependency pins; secure isolated-stage config;
SDK/handler tests; offline validation and package inspection; docs/audit and
artifact refresh. No actual credentials are read, created or copied.

Implementation sequence: baseline → select official compatible releases → update
backend manifests/config → test real SDK with fake in-memory transport and existing
mocked handlers → audit → frontend regression/build → packaging assessment →
review/report/context refresh. npm registry and official documentation access are
authorized dependency research, not live Google/AWS API verification.

Completion requires preserved OAuth/state/PKCE/bearer contracts, passing local
tests/build, explicit vulnerability dispositions and recorded packaging limitations.
Authenticated Serverless packaging is deferred if it needs an account/license or
AWS access. Safe local work continues; no account creation or licensing acceptance.

Later independent instructions must authorize isolated AWS testing, runtime
rollout, frontend/Vite/Atatus work, Stitch redesign, Cloudflare migration and
production replacement. No deployment, commit/push, submodule update or Phase 7B
is authorized here. Backend lint/format and full lifecycle mapping remain separate
planning decisions; this plan records only known approved modernization scope.

## Phase 7B.1 — approved preparation and Phase 7B.2 gates

Phase 7A is committed at 6289ae6. The explicit Phase 7B.1 request authorizes
read-only inspection, official documentation research, offline regression/static/ZIP
checks and project-owned documentation/context updates. No source/config/dependency
changes, vendor authentication/terms, AWS API operations, Google changes, deployment,
real OAuth, commit/push or Playbook update are authorized. Existing untracked exports
are preserved and credential contents are not inspected.

Sequence: review evidence → research auth/storage/consent prerequisites → rerun offline
checks → record manual setup/matrix/isolation/cost → publish preparation review/log
and refresh only affected context. Preparation completion means a reviewable plan,
not certified deployable infrastructure. See
[Phase 7B.1 review](../2-development/review--testing--phase-7b-1.md).

Phase 7B.2 needs owner decisions on vendor eligibility/authentication, AWS identity
and shared storage, Google client/consent isolation and spending tolerance. Official
packaging can access/write AWS S3/SSM; approve that scope separately. Inspect final
ZIP/template/IAM/stage before specific deployment approval, then authorize live OAuth
separately. Existing /dev and production Google client/frontend stay untouched.
