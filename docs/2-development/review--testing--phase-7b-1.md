# Phase 7B.1 — isolated AWS and Google OAuth testing preparation

## Document Header

- **Audience:** Project owner, maintainers and Codex
- **Purpose:** Record offline evidence, manual setup and approval conditions for isolated integration testing.
- **Status:** reference
- **Authority:** supporting
- **Last updated:** 2026-10-11

Preparation is complete. **Deployment readiness is conditional, not certified.**
No Serverless authentication, AWS API/CLI operation, Google Console change,
real OAuth flow, production request, deployment, dependency change or commit occurred.
The manual procedures below describe future owner actions; they were not executed.

## A. Current infrastructure assumptions

| Evidence level | Facts |
| --- | --- |
| Repository verified | main at `6289ae66a07c829e689d28215e2423105989d606`; Playbook pin `162a9d832acd73c9cb105ad5a5bc16b8135fb6ce` passes read-only check; Node 24.21.0/npm 11.19.0; separate CRA/React JS frontend and CommonJS backend |
| User/project records | AWS account is owner-controlled, eu-central-1; live service auth-server/dev has getAuthURL/getAccessToken/getCalendarEvents functions; Google project uses an External, In production Web client, enabled Calendar API, public-readonly scope and `https://marksav85.github.io/meet/` callback |
| Inferred from local YAML and Framework conventions | localtest should have its own stack, three functions, REST API/stage, log groups, execution role and invocation permissions; deployment storage can be shared |
| Unverified | Actual AWS identity/permissions, deployed resources, bucket/state ownership, account quotas/billing, Google Console status, client creation, Calendar access, official Framework resolution/template/package, live OAuth/CORS behavior |

Tracked files were clean at the checkpoint. An untracked `docs/aws--lambda-functions/`
export directory appeared during preparation. It is preserved without content review;
credential files and exported implementation are not used as infrastructure evidence.
It was concurrently renamed from aws--lamda-functions to aws--lambda-functions,
and the owner edited .gitignore. Those changes are preserved. Its directory names
may appear in DOCS_TREE; credential/source files and dependency
contents are excluded by canonical documentation-tree rules. Review exports separately
before tracking or sharing them. No secrets were opened or copied.

Consulted root AGENTS, current execution plan/log, Phase 7A review,
AUTHENTICATION.md, backend README, manifest/context, and pinned Playbook execution
protocol, Dev 1 controller, documentation naming/metadata contracts, project-management
controller and artifact controller/spec/relevant generators. Applied bounded existing-
project work, explicit deferrals, proportional validation and indexed project-owned
outputs. This is not retrospective full Dev 1/lifecycle approval or a new app foundation.

## B. Serverless Framework requirements

Framework 4.43.0 is pinned both in the backend manifest/lock and YAML. v4 requires
vendor authentication: interactive Dashboard sign-in, a Dashboard access key for
automation, or a license key. A license key is supported but requires an active
subscription and administration through an account (or vendor support); it is not
a free anonymous workaround. Dashboard deployment features are optional.
See [v4 upgrade guidance](https://www.serverless.com/framework/docs/guides/upgrading-v4)
and [license-key guidance](https://www.serverless.com/framework/docs/guides/license-keys).

Current pricing says individuals/organizations earning **over $2M in the last fiscal
year** need a subscription; most others can use the CLI free. Owner eligibility is
unconfirmed. AWS charges remain separate. Dashboard has its own commercial features.
The pricing page also contains a dated transition statement about package-command
usage tracking: do not assume packaging is permanently exempt from billing. Confirm
terms/current account billing immediately before use. No subscription, card or AWS
Marketplace purchase is authorized. [Serverless pricing](https://www.serverless.com/pricing).

Account use involves additional vendor terms, not merely the npm package's license.
The owner must review and accept applicable signup/use terms personally; this phase
accepts nothing. Vendor authentication/license validation and usage telemetry require
external vendor access. A license key reduces Dashboard requests but still validates
and sends license telemetry. [Terms](https://www.serverless.com/legal/terms),
[privacy](https://www.serverless.com/legal/privacy), [license keys](https://www.serverless.com/framework/docs/guides/license-keys).

Current YAML has no `app`, `org`, observability, Dashboard plugin or instrumentation
configuration. It does not request Dashboard deployment/monitoring features. `app`
activates those features; do not add it during sign-in. Account defaults and downloaded
CLI behavior still need review; absence of configuration is not a billing guarantee.
[Framework configuration](https://www.serverless.com/framework/docs/providers/aws/guide/serverless.yml).

### Future manual sign-in procedure — only after authentication approval

1. Confirm free eligibility or an explicitly approved subscription, then review vendor
   terms/privacy. Use the owner's existing account where suitable. Sign-in may create
   a vendor organization; do not connect AWS accounts, accept paid trials, purchase
   subscriptions or enable Dashboard features as part of this step.
2. In a private terminal using Node 24, open `auth-server/` and run the installed,
   project-local launcher: `node node_modules/serverless/run.js login`.
   Use a session with no AWS credential provider/profile available; stop if any AWS
   authentication or additional setup is requested. Do not use global CLI/npx.
3. Follow its vendor browser sign-in prompt. The launcher may first download the
   pinned vendor CLI; this download and vendor execution also require approval.
   Current public docs can describe behavior newer than 4.43.0: stop on unexpected
   prompts rather than changing the pin or selecting another command.
4. Keep the resulting local session private/outside the repo. Inspect Git status for
   unexpected configuration changes; stop if project files changed. Record only the
   selected authentication method, eligibility confirmation and date—never session/key
   values. Successful sign-in authorizes neither AWS access nor packaging/deployment.

[Login documentation](https://www.serverless.com/framework/docs/providers/aws/cli-reference/login).
A pre-existing approved subscription can instead supply `SERVERLESS_LICENSE_KEY`
through a protected CLI-only environment. `SERVERLESS_ACCESS_KEY` is an alternative
Dashboard automation secret; neither key belongs in YAML, frontend or artifacts.
Do not create keys or SSM license parameters automatically.

**Official packaging blocker:** vendor authorization plus valid AWS credentials are
required. Documentation says packaging checks SSM/S3 and may write state/deployment
storage. It cannot meet this phase's no-AWS-operations/no-resource-changes restriction.
It was stopped before invocation, not forced with dummy credentials or guard bypasses.
[Packaging requirements](https://www.serverless.com/framework/docs/providers/aws/guide/packaging).

## C. Google development OAuth configuration

The owner can create a separate client in the existing project when ready:

1. Open Google Cloud Console and select the existing verified project by its label/ID.
   Inspect Google Auth Platform → Branding, Audience, Data Access and verification
   status; confirm the user-reported settings. Inspect APIs & Services → Enabled APIs
   for Google Calendar API. Do not change project publishing status, scope or branding.
2. Google Auth Platform → Clients → Create client → **Web application**.
   Suggested console-only name: `Meet-localtest`. Do not edit the existing client.
3. Authorized redirect URI: **`http://localhost:3000/`**, including trailing slash.
   Do not substitute 127.0.0.1, `/meet/`, another port or the AWS API URL.
4. This implementation redirects via a backend-generated URL and exchanges codes
   server-side; it does not use a browser Google OAuth SDK. An authorized JavaScript
   origin is not required for that redirect flow. If registering the local browser
   origin, use **`http://localhost:3000`**, with no path/trailing slash, on the new
   client only. Do not broaden production origins or callbacks.
5. Create only the new client. Handle its secret privately for later protected backend
   provisioning; do not send it to Codex or download a credential JSON into the repo.
6. Record non-sensitive project label/ID, client display name/ID, Web application type,
   exact redirect/origin settings, enabled API, scope, publishing/verification status,
   creation/check date and whether any additional verification is requested.
   These can remain in the owner's private configuration record; do not record secrets.

[Google client creation](https://developers.google.com/workspace/guides/create-credentials),
[web-server OAuth and redirect rules](https://developers.google.com/identity/protocols/oauth2/web-server).

Consent branding, External audience, publishing/verification and quota policies are
project-level. A second client in this In production project is **not a separate
Testing audience** or test-user-only sandbox. Do not switch the shared project to
Testing: it can affect production clients. Check the new client against existing
approved scopes; no guarantee of Console approval is inferred from old verification.
A separate project would be needed for independent consent/audience isolation, and
is an owner decision rather than automatic additional setup.
[Google audience guidance](https://support.google.com/cloud/answer/15549945).

Keep the full scope `https://www.googleapis.com/auth/calendar.events.public.readonly`.
It permits events on public calendars; choose a known public test calendar and
confirm its ID/visibility without making a production/private calendar public.
Do not broaden permissions. The new client is used only by localtest Lambda:
browser → localtest auth URL → Google → localhost callback → localtest exchange.
The redirect is the browser's localhost address, not API Gateway's address.
[Calendar scopes](https://developers.google.com/workspace/calendar/api/auth).

## D. AWS testing stage and isolation

| Proposed resource | Derived name/isolation expectation | Required later verification |
| --- | --- | --- |
| CloudFormation | `auth-server-localtest` (default convention; no stackName override) | Confirm new stack and no import/update of dev resources |
| Lambda | `auth-server-localtest-getAuthURL`, `auth-server-localtest-getAccessToken`, `auth-server-localtest-getCalendarEvents` | Confirm actual names/runtime/role and no name collision |
| CloudWatch logs | `/aws/lambda/` followed by each proposed function name | New groups, 14-day retention; retention implementation may add helper resources |
| API Gateway | New REST API and localtest stage; generated API ID unknown | Confirm distinct API ID from dev, integrations and invoke permissions |
| API URL | `https://<generated-api-id>.execute-api.eu-central-1.amazonaws.com/localtest` | Placeholder only; record actual non-secret base URL after approved deployment |
| IAM | Expected stack-specific Lambda logging role, invocation permissions; exact physical role name/ARN not asserted | Review all roles/policies and any Framework helper Lambda role |
| Deployment ZIP/templates/state | Stage-specific artifacts; **storage can be shared** | Inspect S3 bucket, object prefixes, SSM/state and encryption/ownership |

YAML has no explicit reused API ID, role ARN, stack name, bucket, domain, VPC or
custom resources. Static absence is favorable evidence, not proof of generated
resource isolation. Default resource conventions must be checked in the official
pinned template. [Framework configuration](https://www.serverless.com/framework/docs/providers/aws/guide/serverless.yml).

For a new v4 stack, the default deployment bucket can be shared across services in
an account/region. Existing pre-v4 stacks may retain their old bucket. Thus the dev
bucket relationship is unknown; never assume a new stage gets a private bucket.
The documented SSM location is `/serverless-framework/deployment/s3-bucket`; actual
bucket names include a generated suffix and are not invented here. Cleanup must
never delete shared storage. Packaging storage writes must be approved separately
from deploying application resources. [Deployment storage](https://www.serverless.com/framework/docs/guides/deployment-bucket).

Guard evidence: only localtest exists in custom.allowedStages; absent option defaults
to localtest, dev/arbitrary mappings are absent. Package wrapper requires exactly
`--stage localtest` before spawn, rejecting extra arguments. No backend deploy/remove/
invoke script exists. Framework resolution is unverified and raw CLI bypass remains
possible; these are safeguards, not an AWS permission boundary. Root `npm run deploy`
is the existing production frontend publisher and must not be used for this plan.
A later deployment workflow must independently verify identity, region and resolved
stage and deny dev mutation; do not copy a raw deploy command from a tutorial.

### Owner read-only AWS Console verification

Use a read-only Console session; confirm account alias/identity and eu-central-1.
In CloudFormation inspect auth-server-dev → Resources and Outputs; map its Lambda,
API, logs, roles and deployment bucket. Check whether auth-server-localtest already
exists; stop on unexpected ownership/collision. Inspect API Gateway dev ID/stage,
Lambda runtime/roles, IAM policies (including boundaries/SCP restrictions), S3 bucket
properties/object prefixes and SSM parameter **names/metadata** for Framework state.
Do not reveal secret parameter values, Lambda environment values or credential files.
Record only resource identifiers, ownership/isolation findings and check date.
No Update/Delete/Edit/Test/Invoke buttons or Stack change operations.

Select an approved least-privilege testing identity, preferably temporary credentials
with MFA/SSO; account ID/role ARN need owner confirmation. CloudFormation provisioning
needs reviewed Lambda/API Gateway/logs/IAM pass-role/create-policy permissions and
Framework S3/SSM access, distinct from the runtime's logging-only AWS needs. Exact
permissions cannot be certified before template/storage review; do not grant broad
AdministratorAccess simply to make packaging pass. If same-account storage access
cannot avoid production mutation, stop and select a separately approved isolation
strategy (dedicated account or reviewed storage/configuration change).

## E. Environment and secrets

| Variable | Purpose/component | Sensitivity | Secure supply/testing difference |
| --- | --- | --- | --- |
| CLIENT_ID | Lambda Google OAuth client | Public identifier, backend configuration | Protected deployment environment; new development client, never reuse production client |
| CLIENT_SECRET | Lambda code exchange | Secret | Owner-controlled secret manager/private environment injection outside repo/history; development secret only |
| CALENDAR_ID | Lambda Calendar query | Non-secret identifier, may reveal metadata | Owner-supplied known public test calendar; can differ from production |
| OAUTH_REDIRECT_URIS | Lambda exact callbacks/CORS origins | Non-secret trusted policy | Explicit JSON array `["http://localhost:3000/"]` for localtest; override production-only default |
| REACT_APP_DATA_MODE | Development frontend | Public | `oauth` only in a separately approved local session; current tests use mock |
| REACT_APP_API_BASE_URL | Development frontend API base | Public | Actual isolated URL including `/localtest`, without `/api`; pending deployment |
| REACT_APP_OAUTH_REDIRECT_URI | Development frontend callback | Public | `http://localhost:3000/`; leave production build configuration unchanged |
| AWS_PROFILE / AWS_REGION | CLI identity selection/region | Non-secret profile alias/region | Approved external credential provider/profile; region eu-central-1; no credentials in repo |
| AWS credential-provider session | CLI AWS authentication | Secret credentials/session | Temporary approved provider outside repo; not Lambda or frontend env; do not record values |
| SERVERLESS_LICENSE_KEY / SERVERLESS_ACCESS_KEY | Optional selected CLI authentication alternative | Secret | Private CLI-only injection; neither required alongside an approved interactive session |

Only the four listed backend variables are used by current implementation/YAML;
there are no additional app secrets, refresh-token stores or database inputs.
No secret-storage infrastructure is proposed solely for this phase.

Use a clean, dedicated future localtest shell with explicit development values.
Serverless v4 automatically reads backend .env/.env.stage files; inherited process
variables can also select unintended configuration. No backend dotenv filenames
were present during the name-only check. Recheck presence privately before later
packaging, without dumping values. Do not create credential files; inject protected
values without shell-history literals or command-line secret arguments. Preserve
trusted exact callbacks and CORS deriving only `http://localhost:3000`, with
Content-Type/Authorization allowed, no cookies/wildcards. Do not include the
production callback in localtest's allowlist merely because it is the YAML default.
[Dotenv behavior](https://www.serverless.com/framework/docs/guides/upgrading-v4).

For later frontend testing set the three public variables only in the dedicated
localhost process, after recording the real localtest URL. Keep the production
frontend/build/deployment untouched. Clear the local session afterward.

Resolved `.serverless` state/CloudFormation templates can contain CLIENT_SECRET
because provider.environment substitutes it. ZIP exclusion does **not** protect
these generated files, terminal `print` output, recordings or upload storage.
Restrict local artifact access and deployment-storage access/encryption; inspect
structure with secret values redacted. Never upload resolved templates/state,
credentials, codes, tokens or header/body dumps to Library or Git. Future teardown
of local secret-bearing artifacts must be authorized and scoped to those artifacts.

## F. Packaging and validation

Fresh offline checks passed: installed check:local; js-yaml syntax/structural parsing
without environment resolution; exact dependency/lock pins; three handlers/six events;
stage allowlist/wrapper rejection tests; logging/environment references; absence of
custom shared resource/IAM overrides. These are **not official Framework validation**.

Retained Phase 7A ZIP rehearsal rechecked: 1,860 files, 8,816,951 compressed bytes,
62,522,833 uncompressed bytes; archive integrity, allowlist, licenses/runtime modules,
no service config/tests/scripts or Serverless CLI, no dependency maps/declarations.
Three SDK checks pass against its extracted trimmed dependencies. No installation
or new dependency resolution occurred. Untrimmed Phase 7A size was 257,890,605 bytes;
trim exclusions provide headroom. Lambda ZIP upload limit is 50 MiB and uncompressed
package/layers limit 250 MiB; inspect final actual sizes, not just this rehearsal.
[AWS Lambda quotas](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html).

Runtime needs handler.js and locked production Google SDK dependencies/runtime
JS/JSON/licenses. `!**` then handler/node_modules inclusions exclude service credential
files, tests, scripts, docs and Playbook. Framework's dev-dependency pruning must be
verified: local node_modules includes the dev CLI, unlike the production-only rehearsal.
Dependency fixture/docs exclusion is not guaranteed by current node_modules/** pattern;
review final inventory for unwanted dependency data as well. A concurrent owner .gitignore edit adds the export-directory ignore and removes
the previous `/secrets` rule. That removal should be reviewed/restored before any
future secret-file workflow; no ignore fix or secret file is introduced by this phase.
No handler logs request
bodies/headers; only operation, safe error code and status on server errors.

After **separate approval for vendor/AWS access and potential storage writes**, the
only configured package command is:

`npm run package:localtest --prefix auth-server -- --stage localtest`

It is documented for later use and was not executed. Review the pinned generated
package/template before authorizing deployment: nodejs24.x, version/region/localtest,
three handler names, POST/GET/OPTIONS routes, new API/invocation permissions, execution
role limited to required logging, helper resources, 14-day logs, no request/body/header
logging, protected environment, S3/SSM storage relationships, no dev mutations/imports,
no Dashboard instrumentation and final ZIP exclusions/size. Lambda proxy OPTIONS
should reach existing strict handlers; no `cors: true` wildcard is configured.
API Gateway-generated errors/CORS are still a live integration check, not covered
by mocked handler tests. Framework binary download, template generation and full
variable/schema resolution remain unperformed.

## G. Cost and security considerations

| Service | Estimate inputs and potential charges |
| --- | --- |
| Lambda (three app functions; possible helper) | Request count, memory × duration, initialization behavior and helper executions; [pricing](https://aws.amazon.com/lambda/pricing/) |
| REST API Gateway | Requests including OPTIONS and failures, response transfer; REST pricing differs from HTTP API; [pricing](https://aws.amazon.com/api-gateway/pricing/) |
| CloudWatch | Log ingestion/storage and any enabled metrics; 14-day app retention configured; inspect helper retention; [pricing](https://aws.amazon.com/cloudwatch/pricing/) |
| S3 | ZIP/templates/state storage, requests and version retention in possibly shared bucket; [pricing](https://aws.amazon.com/s3/pricing/) |
| SSM | Framework storage metadata/state discovery; parameter tier and API throughput matter; [pricing](https://aws.amazon.com/systems-manager/pricing/) |
| CloudFormation/IAM | Standard AWS resource stack orchestration has no additional CloudFormation charge; underlying resources and any third-party/custom hook operations differ; roles/permissions must be reviewed; [pricing](https://aws.amazon.com/cloudformation/pricing/) |
| Serverless vendor | Conditional CLI licensing and separately optional Dashboard/monitoring charges; Section B |

No precise bill is asserted: duration/memory, session count, traffic, storage lifetime,
account Free Tier/credits and current regional rates are unknown. One successful
fresh authorization normally makes three app calls, plus browser preflights/retries/
Calendar refreshes; measure actual traffic before estimating. No VPC/NAT/database,
custom domain, provisioned concurrency or extra monitoring is selected locally;
template must confirm no unexpected resources.

Owner should inspect Billing → Bills/current usage, Free Tier/credits and Cost Explorer
where available, comparing eu-central-1/service usage with the existing baseline.
Confirm budget tolerance before testing; alerts are not spending caps. Recommend short
scheduled sessions, minimal retries, retained 14-day logging and a separately approved
cleanup plan covering only localtest resources and its artifact prefixes. Do not
create budgets/alarms or delete shared buckets/parameters during this preparation.

CORS is a browser policy, not a network access-control or spending boundary. The
proposed public API has no added API key/authorizer or explicit throttling/concurrency
limits; non-browser abuse can still consume shared account quotas and cost. Review
acceptable exposure and localtest-only limits before rollout, without rewriting code
here. Same-account stage isolation does not isolate quotas/billing; same Google
project does not isolate audience/quotas. Keep PKCE/state/in-memory-token security,
no refresh tokens, no auth caching and sanitized logging exactly as Phase 6 established.

## H. Actual regression results

| Current Phase 7B.1 check | Result |
| --- | --- |
| Backend npm test | 52 passed: 46 handler + 3 installed SDK fake-transport + 3 config/guard |
| Frontend component/Gherkin | 88 passed, 13 suites |
| Local mock browser | 9 passed, 1 suite; external requests intercepted/aborted |
| Frontend production build | Compiled successfully; existing /meet/ hosting base |
| check:local and YAML structural/pin review | Passed; no Framework resolution |
| Retained ZIP integrity/exclusions and trimmed SDK | Passed; 3 additional SDK checks, not added to backend count |
| Playbook pin/sparse check, documentation/artifact validation, git diff --check | Passed |

Tests use mocked Google SDK or in-memory transport and mocked frontend fetch;
browser runs only localhost mock data. Local server was stopped afterward.
Logs are temporary `/tmp/meet7b1-*.log`, not repository/Library outputs.
Existing outdated Browserslist, Node fs.F_OK and webpack dev middleware deprecation
warnings remain. No dependency fixes/updates were run. Phase 7A's zero backend npm
audit vulnerabilities is historical evidence, **not a fresh Phase 7B.1 audit**.
No independent backend lint/format/type-check exists or is claimed.

## I. Phase 7B.2 deployment readiness checklist

**Satisfied preparation**

- [x] Checkpoint/branch/pin checked; user exports preserved; previous phase evidence reviewed.
- [x] Runtime/CLI/SDK pins, stage guard, routes, package policy and local tests/build checked.
- [x] Development callback, exact CORS policy and frontend/backend matrix documented.
- [x] Resource expectations, shared storage/account risks, cost and secrets review recorded.
- [x] Docs/context refreshed with canonical schemas and manifest integrity; no Library upload.

**Manual owner prerequisites — pending**

- [ ] Confirm vendor free eligibility/subscription and chosen auth method; personally review terms.
- [ ] Complete approved vendor sign-in or protected existing license provisioning; no paid features by default.
- [ ] Create/verify separate Google development client and exact localhost callback; keep existing client/project publishing settings intact.
- [ ] Confirm public test calendar and current approved Calendar scope/verification status.
- [ ] Confirm AWS account/temporary identity, eu-central-1, existing dev inventory and localtest collision/ownership.
- [ ] Approve deployment storage strategy and inspect actual bucket/state sharing and permissions.
- [ ] Supply development-only protected backend configuration; preserve production frontend/environment.
- [ ] Confirm cost tolerance, exposure and cleanup scope; approve limits if needed.

**Authorized packaging review and rollout — pending explicit approvals**

- [ ] Approve vendor CLI download/authentication and AWS packaging access, including possible S3/SSM writes. This may require resource initialization despite no app deployment.
- [ ] Run existing guarded package command; inspect ZIP and redacted generated config/template/IAM/helpers/storage; verify localtest and no dev resource mutation.
- [ ] Establish reviewed deployment identity/stage safeguards; authorize specific isolated test deployment only after package review.
- [ ] Separately authorize real OAuth/Calendar/browser integration: preflight, consent/denial, state/PKCE, bearer/expiry/401, generated API errors and no auth caching/logging.
- [ ] Verify old dev remains untouched; authorize any later cleanup separately. Production replacement is a different decision.

The report is actionable for 7B.2 authorization, but manual prerequisites and official
packaging prevent a claim of deployment-ready infrastructure. No deployment command
or real OAuth run has been executed or newly authorized.

## J. Outstanding owner decisions

1. Confirm applicable Serverless free eligibility and choose interactive authentication
   or an existing approved subscription/license method; approve associated vendor terms/access.
2. Confirm testing account/identity and whether shared regional deployment storage and
   same-account quotas/cost are acceptable, or authorize stronger isolation.
3. Confirm that a separate client in the existing production-audience Google project
   is sufficient; otherwise authorize a separate project for consent isolation.
4. Set test spending/exposure tolerance and authorize 7B.2 packaging/storage access,
   then specific deployment/live OAuth only after reviewing generated evidence.

## Files and handoff

Created this report and progress log 002; updated execution plan, docs index,
backend README, authentication cross-reference and AI handoff/index. Regenerated
documentation tree, overview and context summary through the artifact workflow;
verified unchanged source tree/snapshot; updated six-member manifest provenance.
The concurrent owner .gitignore edit and export-directory rename are preserved
and excluded from this phase's authored changes. Application/backend code, dependency
manifests/locks, YAML/guard scripts, historical
Phase 7A/6 reports, Playbook and user exports remain unchanged. Later tooling/lifecycle
gaps reported in Phase 7A (backend lint/format, earlier lifecycle mapping/Phase 5
standalone report) remain deferred. No optional framework/module was introduced.
