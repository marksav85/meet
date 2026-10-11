# Meet incremental modernization execution plan

## Document Header
- **Audience:** Project owner and Codex
- **Purpose:** Bound Phase 7A implementation and record subsequent unapproved stages.
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
