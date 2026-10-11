'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {google}=require('googleapis');
const callback='http://localhost:3000/';
const client=()=>new google.auth.OAuth2('fixture-client','fixture-secret',callback);
test('installed SDK generates state and S256 authorization URL',()=>{
 const c=client();const u=new URL(c.generateAuthUrl({state:'a'.repeat(64),access_type:'online',scope:['https://www.googleapis.com/auth/calendar.events.public.readonly'],code_challenge:'b'.repeat(43),code_challenge_method:'S256'}));
 assert.equal(u.searchParams.get('redirect_uri'),callback);assert.equal(u.searchParams.get('code_challenge_method'),'S256');assert.equal(u.searchParams.get('state'),'a'.repeat(64));
});
test('installed SDK transports code/verifier in POST body and produces expiry date',async()=>{
 const c=client();let sent;c.transporter.request=async options=>{sent=options;return {data:{access_token:'fixture-token',expires_in:3600,token_type:'Bearer'}}};
 const result=await c.getToken({code:'fixture-code',redirect_uri:callback,codeVerifier:'c'.repeat(43)});
 assert.equal(sent.method,'POST');assert.equal(sent.data.get('code_verifier'),'c'.repeat(43));assert.equal(sent.data.get('redirect_uri'),callback);assert.equal(sent.data.get('code'),'fixture-code');assert.ok(result.tokens.expiry_date>Date.now());assert.equal(result.tokens.access_token,'fixture-token');assert.equal(String(sent.url).includes('fixture-code'),false);
});
test('installed Calendar v3 SDK uses bearer header and event query with offline transport',async()=>{
 const c=client();c.setCredentials({access_token:'fixture-token',expiry_date:Date.now()+3600000});let sent;
 c.transporter.request=async options=>{sent=options;return {data:{items:[{id:'fixture-event'}]}}};
 const result=await google.calendar('v3').events.list({auth:c,calendarId:'fixture-calendar',singleEvents:true,orderBy:'startTime',timeMin:'2026-10-11T00:00:00Z'});
 assert.equal(new Headers(sent.headers).get('authorization'),'Bearer fixture-token');assert.equal(String(sent.url).includes('fixture-token'),false);assert.equal(result.data.items[0].id,'fixture-event');assert.equal(sent.params.singleEvents,true);assert.equal(sent.params.orderBy,'startTime');assert.equal(sent.params.timeMin,'2026-10-11T00:00:00Z');
});
