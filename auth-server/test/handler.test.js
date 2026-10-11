const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const origin = 'https://marksav85.github.io';
const redirectUri = `${origin}/meet/`;
let tokenError, calendarError, clients, logs, tokenResult;
const savedWarn = console.warn;
class OAuth2 {
  constructor(id, secret, redirect) { this.redirect = redirect; clients.push(this); }
  generateAuthUrl(params) { return 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({ ...params, redirect_uri: this.redirect, response_type: 'code' }); }
  async getToken(input) { this.input = input; if (tokenError) throw tokenError; return { tokens: tokenResult }; }
  setCredentials(credentials) { this.credentials = credentials; }
}
const originalLoad = Module._load;
Module._load = function(name, ...args) {
  if (name === 'googleapis') return { google: { auth: { OAuth2 }, calendar: () => ({ events: { list: async () => { if (calendarError) throw calendarError; return { data: { items: [{ id: 'event' }] } }; } } }) } };
  return originalLoad.call(this, name, ...args);
};
const handler = require('../handler');
Module._load = originalLoad;
beforeEach(() => {
  process.env.CLIENT_ID = 'fake-client'; process.env.CLIENT_SECRET = 'fake-secret'; process.env.CALENDAR_ID = 'fake-calendar';
  delete process.env.OAUTH_REDIRECT_URIS;
  tokenError = calendarError = undefined; tokenResult = { access_token: 'fake-bearer', refresh_token: 'private-refresh', expiry_date: Date.now() + 3600000 }; clients = []; logs = [];
  console.warn = (entry) => logs.push(entry);
});
after(() => { console.warn = savedWarn; });
const input = { redirectUri, state: 'a'.repeat(64), codeChallenge: 'b'.repeat(43), code: 'fake-code', codeVerifier: 'c'.repeat(43) };
const event = (method = 'POST', data = input, extra = {}) => ({ httpMethod: method, headers: { Origin: origin, 'Content-Type': 'application/json', ...extra }, body: JSON.stringify(data) });
const payload = (response) => JSON.parse(response.body);
test('authorization includes approved redirect, state and S256 without offline access', async () => {
  const result = await handler.getAuthURL(event()); assert.equal(result.statusCode, 200);
  const url = new URL(payload(result).authUrl);
  for (const [key, value] of Object.entries({ state: input.state, redirect_uri: redirectUri, code_challenge: input.codeChallenge, code_challenge_method: 'S256', access_type: 'online' })) assert.equal(url.searchParams.get(key), value);
});
for (const field of ['state', 'codeChallenge', 'redirectUri']) test(`authorization rejects missing ${field}`, async () => { assert.equal((await handler.getAuthURL(event('POST', { ...input, [field]: undefined }))).statusCode, 400); });
for (const field of ['code', 'codeVerifier', 'redirectUri']) test(`exchange rejects missing ${field}`, async () => { assert.equal((await handler.getAccessToken(event('POST', { ...input, [field]: undefined }))).statusCode, 400); });
test('rejects arbitrary callback and origin', async () => {
  assert.equal((await handler.getAuthURL(event('POST', { ...input, redirectUri: 'https://evil.test/' }))).statusCode, 400);
  const result = await handler.getAuthURL(event('POST', input, { Origin: 'https://evil.test' })); assert.equal(result.statusCode, 403); assert.equal(result.headers['Access-Control-Allow-Origin'], undefined);
});
for (const body of ['{', 'null', '[]']) test(`rejects malformed JSON ${body}`, async () => { assert.equal((await handler.getAccessToken({ ...event(), body })).statusCode, 400); });
test('rejects legacy GET exchange', async () => { assert.equal((await handler.getAccessToken(event('GET'))).statusCode, 405); });
test('exchange returns only access token, type and lifetime and binds verifier/redirect', async () => {
  const result = await handler.getAccessToken(event()); assert.equal(result.statusCode, 200);
  assert.deepEqual(Object.keys(payload(result)).sort(), ['access_token', 'expires_in', 'token_type']);
  assert.deepEqual(clients[0].input, { code: input.code, redirect_uri: redirectUri, codeVerifier: input.codeVerifier });
  assert.equal(result.headers['Cache-Control'], 'no-store');
});
for (const [status, expected] of [[400, 401], [401, 401], [403, 403], [429, 503], [500, 502]]) test(`exchange sanitizes Google ${status}`, async () => {
  tokenError = { response: { status, data: { error: 'fake-code private-refresh fake-bearer' } }, message: 'fake-secret' };
  const result = await handler.getAccessToken(event()); assert.equal(result.statusCode, expected);
  assert.doesNotMatch(result.body + logs.join(''), /fake-code|private-refresh|fake-bearer|fake-secret/);
  assert.equal(result.headers['Access-Control-Allow-Origin'], origin);
});
test('calendar retrieves events using a request-scoped bearer client', async () => {
  for (const token of ['first-token', 'second-token']) assert.equal((await handler.getCalendarEvents(event('GET', {}, { Authorization: `Bearer ${token}` }))).statusCode, 200);
  assert.notEqual(clients[0], clients[1]); assert.equal(clients[0].credentials.access_token, 'first-token'); assert.equal(clients[1].credentials.access_token, 'second-token');
});
for (const value of [undefined, 'Basic fake', 'Bearer', 'Bearer bad token']) test(`calendar rejects malformed bearer ${value}`, async () => { assert.equal((await handler.getCalendarEvents(event('GET', {}, { Authorization: value }))).statusCode, 401); assert.equal(clients.length, 0); });
for (const [status, expected] of [[401, 401], [403, 403], [429, 503], [500, 502]]) test(`calendar handles Google ${status} safely`, async () => { calendarError = { response: { status }, message: 'fake-bearer fake-secret' }; const result = await handler.getCalendarEvents(event('GET', {}, { Authorization: 'Bearer fake-bearer' })); assert.equal(result.statusCode, expected); assert.doesNotMatch(result.body + logs.join(''), /fake-bearer|fake-secret/); });
for (const [name, method] of [['getAuthURL', 'POST'], ['getAccessToken', 'POST'], ['getCalendarEvents', 'GET']]) test(`${name} accepts approved preflight`, async () => { const result = await handler[name](event('OPTIONS', {}, { 'Access-Control-Request-Method': method, 'Access-Control-Request-Headers': 'content-type, authorization' })); assert.equal(result.statusCode, 204); assert.equal(result.headers['Access-Control-Allow-Origin'], origin); assert.equal(result.headers['Access-Control-Allow-Credentials'], undefined); });
test('preflight rejects unapproved headers', async () => { assert.equal((await handler.getAuthURL(event('OPTIONS', {}, { 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'x-secret' }))).statusCode, 400); });
test('localhost requires explicit callback configuration', async () => {
  const request = event('POST', { ...input, redirectUri: 'http://localhost:3000/' }, { Origin: 'http://localhost:3000' });
  assert.equal((await handler.getAuthURL(request)).statusCode, 403);
  process.env.OAUTH_REDIRECT_URIS = JSON.stringify([redirectUri, 'http://localhost:3000/']); assert.equal((await handler.getAuthURL(request)).statusCode, 200);
});
test('provider invalid_client is a sanitized configuration failure', async () => { tokenError = { response: { status: 400, data: { error: 'invalid_client' } } }; const result = await handler.getAccessToken(event()); assert.equal(result.statusCode, 500); assert.equal(payload(result).error.code, 'SERVER_CONFIGURATION'); });
test('network failure is a sanitized upstream failure', async () => { calendarError = { code: 'ETIMEDOUT', message: 'fake-bearer' }; const result = await handler.getCalendarEvents(event('GET', {}, { Authorization: 'Bearer fake-bearer' })); assert.equal(result.statusCode, 502); assert.doesNotMatch(result.body + logs.join(''), /fake-bearer/); });
test('unexpected SDK failure is sanitized', async () => { tokenError = new Error('fake-secret fake-code'); const result = await handler.getAccessToken(event()); assert.equal(result.statusCode, 500); assert.doesNotMatch(result.body + logs.join(''), /fake-secret|fake-code/); });
for (const [field, value] of [['state', 'bad'], ['codeChallenge', 'bad'], ['code', 'bad code'], ['codeVerifier', 'bad']]) test(`rejects invalid ${field}`, async () => { const action = ['state', 'codeChallenge'].includes(field) ? handler.getAuthURL : handler.getAccessToken; assert.equal((await action(event('POST', { ...input, [field]: value }))).statusCode, 400); });
test('duplicate bearer headers are rejected before SDK calls', async () => { const request = event('GET', {}, { Authorization: 'Bearer fake-bearer' }); request.multiValueHeaders = { Authorization: ['Bearer first', 'Bearer second'] }; assert.equal((await handler.getCalendarEvents(request)).statusCode, 401); assert.equal(clients.length, 0); });
test('missing server configuration fails safely', async () => { delete process.env.CLIENT_SECRET; const result = await handler.getAuthURL(event()); assert.equal(result.statusCode, 500); assert.equal(payload(result).error.code, 'SERVER_CONFIGURATION'); });

for (const tokens of [null, {}, {access_token:'fake-bearer',expiry_date:1}, {access_token:'bad token',expiry_date:9999999999999}]) test('invalid or expired upstream token response fails safely',async()=>{tokenResult=tokens;const result=await handler.getAccessToken(event());assert.equal(result.statusCode,502);assert.doesNotMatch(result.body,/fake-bearer|bad token/);});
test('invalid callback configuration fails safely',async()=>{process.env.OAUTH_REDIRECT_URIS='not-json';assert.equal((await handler.getAuthURL(event())).statusCode,500);});
