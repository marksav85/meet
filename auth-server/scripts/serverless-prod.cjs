'use strict';
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { check, validateStage } = require('./check-local.cjs');

const PROD_CALLBACK = 'https://meet.marksavilledesigns.com/';
const root = path.resolve(__dirname, '..');

function validateProductionEnvironment(env) {
  for (const key of ['CLIENT_ID', 'CLIENT_SECRET', 'CALENDAR_ID', 'OAUTH_REDIRECT_URIS']) {
    assert.ok(typeof env[key] === 'string' && env[key].trim(), `Production requires private ${key}.`);
  }
  let redirects;
  try { redirects = JSON.parse(env.OAUTH_REDIRECT_URIS); } catch {
    throw new Error('Production OAUTH_REDIRECT_URIS must be a valid JSON array.');
  }
  // Use a boolean assertion: never let assertion diagnostics print supplied values.
  assert.ok(Array.isArray(redirects) && redirects.length === 1 && redirects[0] === PROD_CALLBACK,
    'Production OAUTH_REDIRECT_URIS must contain only the exact approved production callback, including its trailing slash.');
}

function commandArgs(operation, args, env) {
  assert.ok(['package', 'deploy'].includes(operation), 'Only production package or deploy is supported.');
  validateStage(args, 'prod');
  validateProductionEnvironment(env);
  const cliArgs = [path.join(root, 'node_modules/serverless/run.js'), operation,
    '--config', path.join(root, 'serverless.yml'), '--stage', 'prod', '--region', 'eu-central-1'];
  if (operation === 'package') cliArgs.push('--package', path.join(root, '.serverless-prod'));
  // Deploy deliberately builds a fresh prod package; caller-supplied packages,
  // function-only deploys, stage/config/region overrides cannot enter this path.
  return cliArgs;
}

function run(argv, env, spawn = spawnSync) {
  const [operation, ...args] = argv;
  if (operation === 'check') {
    validateStage(args, 'prod');
    check();
    console.log('Production command guards checked offline; no CLI, credentials or AWS calls.');
    return 0;
  }
  const cliArgs = commandArgs(operation, args, env);
  check();
  const result = spawn(process.execPath, cliArgs, { cwd: root, stdio: 'inherit', env });
  if (result.error) throw new Error('The pinned Serverless CLI could not start.');
  return result.status ?? 1;
}

module.exports = { PROD_CALLBACK, validateProductionEnvironment, commandArgs, run };
if (require.main === module) {
  try { process.exitCode = run(process.argv.slice(2), process.env); } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
