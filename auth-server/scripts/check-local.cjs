'use strict';
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
function validateStage(args){assert.deepEqual(args,['--stage','localtest'],'Only explicit --stage localtest is permitted. Legacy dev and arbitrary stages are rejected.');}
function check(){
 const root=path.resolve(__dirname,'..');const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));const yml=fs.readFileSync(path.join(root,'serverless.yml'),'utf8');
 assert.equal(process.versions.node.split('.')[0],'24','Backend checks require Node 24.');
 assert.equal(pkg.dependencies.googleapis,'185.0.0');assert.equal(pkg.devDependencies.serverless,'4.43.0');
 for(const required of ['frameworkVersion: "4.43.0"','runtime: nodejs24.x','region: eu-central-1','localtest: localtest','stage: ${self:custom.selectedStage}','selectedStage: ${self:custom.allowedStages.${opt:stage, \'localtest\'}}','esbuild: false','restApi: false',"- '!**'","- 'handler.js'","- 'node_modules/**'","- '!node_modules/**/*.d.ts'","- '!node_modules/**/*.map'"]){assert.ok(yml.includes(required),'Missing local configuration safeguard: '+required);}
 assert.equal(/file\(config\.json\)/.test(yml),false,'Credential files must not be resolved.');
 for(const key of ['CLIENT_ID','CLIENT_SECRET','CALENDAR_ID']) assert.ok(yml.includes('${env:'+key+'}'));
 console.log('Local static configuration checks passed (not Serverless schema/CloudFormation validation).');
}
module.exports={check,validateStage};if(require.main===module)check();
