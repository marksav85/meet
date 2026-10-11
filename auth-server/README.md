# Meet backend maintenance

The isolated `localtest` backend in eu-central-1 has been deployed successfully;
the owner verified real OAuth/Calendar integration. The old `/dev` deployment
remains separate and protected. Versions are Node.js 24 (`>=24 <25`), Lambda
`nodejs24.x`, Serverless Framework **4.43.0** and Google APIs SDK **185.0.0**.
The backend manifest/lockfile is independent of frontend tooling.

## Local checks

```sh
npm ci --prefix auth-server --ignore-scripts
npm test --prefix auth-server
npm run check:local --prefix auth-server
```

Last backend verification passed **52 tests**: 46 handler, three installed-SDK
fake-transport and three config/guard checks. Tests are offline; do not treat them
as a fresh live integration check. Lifecycle scripts are skipped because the
Serverless npm package downloads a vendor CLI. The owner has authenticated it;
future execution still needs the approved local session and applicable license
eligibility. Use the pinned project-local CLI, not global or unpinned npx tools.
The npm lockfile does not audit the downloaded vendor binary.

## Configuration and packaging

Supply `CLIENT_ID`, `CLIENT_SECRET`, `CALENDAR_ID` and the exact trusted JSON
`OAUTH_REDIRECT_URIS` array privately. For localtest use development credentials
and `["http://localhost:3000/"]`; explicitly override the legacy production-only
callback default. YAML reads deployment environment variables, not local config.json.
See [authentication contracts](../AUTHENTICATION.md).

Only localtest is in the stage allowlist. The wrapper accepts exactly
`--stage localtest`; unknown stages including dev are rejected. For a separately
authorized authenticated packaging session:

```sh
npm run package:localtest --prefix auth-server -- --stage localtest
```

Packaging is **not read-only**: Serverless v4 can initialize/write S3/SSM deployment
storage. The regional deployment bucket/pointer may be shared across services.
Stage guards are not IAM boundaries. Verify identity, region, generated stack/API,
roles/helpers, bucket ownership and object prefixes before future deployment.
Protect `/dev`; never delete shared storage as localtest cleanup.

Classic CommonJS packaging uses esbuild disabled and includes handler/runtime
production dependencies. Service secrets, tests/docs/scripts, development CLI,
dependency declaration files and maps are excluded; runtime JS/JSON/licenses stay.
Inspect the actual ZIP/template for production dependency pruning, exclusions and
Lambda size limits. Earlier ZIP rehearsals are not deployed-artifact evidence.
Resolved `.serverless` state/templates can contain secrets even when the ZIP does
not: keep them private and never upload them to Git or ChatGPT.

## Permissions, logging and maintenance

Handlers call Google, not AWS services; their execution role needs logging access,
not administrator permissions. Review deployment permissions separately for
CloudFormation, Lambda, API Gateway, IAM/PassRole and Framework storage/helpers.
The deleted IAM drafts were incomplete placeholders, not a verified deployer policy.
Prefer temporary least-privilege credentials. **Revoke temporary AWS administrator
access and delete its access key after deployment work is finished.** No cloud
operation is performed by these instructions or documentation cleanup.

API Gateway access/execution logging is disabled in configuration; Lambda log
retention is 14 days. Handler diagnostics contain safe operation/code/status only.
Retain no body/header/token logging. Same-account stages share quotas/billing;
CORS does not prevent non-browser access or spending. Review current charges and
exposure before additional testing; teardown must be explicitly scoped to localtest.
No deploy/remove/invoke script is supplied. Future cloud operations, production
OAuth/Cloudflare cutover and resource cleanup require explicit authorization.
