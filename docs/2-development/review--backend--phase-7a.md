# Phase 7A — backend modernization review

## Document Header
- **Audience:** Project owner, maintainers and Codex
- **Purpose:** Record local modernization, verification, packaging limits and live-test prerequisites.
- **Status:** reference
- **Authority:** Explicit Phase 7A user request; no deployment/lifecycle authorization inferred.
- **Last updated:** 2026-10-11

## A. Backend modernization summary
Clean starting HEAD was 8c6cd7e. Baseline: Node 24.21.0/npm 11.19.0,
41 backend tests passed, audit six affected entries (two high/four moderate).
Backend runtime is now nodejs24.x with engines >=24 <25 and .nvmrc=24.
Google SDK and CLI are exact backend-only pins. All Phase 6 handlers, function
names, state/S256 PKCE/code exchange/bearer/CORS/security architecture remain.
No handler compatibility rewrite was required. Official [AWS runtime table](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html)
lists Node 24; [Serverless releases](https://github.com/serverless/serverless/releases)
include Node 24 support. Real installed Google SDK was exercised offline on Node 24.

## B. Dependency comparison
| Dependency/config | Previous | Current |
| --- | --- | --- |
| Lambda runtime | nodejs18.x | nodejs24.x (local YAML only) |
| Serverless | Framework 3 declaration, no local dependency | 4.43.0 pinned dev dependency and frameworkVersion |
| googleapis | 110.0.0 installed, ^110.0.0 manifest | 185.0.0 exact |
| googleapis-common | 6.0.4 | 9.2.0 |
| google-auth-library | 8.9.0 | 11.2.0 |
| gaxios | 5.1.3 | 7.3.1 |
| jws | 4.0.0 | 4.0.1 |
| node-forge | 1.3.1 | removed |
| qs | 6.11.2 | 6.16.0 |
| uuid | 9.0.0 | removed |
| undici | absent | 6.28.1 (CLI launcher transitive/dev) |

Fresh non-modifying npm audit: **0 vulnerabilities**, all severities zero.
Six former affected package entries resolved: direct googleapis and transitive
common/qs/uuid (moderate), jws/node-forge (high). Direct SDK/common findings were
inherited dependency involvement rather than evidence of exploited application
code. Old signing/certificate paths were not central to the authorization-code
flow, but remained installed production dependency risks. Updated supported SDK
removes/upgrades the affected paths without forced overrides/audit fix --force.

Google SDK 185 and auth library 11.2 require Node >=22, compatible with target 24;
Serverless launcher declares >=18.17. Runtime relevance is checked through actual
SDK fake-transport tests, not just mock-class tests. Installation warned about
transitive node-domexception deprecation; audit is clean, not a guarantee of no
unknown vulnerabilities. No frontend dependency/lockfile changed.

Serverless v4's npm package launches/downloads vendor code. Its embedded binary
is not present/audited by this npm audit because lifecycle scripts were skipped.
Authenticated vendor execution, telemetry, license and cloud tooling remain
operational risks for subsequent review. Exact frameworkVersion controls automatic
updates as described in [v4 migration guidance](https://www.serverless.com/framework/docs/guides/upgrading-v4).

## C. Serverless configuration
Service auth-server, eu-central-1, existing handlers and six POST/GET/OPTIONS
route events are preserved. New local stage allowlist contains only localtest;
selectedStage derives from it, so dev/arbitrary options have no configured mapping.
Packaging wrapper independently requires exactly --stage localtest before spawn.
No deploy/remove/invoke script or live-stage deployment command was introduced.
Framework variable-resolution behavior is still pending authenticated validation.

YAML credential inputs now use required env CLIENT_ID/CLIENT_SECRET/CALENDAR_ID,
not file(config.json). No actual credential file/value was read, created or copied.
OAUTH_REDIRECT_URIS remains a trusted exact callback array defaulting to the current
production callback; localhost must be explicitly enabled in the future isolated
stage. No arbitrary frontend-chosen redirect is accepted. Missing/invalid handler
configuration is covered by tests.

esbuild is disabled to preserve CommonJS/classic production dependency packaging.
Allowlist includes handler.js and node_modules, excluding declaration/source maps,
caches and all service docs/tests/scripts/secrets. Default dev exclusion needs final
Framework verification. No custom AWS IAM permissions are introduced; default
Lambda logging role/template must be reviewed later. API Gateway restApi logging is
disabled, Lambda retention is 14 days, handler diagnostics remain sanitized.

## D. Testing and verification
- Backend: **52 passed** = 46 handler tests + 3 real installed SDK transport tests + 3 config/stage-guard tests.
- Frontend component/Gherkin: **88 passed**, 13 suites.
- Local mock browser: **9 passed**; all external requests intercepted/aborted.
- Frontend production build: **compiled successfully**, existing /meet/ hosting base and identical bundle sizes.
- Backend npm audit: **0 affected entries**, versus baseline 6.
- Production-only ZIP rehearsal SDK tests: **3 passed**, additional repeated compatibility checks, not added to the 52 count.
- Static config/pin checks and git diff --check passed. Static checks are not full YAML/Serverless schema validation.

Google client tests replace transporter.request in memory, checking generated
state/challenge, POST verifier/redirect and token expiry_date conversion, bearer
header and ordered Calendar query. Handler additions cover invalid/expired
upstream tokens and malformed callback config. Existing tests retain sanitized
errors, denial, bearer rejection and CORS/preflight checks.

Application tests/build ran freshly in this phase. Existing Browserslist and dev
server/Node deprecation warnings remain; no frontend upgrades were attempted.
The existing mocked handler suite is invoked directly with node because its
CommonJS loader replacement yields only a file-level result under isolated
node --test; three direct built-in test-runner processes retain actual counts.
Only npm registry/advisory traffic and official public documentation were accessed.
No AWS API, Google OAuth/Calendar endpoint, account/login or infrastructure call
occurred. No live behavior is certified. Rehearsal setup initially encountered an
incomplete offline npm cache; a registry-backed isolated npm ci completed safely.

## E. Packaging assessment
Official [Serverless packaging documentation](https://www.serverless.com/framework/docs/providers/aws/guide/packaging)
states AWS credentials may be required even for packaging; v4 also requires
authentication. That operation was stopped before invocation. No account was
created, key supplied, license accepted or Dashboard service configured. The
installed launcher postinstall was skipped to prevent a vendor binary download.
No official Serverless ZIP, resolved config or CloudFormation output is claimed.

An isolated /tmp production-only npm ci --omit=dev --ignore-scripts was performed
from the backend manifest/lock, then a ZIP rehearsal used the configured file
allowlist. After removing nonruntime declarations/maps it contains **1,860 files,
8,816,951 compressed bytes and 62,522,833 uncompressed bytes**. It retains handler
and runtime SDK modules/licenses; excludes Serverless/dev modules, service tests,
config.json, docs/scripts and source maps/types. Installed SDK tests also pass
against extracted trimmed dependencies. No credential file was accessed.

Untrimmed SDK rehearsal was 257,890,605 uncompressed bytes, close to Lambda's
250 MiB allowance; declaration/map exclusions remove ~195 MB without changing
runtime JS. Final actual package contents/limits, dependency pruning and template
must be inspected in the authorized authenticated session; the /tmp rehearsal
is not deployable infrastructure evidence and is not tracked.

## F. Files changed
- auth-server/package.json, package-lock.json: exact SDK/CLI pins, engines and local scripts.
- auth-server/.nvmrc, README.md: runtime declaration and non-secret workflow (new).
- auth-server/serverless.yml: runtime, pin, guarded stage, env inputs, logging and package exclusions.
- auth-server/scripts/check-local.cjs, serverless-package.cjs: offline static checks and packaging guard (new).
- auth-server/test/handler.test.js: targeted invalid/expired response/config regressions.
- auth-server/test/sdk.test.js, config.test.js: offline installed SDK and guard checks (new).
- AUTHENTICATION.md, AGENTS.md: current local backend configuration/handoff.
- docs/project-management/project--execution-plan.md, project--progress-log_001.md: bounded approved plan and progress record (new).
- docs/2-development/review--backend--phase-7a.md: this completion review (new).
- docs/README.md and AI handoff companion: index/status/context updates.
- Canonical artifact pack: controller refresh with preserved schemas/manifest integrity; Library sync pending.

## G. Playbook compliance
Applied root AGENTS, execution protocol, Dev 1 controller/integration/foundation
review checklist, project execution-plan/progress guidance, naming/metadata and
artifact controller/generators. Plan was written before dependency implementation;
review/progress distinguish local completion, blocked operations and later approval.
This is bounded existing-project setup, not a new Next.js foundation or formal full
Dev 1 milestone. Historical Phase 5/6 reports/commits are preserved. A standalone
Phase 5 report, complete earlier lifecycle mapping and backend lint/format adoption
remain documentation/tooling gaps, not silently rewritten scope.

Playbook stays pinned at 162a9d8 and unmodified. Artifact schema remains frontend
src-only; backend context stays in the companion/summary. No artifacts uploaded.

## H. Deployment preparation
Next authorized phase must select/approve Serverless authentication and verify
licensing eligibility. Current [pricing guidance](https://www.serverless.com/pricing)
requires licensing for organizations above its stated revenue threshold; eligibility
and potential charges have not been determined for this project. Do not accept
paid terms by implication. No Dashboard service is necessary merely for this
local modernization; permitted authentication mode must be chosen by the owner.

Then approve an isolated AWS identity/account/stage and separate development Google
client/callback; securely provision required environment outside source; run guarded
packaging, inspect final zip/IAM/template/logging, ensure localtest identity and
current AWS charges, and only then separately authorize test deployment. Perform
real callback/consent/PKCE/token/Calendar/preflight verification there. Existing
production callback and live /dev remain untouched. Future production replacement
must coordinate frontend/backend only after verification. Phase 7B remains unstarted.

## I. Outstanding decisions
Local modernization is complete. Blocked work requires approval/account access:
Serverless authentication/license eligibility and an isolated AWS/testing OAuth
setup, followed by official config/package/template validation. These are next
phase prerequisites, not reasons to upgrade unrelated frontend code. No commit,
push, deployment or further modernization was performed.
