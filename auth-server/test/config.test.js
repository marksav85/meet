const {test}=require('node:test');const assert=require('node:assert/strict');
const {check,validateStage}=require('../scripts/check-local.cjs');
test('pinned runtime/configuration safeguards pass static inspection',()=>check());
test('packaging accepts only explicitly selected localtest',()=>assert.doesNotThrow(()=>validateStage(['--stage','localtest'])));
test('packaging rejects absent, legacy and arbitrary stage arguments',()=>{for(const args of [[],['--stage','dev'],['--stage','production'],['--stage','localtest','--region','other']])assert.throws(()=>validateStage(args));});
