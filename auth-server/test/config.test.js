const {test}=require('node:test');const assert=require('node:assert/strict');
const {check,validateStage}=require('../scripts/check-local.cjs');
test('pinned runtime/configuration safeguards pass static inspection',()=>check());
test('packaging accepts only explicitly selected localtest',()=>assert.doesNotThrow(()=>validateStage(['--stage','localtest'])));
test('packaging rejects absent, legacy and arbitrary stage arguments',()=>{for(const args of [[],['--stage','dev'],['--stage','production'],['--stage','localtest','--region','other']])assert.throws(()=>validateStage(args));});

const path = require('node:path');
const { PROD_CALLBACK, validateProductionEnvironment, commandArgs, run } = require('../scripts/serverless-prod.cjs');
const productionEnvironment = () => ({
  CLIENT_ID: 'fixture-production-client', CLIENT_SECRET: 'fixture-private-secret',
  CALENDAR_ID: 'fixture-calendar', OAUTH_REDIRECT_URIS: JSON.stringify([PROD_CALLBACK]),
});

test('prod accepts only its explicit stage and localtest remains localtest-only', () => {
  assert.doesNotThrow(() => validateStage(['--stage', 'prod'], 'prod'));
  assert.throws(() => validateStage(['--stage', 'prod']));
  assert.throws(() => validateStage(['--stage', 'localtest'], 'prod'));
  assert.throws(() => validateStage(['--stage', 'dev'], 'dev'));
});
for (const args of [[], ['--stage', 'dev'], ['--stage', 'production'], ['--stage=prod'],
  ['--stage', 'prod', '--stage', 'dev'], ['--stage', 'prod', '--region', 'us-east-1'],
  ['--stage', 'prod', '--config', 'other.yml'], ['--stage', 'prod', '--package', '.serverless'],
  ['--stage', 'prod', '--param', 'fixture-private-secret']]) {
  test(`production rejects unsafe arguments ${args.length} / ${args[0] || 'absent'} / ${args[1] || 'absent'}`, () => {
    let called = false;
    assert.throws(() => run(['deploy', ...args], productionEnvironment(), () => { called = true; }),
      (error) => !error.message.includes('fixture-private-secret'));
    assert.equal(called, false);
  });
}
for (const key of ['CLIENT_ID', 'CLIENT_SECRET', 'CALENDAR_ID', 'OAUTH_REDIRECT_URIS']) {
  test(`production requires nonempty private ${key}`, () => {
    for (const value of [undefined, '', '   ']) {
      assert.throws(() => validateProductionEnvironment({ ...productionEnvironment(), [key]: value }));
    }
  });
}
for (const value of ['broken fixture-private-secret', 'null', '{}', '[]',
  JSON.stringify(['http://localhost:3000/']), JSON.stringify(['https://marksav85.github.io/meet/']),
  JSON.stringify([PROD_CALLBACK.slice(0, -1)]), JSON.stringify([PROD_CALLBACK, 'http://localhost:3000/']),
  JSON.stringify(['https://meet.marksavilledesigns.com/fixture-private-secret'])]) {
  test('production rejects noncanonical callbacks without echoing private values', () => {
    assert.throws(() => validateProductionEnvironment({ ...productionEnvironment(), OAUTH_REDIRECT_URIS: value }),
      (error) => !error.message.includes('fixture-private-secret'));
  });
}
test('production accepts the exact planned callback and produces fixed CLI arguments', () => {
  const env = productionEnvironment();
  assert.doesNotThrow(() => validateProductionEnvironment(env));
  const deploy = commandArgs('deploy', ['--stage', 'prod'], env);
  assert.deepEqual(deploy, [path.resolve(__dirname, '../node_modules/serverless/run.js'), 'deploy',
    '--config', path.resolve(__dirname, '../serverless.yml'), '--stage', 'prod', '--region', 'eu-central-1']);
  const packaged = commandArgs('package', ['--stage', 'prod'], env);
  assert.deepEqual(packaged.slice(-2), ['--package', path.resolve(__dirname, '../.serverless-prod')]);
  assert.equal(deploy.includes('--package'), false, 'Deploy must build fresh, never reuse localtest/dev artifacts.');
  assert.equal(JSON.stringify(deploy).includes(env.CLIENT_SECRET), false);
});
test('offline production check neither needs private values nor starts Serverless', () => {
  assert.equal(run(['check', '--stage', 'prod'], {}, () => { throw new Error('CLI must not run'); }), 0);
});
test('production runner validates before spawning and propagates CLI failure', () => {
  const env = productionEnvironment();
  let call;
  assert.equal(run(['deploy', '--stage', 'prod'], env, (...args) => { call = args; return { status: 7 }; }), 7);
  assert.equal(call[0], process.execPath);
  assert.equal(call[2].cwd, path.resolve(__dirname, '..'));
  assert.equal(call[2].env, env);
  assert.throws(() => run(['deploy', '--stage', 'prod'], {}, () => { throw new Error('must not spawn'); }));
  assert.throws(() => commandArgs('remove', ['--stage', 'prod'], env));
  assert.throws(() => commandArgs('print', ['--stage', 'prod'], env));
});
