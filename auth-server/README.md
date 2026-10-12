# Meet backend maintenance

The isolated `localtest` backend in eu-central-1 has been deployed successfully;
the owner verified real OAuth/Calendar integration. The old `/dev` deployment
remains separate and protected. Versions are Node.js 24 (`>=24 <25`), Lambda
`nodejs24.x`, Serverless Framework **4.43.0** and Google APIs SDK **185.0.0**.
The backend manifest/lockfile is independent of frontend tooling. `prod` is now
prepared in source for `https://meet.marksavilledesigns.com/`; it has not been
packaged or deployed by this change. Both stages reuse the same Lambda handlers.

## Local checks

```sh
npm ci --prefix auth-server --ignore-scripts
npm test --prefix auth-server
npm run check:local --prefix auth-server
npm run check:prod --prefix auth-server
```

The offline tests cover handlers, installed-SDK fake transports, production CORS,
exact stage/argument guards and production environment validation. `check:local`
checks both stages and package exclusions; `check:prod` is also entirely offline
and needs no private values. Neither invokes Serverless or validates a generated
CloudFormation stack. Lifecycle scripts are skipped because the
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

Only `localtest` and `prod` are in the YAML stage allowlist. The default remains
`localtest`. The existing localtest wrapper still accepts exactly
`--stage localtest` and retains its packaging behavior. Unsupported stages,
including historical `dev`, remain rejected. For a separately authorized
authenticated localtest packaging session:

```sh
npm run package:localtest --prefix auth-server -- --stage localtest
```

## Production preparation and deployment

Use private, production-specific environment settings for:

- `CLIENT_ID`: the approved production Google Web OAuth client.
- `CLIENT_SECRET`: that client's secret, kept outside Git and frontend builds.
- `CALENDAR_ID`: the intended public demonstration calendar.
- `OAUTH_REDIRECT_URIS`: exactly `["https://meet.marksavilledesigns.com/"]`.

The production wrappers require all four values explicitly. No values are printed
by the guards. The callback must include its trailing slash; localhost, GitHub
Pages, preview hosts and extra callbacks are rejected. YAML remains environment
configurable, with separate public callback defaults for each stage; localtest's
historical fallback is preserved. Production must use the guarded commands rather
than relying on defaults or invoking a generic Serverless CLI.

The wrappers accept only `--stage prod`, use the pinned local CLI/configuration,
and force `eu-central-1`. Extra options, another stage/config/region, prebuilt
packages, function-only deploys, `print` and `remove` are not supported. These are
local safeguards, not AWS IAM boundaries.

Next steps require separate authorization; none were executed during preparation:

1. Confirm the intended AWS account/profile and temporary least-privilege access,
   region `eu-central-1`, and Serverless v4 authentication/license eligibility.
   Confirm the intended new stack is `auth-server-prod`; preserve `auth-server-localtest`
   and historical `/dev` resources, Google clients and GitHub Pages publishing.
2. Privately configure the production Google client and exact callback above,
   confirm consent/audience/API access, and load the four backend environment
   values through the approved private mechanism. Never paste secrets into commands,
   logs, documentation or frontend `VITE_*` values.
3. Run the offline checks above. In an explicitly authorized AWS session, prepare
   the production package:

   ```sh
   npm run package:prod --prefix auth-server -- --stage prod
   ```

   Output is ignored `auth-server/.serverless-prod/`. Privately review the
   generated stack/API/stage, Lambda environment, IAM resources, ZIP exclusions,
   dependency pruning, package size and shared deployment bucket ownership.
   Do not run `serverless print` or expose resolved templates/state.
4. After package/configuration review and explicit deployment approval, deploy:

   ```sh
   npm run deploy:prod --prefix auth-server -- --stage prod
   ```

   This command builds a fresh `prod` package from the same reviewed source and
   private settings; it does not deploy the earlier package or reuse localtest/dev
   artifacts. Do not change source/environment between review and deployment;
   repackage/review if either changes. Its normal `.serverless/` output may replace
   earlier local packaging files, but it does not update the localtest deployment.
5. Verify the returned API URL ends in `/prod`. Configure the separate frontend
   build with `VITE_DATA_MODE=oauth`, that stage URL as `VITE_API_BASE_URL`, and
   `VITE_OAUTH_REDIRECT_URI=https://meet.marksavilledesigns.com/`. Verify production
   OAuth/PKCE, bearer Calendar retrieval, CORS/preflight and rejected test origins,
   refresh/session expiry/sign-out, and unchanged localtest/GitHub Pages/`dev`.

No production API ID or endpoint is known until deployment. Do not point the new
frontend at the legacy `/dev` contracts or retire existing deployments during
this verification.

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
Only the explicitly guarded `deploy:prod` command is supplied; no removal or
invocation command is added. Packaging, deployment, production OAuth/Cloudflare
cutover and resource cleanup still require explicit authorization.
