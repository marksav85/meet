'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

function validateStage(args, stage = 'localtest') {
  assert.ok(['localtest', 'prod'].includes(stage), 'Only localtest and prod are supported.');
  assert.ok(args.length === 2 && args[0] === '--stage' && args[1] === stage,
    `Only explicit --stage ${stage} is permitted; dev and extra options are rejected.`);
}

function check() {
  const root = path.resolve(__dirname, '..');
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const yml = fs.readFileSync(path.join(root, 'serverless.yml'), 'utf8');
  assert.equal(process.versions.node.split('.')[0], '24', 'Backend checks require Node 24.');
  assert.equal(pkg.dependencies.googleapis, '185.0.0');
  assert.equal(pkg.devDependencies.serverless, '4.43.0');
  for (const required of [
    'frameworkVersion: "4.43.0"', 'runtime: nodejs24.x', 'region: eu-central-1',
    'localtest: localtest', 'prod: prod', 'stage: ${self:custom.selectedStage}',
    "selectedStage: ${self:custom.allowedStages.${opt:stage, 'localtest'}}",
    "localtest: '[\"https://marksav85.github.io/meet/\"]'",
    "prod: '[\"https://meet.marksavilledesigns.com/\"]'",
    'OAUTH_REDIRECT_URIS: ${env:OAUTH_REDIRECT_URIS, self:custom.oauthRedirectDefaults.${self:custom.selectedStage}}',
    'esbuild: false', 'restApi: false', "- '!**'", "- 'handler.js'", "- 'node_modules/**'",
    "- '!node_modules/**/*.d.ts'", "- '!node_modules/**/*.map'",
  ]) assert.ok(yml.includes(required), 'Missing local configuration safeguard: ' + required);
  const stages = yml.match(/  allowedStages:\n([\s\S]*?)  selectedStage:/)?.[1];
  assert.equal(stages, '    localtest: localtest\n    prod: prod\n', 'Stage allowlist must exclude dev and arbitrary stages.');
  assert.equal(/file\(config\.json\)/.test(yml), false, 'Credential files must not be resolved.');
  for (const key of ['CLIENT_ID', 'CLIENT_SECRET', 'CALENDAR_ID']) assert.ok(yml.includes('${env:' + key + '}'));
  assert.ok(fs.readFileSync(path.join(root, '.gitignore'), 'utf8').split(/\r?\n/).includes('.serverless-prod'), 'Production packages must be ignored.');
  console.log('Local static configuration/package safeguards passed (not Serverless schema/CloudFormation validation).');
}

module.exports = { check, validateStage };
if (require.main === module) check();
