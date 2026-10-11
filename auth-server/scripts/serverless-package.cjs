'use strict';
const path=require('node:path');const {spawnSync}=require('node:child_process');
const {check,validateStage}=require('./check-local.cjs');
try{validateStage(process.argv.slice(2));check();}catch(error){console.error(error.message);process.exit(1);}
// No deployment command is exposed. Authenticated packaging is a later prerequisite.
const result=spawnSync(process.execPath,[path.resolve(__dirname,'../node_modules/serverless/run.js'),'package','--stage','localtest'],{cwd:path.resolve(__dirname,'..'),stdio:'inherit'});
process.exit(result.status??1);
