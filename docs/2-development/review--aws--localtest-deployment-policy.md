# Meet localtest IAM deployment policy proposal

## Document Header

- **Audience:** Project owner and AWS policy reviewer
- **Purpose:** Propose scoped validation, deployment and bootstrap permissions and identify unresolved isolation requirements.
- **Status:** draft
- **Authority:** supporting
- **Last updated:** 2026-10-11

**Review proposal only. Do not attach these placeholder policies as-is.** They are
not an AWS-validated, complete first-deployment permission set. Unknown identifiers,
first API creation, permissions boundaries and generated helper resources must be
resolved before deployment. No AWS APIs, CLI identity checks, Serverless commands,
packaging, access-key creation, policy attachment, deployment, commit or push occurred.

## Evidence and scope

Reviewed root AGENTS, backend YAML/guard scripts/package scripts, Phase 7A and 7B.1
reviews, execution plan and pinned Playbook execution/Dev 1/naming/metadata guidance.
HEAD remains 6289ae6, main; Playbook pin 162a9d8 passes its read-only check. Existing
Phase 7B.1 documentation and owner .gitignore/export/credential-directory work are
preserved. No credential JSON, local AWS credentials or vendor session was read.

Owner reports successful Serverless 4.43.0 authentication, AWS CLI 2.37.0 installation,
a development Google client, and IAM group meet-app-deployers/user meet-app-deployer
without permissions or access keys. These are supplied facts, not account inspection.
The policy grants no ability to create keys, manage the user/group or attach policies.
Future authenticated AWS access still needs separate authorization.

Configuration evidence: auth-server/localtest, eu-central-1, Node 24, three functions,
six REST API events, 14-day Lambda logs, API Gateway logging disabled, no custom
AWS statements, deployment role/bucket/API override or Compose configuration.
The package wrapper permits exactly --stage localtest; no backend deployment script
exists. YAML stage restrictions are not an IAM boundary or verified Framework resolution.

## Proposed files and how they relate

| File | Intended future use |
| --- | --- |
| [Validation policy](iam/policy--aws--localtest-validation.json) | Scoped cloud metadata/template/artifact reads and validation; no writes; optional first permission tier |
| [Deployment policy](iam/policy--aws--localtest-deployment.json) | Add to validation only after review; localtest stack/function/API/log and artifact writes; exact Lambda PassRole |
| [Role-management policy](iam/policy--aws--localtest-role-management.json) | Conditional addition if Framework manages its default role; requires fixed administrator-owned boundary and template/config reconciliation |
| [Bootstrap policy](iam/policy--aws--localtest-bootstrap.json) | Separate, temporary administrator-reviewed initialization scope; not a permanent deployer grant |
| [Lambda runtime boundary](iam/policy--aws--lambda-runtime-boundary.json) | Administrator-owned managed boundary for the three application functions' execution role; not a deployer identity policy and not sufficient by itself to grant runtime access |

These are separate customer-managed policy candidates, not one oversized inline
group policy. IAM limits each managed policy to 6,144 non-whitespace characters;
inline group policies have a 5,120 aggregate limit. Drafts fit individually; recount
after substituting identifiers or adding reviewed helpers. Do not concatenate them
into one policy or attach the runtime boundary to the deployment user as its identity
permissions. No policy creation/attachment is authorized here.
[IAM quotas](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_iam-quotas.html).

## Required substitutions and confirmations

| Marker/derived name | Required evidence |
| --- | --- |
| __AWS_ACCOUNT_ID__ | Owner-confirmed 12-digit account; never account-wide `*` |
| __VERIFIED_LOCALTEST_REST_API_ID__ | Actual new test REST API ID after controlled creation; cannot be obtained from logical IDs alone |
| __VERIFIED_DEV_REST_API_ID__ | Owner-verified existing production API ID for explicit denial, including its children |
| __VERIFIED_DEPLOYMENT_BUCKET_NAME__ | Actual account-owned eu-central-1 bucket, sharing/encryption/access reviewed |
| __VERIFIED_LOCALTEST_OBJECT_PREFIX__ | Exact Framework artifact/state prefix with no leading/trailing slash, proven exclusive to localtest; never replace with `*` or an empty string |
| __APPROVED_NEW_BOOTSTRAP_BUCKET_NAME__ | Administrator-approved globally unique new bucket name; confirm no existing resource before configuring it |
| __ADMIN_OWNED_RUNTIME_BOUNDARY_POLICY_NAME__ | Approved managed policy name/path outside deployer control; boundary administrator must confirm content/default version |
| auth-server-localtest-eu-central-1-lambdaRole | Derived default root-path role name; verify generated RoleName/Path before treating it as actual |
| auth-server-localtest-getAuthURL/getAccessToken/getCalendarEvents | Derived app function names, not evidence they exist; verify names/versions in template |

Default role name is derived from documented service-stage-region-lambdaRole naming.
It is deliberately an exact ARN with account placeholder rather than role/auth-server-*.
If the actual template differs, revise only after review. No helper identity is invented.
[Framework role naming](https://www.serverless.com/framework/docs/providers/aws/guide/iam).

## Statement explanations

The two common guard statements occur in each deployer policy tier:

| Sid | Purpose and scope |
| --- | --- |
| DenyDevResources | Deny all CloudFormation/Lambda/log/IAM/API management access on dev-named stack/function/log/role ARNs and verified dev API. Wildcard actions occur only in explicit Deny statements; they grant no permissions. |
| DenyOtherRegionalEndpoints | Deny CloudFormation, Lambda, API Gateway, Logs and SSM outside eu-central-1. IAM is global; S3 is handled with exact bucket/owner and operation-specific conditions. |

Production protection is intentionally stronger than write-only denial on known dev
ARNs. It does not enumerate unrelated production resources or unknown production
bucket/role names. Narrow Allow statements protect resources outside the proposed
scope by implicit denial, provided no other policy widens access. Check user/group
membership, other policies, boundaries, resource policies and SCPs before attachment.
These templates are not a permissions boundary for the deployment identity and cannot
constrain some independently authorized administrator. Protect any retained CloudFormation
service role separately; never assume caller restrictions limit an existing service role.
[CloudFormation service-role behavior](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-iam-servicerole.html).

### Validation statements

| Sid | Purpose and compatibility |
| --- | --- |
| ValidateTemplateAndDiscoverLogGroupNames | ValidateTemplate and DescribeLogGroups lack resource-level scoping: Resource `*`, restricted to eu-central-1. Lists regional group names, not log contents. Remove DescribeLogGroups if evidence shows it is unnecessary. |
| ReadLocaltestStack | Describe named stack/resources/events and GetTemplate; exact stack ARN, generated stack UUID wildcard only. GetTemplate may expose resolved secrets; read-only does not mean safe to publish. |
| ReadLocaltestFunctions | Read three exact app functions/versions, policies/tags; function configuration/code-location results must remain private. No list-all-functions or InvokeFunction. |
| ReadIntendedExecutionRole | Inspect only the derived exact Lambda role and its policies/tags; no role enumeration or writes. |
| ReadVerifiedLocaltestApi | API Gateway GET on one verified REST API and children; no regional `/restapis/*` scope. |
| ReadDeploymentBucketLocation | GetBucketLocation on exact bucket and account owner; regional condition omitted deliberately so location discovery can work through S3's endpoint behavior. No writes. |
| ReadDeploymentBucketMetadata | Exact bucket versioning/encryption/public-access metadata; owner and eu-central-1 endpoint restrictions. |
| ListOnlyLocaltestArtifactPrefix | ListBucket with s3:prefix restricted to test prefix; does not allow listing without prefix. |
| ReadOnlyLocaltestArtifacts | GetObject/GetObjectVersion on test prefix only; exact bucket owner/region. Objects can contain template secrets. |
| ReadFrameworkDeploymentBucketPointer | GetParameter/GetParameters on only the regional deployment-bucket SSM pointer. No hierarchical secret reads, decryption grants or SSM writes. |

[CloudFormation authorization](https://docs.aws.amazon.com/service-authorization/latest/reference/list_cloudformation.html),
[Logs authorization](https://docs.aws.amazon.com/service-authorization/latest/reference/list_logs.html),
[Lambda authorization](https://docs.aws.amazon.com/service-authorization/latest/reference/list_lambda.html),
[S3 authorization](https://docs.aws.amazon.com/service-authorization/latest/reference/list_s3.html),
[SSM authorization](https://docs.aws.amazon.com/service-authorization/latest/reference/list_ssm.html).

This tier is NOT sufficient for guaranteed Serverless packaging. v4 can write S3/SSM
storage during packaging. HeadBucket authorizes through ListBucket but has no prefix
filter: the prefix condition may intentionally block it. A dedicated test bucket can
justify unfiltered ListBucket on that one bucket after approval; avoid widening a
shared bucket's list scope automatically. No AWS action was invoked to discover the
CLI's exact required read sequence. STS GetCallerIdentity needs no allow grant; it is
not executed here and must not be mistaken for a protected identity boundary.
[HeadBucket](https://docs.aws.amazon.com/AmazonS3/latest/API/API_HeadBucket.html),
[GetCallerIdentity](https://docs.aws.amazon.com/STS/latest/APIReference/API_GetCallerIdentity.html),
[Serverless packaging](https://www.serverless.com/framework/docs/providers/aws/guide/packaging).

### Deployment statements

| Sid | Purpose and scope |
| --- | --- |
| CreateOrUpdateOnlyLocaltestStack | CreateStack/UpdateStack and stack tags on exact localtest stack; no other stacks, change sets, StackSets/imports or DeleteStack. |
| RejectExplicitCloudFormationServiceRole | Deny those stack operations when RoleArn is supplied. This proposal uses current no-service-role configuration and forwarded caller permissions. |
| ManageOnlyAppFunctionsViaCloudFormation | Create/update/delete app functions and publish versions/tags only on three exact names/qualified versions; require CloudFormation in aws:CalledVia and eu-central-1. Deletion supports resource rollback/replacement, not standalone teardown authorization. |
| GrantOnlyApiGatewayInvocation | AddPermission on those functions only, with lambda:Principal=apigateway.amazonaws.com and CloudFormation forwarding. Inspect SourceArn/SourceAccount in the template; this condition does not itself enforce the API ID in the permission payload. |
| RemoveAppInvocationPermissionsViaCloudFormation | RemovePermission on app functions/versions during reviewed updates/rollback only. No production function permissions. |
| ManageOnlyVerifiedApiViaCloudFormation | HTTP-verb IAM actions POST/PUT/PATCH/DELETE on one verified REST API/children; no account logging role, domain, unrelated API, usage plan or collection creation permissions. |
| ManageOnlyAppLogGroupsViaCloudFormation | Three exact app groups, retention and legacy TagLogGroup/UntagLogGroup; group ARN :* form for these operations. No log-reading/ingestion or account-level Logs policy changes. |
| PassOnlyIntendedRoleToLambda | Exact execution role only, iam:PassedToService=lambda.amazonaws.com, CloudFormation forwarding. No PassRole to CloudFormation or arbitrary roles/services. |
| WriteOrPruneOnlyLocaltestArtifacts | PutObject/DeleteObject and multipart abort/part listing in test prefix only; bucket/account/endpoint constrained. No bucket-wide policy/ACL/version/configuration writes or DeleteObjectVersion. |

[Lambda actions/Principal](https://docs.aws.amazon.com/service-authorization/latest/reference/list_lambda.html),
[API Gateway authorization](https://docs.aws.amazon.com/service-authorization/latest/reference/list_apigateway.html),
[PassRole](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_passrole.html),
[forwarded-call keys](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_condition-keys.html),
[CloudWatch log-group ARN forms](https://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/API_LogGroup.html).

CloudFormation in aws:CalledVia is an additional restriction, not a stack identifier.
It depends on the forwarded caller credentials path. No-service-role usage is required;
check that the target stack does not already retain another RoleARN. Conditions can
fail if an operation's request lacks forwarded-call context; validate actual context
later rather than deleting the condition to fix an AccessDenied. Direct function deploy,
invoke, log changes and IAM changes are deliberately not covered. No new deployment
command is created. Framework direct-stack operations fit the current proposal;
change-set mode/rollback recovery/failed-stack removal require a separately reviewed
addition. Automatic rollback still needs each resource's removal permissions.

### Conditional role-management statements

| Sid | Purpose and scope |
| --- | --- |
| CreateExecutionRoleWithFixedBoundary | Create only exact default role, only with fixed administrator-owned boundary and CloudFormation forwarding. Missing/different boundary means no Allow. |
| ManageOnlyBoundedExecutionRole | PutRolePolicy/DeleteRolePolicy/DeleteRole on that role, requiring its fixed boundary and forwarded CloudFormation call. It cannot constrain inline policy contents; the fixed boundary limits effective identity permissions. |
| TagOnlyIntendedRoleViaCloudFormation | Exact-role tag/untag for CloudFormation. No iam:PermissionsBoundary condition here: TagRole/UntagRole do not list it as a supported key. Tags cannot replace boundary enforcement. |
| DenyExecutionBoundaryChanges | Prevent boundary removal/replacement on execution role. No boundary mutation grant is included. |
| DenyBoundaryPolicyMutation | Prevent new/default/deleted versions or deletion of fixed boundary policy; deployer has no managed-policy creation/edit Allow. |

Current YAML does NOT configure a boundary. Therefore this tier intentionally cannot
create the existing default role configuration. A later approved configuration change
must put the reviewed boundary into generated AWS::IAM::Role.PermissionsBoundary;
verify the pinned Framework supports the selected setting and applies it to every
role. This draft does not modify YAML. No UpdateAssumeRolePolicy, AttachRolePolicy,
CreatePolicy, service-linked-role or account/user/group policy-management Allow exists.
If trust updates or managed-policy attachments actually become necessary, review them
separately instead of permitting blanket iam:*.
[IAM action/condition support](https://docs.aws.amazon.com/service-authorization/latest/reference/list_iam.html).

The boundary candidate permits only app log-group creation and stream writes in
Frankfurt (RuntimeLogGroupCreation / RuntimeLogStreamWrites). It grants nothing alone;
the execution role still needs a logging identity policy and Lambda-only trust.
It has no S3, SSM, IAM, secret-store, dev log or other-region permissions. Boundary
protection limits identity-policy escalation; it is not a universal defense against
all resource-based grants. Review account/resource policies and role trust too.
Safer alternative: administrator precreates a fixed, logging-only execution role,
then a later approved YAML references it and omits Framework role management. Grant
the deployer only GetRole/PassRole on that verified role. Do not grant a service role
broad rights simply to avoid IAM errors.
[Permissions boundaries](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html).

### Conditional one-time bootstrap statements

| Sid | Purpose and scope |
| --- | --- |
| CreateOnlyApprovedFrankfurtBootstrapBucket | Create one administrator-selected exact new bucket; s3:locationconstraint=eu-central-1. No UUID-prefix wildcard creation. |
| ConfigureOnlyApprovedBootstrapBucket | Set versioning, encryption and public-access blocking only on that exact new owner-controlled bucket in Frankfurt. No bucket policy/ACL writes or bucket deletion. |
| InitializeBucketPointerWithoutOverwrite | PutParameter only at the documented regional pointer, with StringEquals ssm:Overwrite=false and ssm:Policies=false. No overwrite, deletion or unrelated parameter writes. |

Resource existence is unknown. Do not attach bootstrap permissions to the permanent
deployer by default. An administrator must determine whether metadata/storage already
exists; never reconfigure an existing shared bucket or overwrite its SSM pointer.
If absent, a separate approved bootstrap can provision one exact bucket and initialize
metadata, then remove bootstrap privileges. This is a constrained design, not the
Framework's proven call sequence: default random bucket naming/versioning/ACL/tag
requirements may differ. Prefer administrator provision/reconciliation or an approved
explicit deploymentBucket configuration over granting CreateBucket on an arbitrary
serverless-framework-deployments-* family. Custom bucket configuration must be reviewed
for pinned 4.43.0; no configuration changes occur here.
[Deployment bucket](https://www.serverless.com/framework/docs/guides/deployment-bucket),
[S3 creation conditions](https://docs.aws.amazon.com/service-authorization/latest/reference/list_s3.html),
[SSM overwrite conditions](https://docs.aws.amazon.com/service-authorization/latest/reference/list_ssm.html).

The global pointer is shared regional metadata, even though its ARN is exact. Initializing
it still has account-wide operational implications and needs approval. Packaging must
stop if it wants metadata mutation or storage outside the approved test prefix.
Compose state documentation describes `/serverless-framework/state/s3-bucket` in
us-east-1; this repo does not select Compose. No us-east-1 state or SSM license-pointer
permission is granted. If the pinned single-service CLI actually needs additional state
storage, determine its location/ownership/prefix before adding permissions; do not invent
a localtest SSM hierarchy or weaken the Frankfurt restriction.
[Framework state](https://www.serverless.com/framework/docs/guides/state).

## Unresolved permissions and safer first-deployment strategy

1. **New REST API ID:** creation uses POST on `arn:aws:apigateway:eu-central-1::/restapis`.
   Its name can be constrained using apigateway:Request/ApiName after template review,
   but the generated ID is unknown and descendant writes need that ID. The supplied
   policy deliberately omits collection creation and wildcard descendant writes.
   API-name conditions apply to specific root operations, not every child operation;
   do not assume they protect methods/integrations. Prefer an administrator-reviewed
   initial API-only foundation step, then record ID/rootResourceId and either continue
   an approved same-stack rollout or use an approved existing-API configuration.
   Review migration/stack ownership before choosing. A separately isolated AWS account
   is the stronger alternative if an automated first deployment requires unavoidable
   broader regional API permissions. No default full first deployment is authorized.
2. **Log-retention helper/custom resources:** inspect pinned generated template for
   helper function names, roles, log groups, CloudFormation invocation and resource
   policies. The three app ARN lists and app logging boundary intentionally do not
   allow unnamed helpers. A retention helper may need logs:PutRetentionPolicy and
   different trust/invocation permissions; prepare a separate bounded helper role and
   exact permissions after inspection. No helper InvokeFunction grant exists today.
3. **Framework S3/state behavior:** confirm actual bucket/key paths, HeadBucket/list
   sequence, deployment pruning, bootstrap metadata writes, and any multipart/version
   or tagging operations. Prefix-scoped read/write is not proof current CLI uses those
   prefixes. A dedicated bucket reduces the shared-storage/listing risk.
4. **CloudFormation mechanics:** validate names, role boundary/path, function versions,
   stage/API root, tags, rollback operations and whether the Framework calls additional
   describe/template-summary/change-set APIs. Add a justified action only after reviewing
   its resource compatibility; no account-wide ListStacks/ListFunctions grants included.
5. **Encryption:** no KMS grants are presumed. If an existing bucket uses a customer-managed
   KMS key, review exact key ARN/policy and minimal Encrypt/Decrypt/GenerateDataKey with
   service/context constraints. Prefer approved standard bucket encryption for this
   simple test setup rather than granting kms:*.
6. **Production inventory:** explicit API deny must be populated; role/bucket names and
   any other production functions outside auth-server-dev naming remain unverified.
   Verify ownership and policy combinations; do not claim production isolation is proven.

## Review findings and verification

Resource/action shapes checked against current official AWS Service Authorization
Reference: stack ARNs for CloudFormation creation/update/read, function/qualified ARN
scopes, API Gateway accountless management path ARNs/HTTP verbs, role-specific
IAM/PassRole/boundary conditions, Logs group/stream ARNs, S3 bucket versus object
and prefix conditions, and SSM exact parameter/overwrite keys. New AWS tables use
short service filenames; obsolete long documentation paths redirect to the index,
so sources above use current authoritative pages. No invented stack-name IAM condition
or child API-name condition is used.

Offline verification passed for five JSON candidates and 22 scoped permission/denial
examples using artificial local fixtures (not real AWS IDs). It covers
JSON grammar/2012-10-17 policy envelopes, unique Sids,
placeholder inventory, size limits, absence of wildcard write Allows, boundary/tag
condition separation, policy-scope examples and guard behavior. This is not IAM Access
Analyzer, AWS policy simulation, template validation or actual deployment testing.
No application regression rerun is needed for documentation-only policy proposals.
`git diff --check` and read-only Playbook pin checks passed. Historical test counts in
Phase 7B.1 are preserved; no new test/build claim is made here.

Only new policy/review docs and the docs index are changed by this task. Existing
work is preserved. Canonical AI artifacts are not regenerated in this bounded proposal;
DOCS_TREE/manifest/context need a justified controller refresh before a later Library
handoff. No upload occurs. Stop at this review; attachment, bootstrap, credentials,
packaging, deployment and policy validation through AWS require separate authorization.
