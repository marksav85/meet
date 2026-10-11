# Meet backend local development

Use Node 24 (`.nvmrc`, package engines >=24 <25). Runtime configuration targets
`nodejs24.x`, AWS eu-central-1. googleapis 185.0.0 and Serverless Framework 4.43.0
are exact pins with a backend lockfile; frontend dependencies are independent.

```sh
npm ci --prefix auth-server --ignore-scripts
npm test --prefix auth-server
npm run check:local --prefix auth-server
```

Lifecycle scripts are deliberately skipped: the Serverless npm package is a
launcher whose postinstall/first execution downloads a vendor binary. The CLI
has not been authenticated or run here. The exact frameworkVersion constrains
its selected version; the npm lockfile does not audit the downloaded binary's
embedded dependencies. Use the project-local npm script rather than global CLI
or an unpinned npx download.

## Configuration and packaging

Backend environment names CLIENT_ID, CLIENT_SECRET and CALENDAR_ID are required;
OAUTH_REDIRECT_URIS is an explicit trusted JSON array of approved callbacks.
No credential values belong in docs, frontend variables or repository artifacts.
YAML resolves deployment environment values rather than reading local config.json.
The handler returns safe errors when required configuration is missing/invalid.
The YAML production-only callback default remains unchanged. The later isolated
stage must explicitly override it with the localhost-only development allowlist. No actual credentials were read or created.

Only `localtest` is registered in the local stage allowlist. Unknown stages,
including `dev`, have no selectedStage mapping. The package wrapper rejects any
arguments except `--stage localtest` before launching Serverless. It exposes no
deploy/remove/invoke command. Do not invoke direct deployment commands; live work
requires separate approval and identity/stage verification. YAML variable/schema
resolution is not yet certified by the authenticated Framework.

For a later approved authenticated packaging session only:

```sh
npm run package:localtest --prefix auth-server -- --stage localtest
```

This command was not run in Phase 7A. Official documentation states v4 needs
Serverless authentication, and AWS packaging requires valid AWS credentials and may write S3/SSM state or
deployment storage. It is not a guaranteed offline/read-only operation. No login,
paid terms or Dashboard service is configured. Do not work around this gate.

Classic packaging is selected with esbuild disabled. Patterns first exclude all
service files, then include handler.js and production dependencies; Serverless's
default dev-dependency exclusion must be verified in its final artifact. Service
secrets, tests, docs, scripts and development CLI are excluded. Type declarations
and source maps under node_modules are omitted; licenses/runtime JS/JSON stay.
The offline production-only ZIP rehearsal is not an official Serverless output
and does not prove generated IAM/CloudFormation. See the Phase 7A report.

No custom AWS IAM permissions are added: handlers call Google, not AWS services.
Framework-generated Lambda basic logging permissions still require future
review. API Gateway execution/access logging is disabled; Lambda retention is
14 days. Existing handler diagnostics contain only operation/code/status.

## Subsequent testing deployment prerequisites

Obtain approval for Serverless authentication/licensing, an isolated AWS identity
and stage, and a separate Google development client/callback. Verify current
pricing eligibility and expected AWS charges before any live work. Then validate
resolved environment, stage, IAM/template, package and dependency exclusions,
preflight, real PKCE consent/exchange and Calendar access on the isolated stage.
Keep the old /dev deployment intact and never deploy the new frontend alone.
Phase 7B/Vite/Atatus/UI/Cloudflare work remains outside this phase.

Phase 7B.1 preparation is documented in the
[isolated testing review](../docs/2-development/review--testing--phase-7b-1.md).
It confirms offline regressions and supplies manual client/account/storage steps;
7B.2 packaging, storage initialization, deployment and real OAuth require explicit
approval. A new stage may share regional storage; a new Google client in the existing
project shares its production audience. Use development-only protected values and
explicit localhost-only callbacks on localtest; keep the production frontend intact.
