import { createAuthClient } from '../auth';
const { webcrypto } = require('crypto');
const SESSION = 'meet.oauth.session';
const redirectUri = 'https://meet.example.test/';
const storage = () => { const map = new Map(); return { getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: (key) => map.delete(key) }; };
const response = (body, status = 200) => ({ ok: status === 200, status, json: async () => body });
let session, cache, fetchMock, navigate, clock, online, clients;
const client = (query = '', overrides = {}) => {
  const auth = createAuthClient({ location: new URL(redirectUri + query), history: { replaceState: jest.fn() }, config: { mode: 'oauth', apiBase: 'https://api.example.test/stage', redirectUri }, sessionStorage: session, localStorage: cache, crypto: webcrypto, fetch: fetchMock, navigate, now: () => clock, isOnline: () => online, ...overrides });
  clients.push(auth);
  return auth;
};
const seed = (expiresAt = clock + 3600000) => session.setItem(SESSION, JSON.stringify({ value: 'fixture-token', expiresAt }));
const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done; }); return { promise, resolve }; };
beforeEach(() => {
  jest.useFakeTimers();
  session = storage(); cache = storage(); navigate = jest.fn(); clock = 1000000; online = true; clients = [];
  fetchMock = jest.fn().mockResolvedValue(response({ events: [{ id: 'one' }] }));
});
afterEach(() => { clients.forEach((auth) => auth.signOut()); jest.useRealTimers(); });

test('restores the same absolute expiry after refresh without another exchange or lifetime extension', async () => {
  seed();
  await expect(client().getEvents()).resolves.toEqual([{ id: 'one' }]);
  clock += 600000;
  const refreshed = client();
  await expect(refreshed.getAccessToken()).resolves.toBe('fixture-token');
  expect(JSON.parse(session.getItem(SESSION)).expiresAt).toBe(4600000);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls[0][1]).toMatchObject({ headers: { Authorization: 'Bearer fixture-token' }, credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer' });
  expect(navigate).not.toHaveBeenCalled();
});

test.each(['broken', 'null', '[]', '{}', '{"value":"fixture-token"}', '{"value":"bad token","expiresAt":4600000}', '{"value":3,"expiresAt":4600000}', '{"value":"fixture-token","expiresAt":"4600000"}', '{"value":"fixture-token","expiresAt":9999999999999}', '{"value":"fixture-token","expiresAt":4600000,"extra":true}'])('malformed stored session %s is discarded and needs explicit authorization', async (saved) => {
  session.setItem(SESSION, saved);
  await expect(client().getEvents()).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
  expect(session.getItem(SESSION)).toBeNull();
  expect(fetchMock).not.toHaveBeenCalled(); expect(navigate).not.toHaveBeenCalled();
});

test.each([0, 29999, 30000])('stored token with %i ms remaining is not restored', async (remaining) => {
  seed(clock + remaining);
  await expect(client().getEvents()).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
  expect(session.getItem(SESSION)).toBeNull();
});

test('startup survives unavailable storage, and protected access fails closed', async () => {
  session.getItem = () => { throw new Error('blocked'); };
  const auth = client();
  expect(() => auth.prepare()).not.toThrow();
  await expect(auth.getEvents()).rejects.toMatchObject({ code: 'SESSION_UNAVAILABLE' });
  expect(fetchMock).not.toHaveBeenCalled();
});

test('sign-out removes credentials, cached events and pending OAuth transaction and blocks refresh', async () => {
  seed(); cache.setItem('lastEvents', JSON.stringify([{ id: 'cached' }]));
  const auth = client(); await auth.getAccessToken();
  session.setItem('meet.oauth.attempt', 'pending');
  const listener = jest.fn(); auth.subscribeAuthentication(listener);
  auth.signOut();
  expect(session.getItem(SESSION)).toBeNull(); expect(cache.getItem('lastEvents')).toBeNull(); expect(session.getItem('meet.oauth.attempt')).toBeNull();
  expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ authenticated: false, error: expect.objectContaining({ code: 'AUTH_REQUIRED' }) }));
  await expect(auth.getEvents()).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
  await expect(client().getEvents()).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
  expect(navigate).not.toHaveBeenCalled();
});

test('expiry timer invalidates the session at the 30-second margin without waiting for a request', async () => {
  seed(clock + 31000); cache.setItem('lastEvents', '[{"id":"cached"}]');
  const auth = client(); await auth.getAccessToken();
  const listener = jest.fn(); auth.subscribeAuthentication(listener);
  clock += 1000; jest.advanceTimersByTime(1000);
  expect(session.getItem(SESSION)).toBeNull(); expect(cache.getItem('lastEvents')).toBeNull();
  expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ authenticated: false }));
  await expect(auth.getEvents()).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
});

test('request-time expiry still fails closed if a background timer is delayed', async () => {
  seed(clock + 31000);
  const auth = client(); await auth.getAccessToken(); clock += 2000;
  await expect(auth.getEvents()).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
  expect(session.getItem(SESSION)).toBeNull(); expect(fetchMock).not.toHaveBeenCalled();
});

test('401 invalidates credentials even when its response body is malformed', async () => {
  seed(); cache.setItem('lastEvents', '[]');
  fetchMock.mockResolvedValue({ status: 401, ok: false, json: async () => { throw new Error('private details'); } });
  const auth = client();
  await expect(auth.getEvents()).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
  expect(session.getItem(SESSION)).toBeNull(); expect(cache.getItem('lastEvents')).toBeNull();
  await expect(auth.getEvents()).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test.each([true, false])('pending calendar response after sign-out (401: %s) cannot restore data', async (unauthorized) => {
  seed(); const pending = deferred(); fetchMock.mockReturnValue(pending.promise);
  const auth = client(); const work = auth.getEvents();
  const rejected = expect(work).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
  await Promise.resolve(); await Promise.resolve();
  auth.signOut(); pending.resolve(response({ events: [{ id: 'late' }] }, unauthorized ? 401 : 200));
  await rejected;
  expect(cache.getItem('lastEvents')).toBeNull(); expect(session.getItem(SESSION)).toBeNull();
});

test('pending JSON decoding cannot repopulate events after sign-out', async () => {
  seed(); const body = deferred(); fetchMock.mockResolvedValue({ ok: true, status: 200, json: () => body.promise });
  const auth = client(); const work = auth.getEvents(); const rejected = expect(work).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  auth.signOut(); body.resolve({ events: [{ id: 'late' }] });
  await rejected; expect(cache.getItem('lastEvents')).toBeNull();
});

const callbackClient = () => {
  const state = 'a'.repeat(64);
  session.setItem('meet.oauth.attempt', JSON.stringify({ state, codeVerifier: 'v'.repeat(43), redirectUri, createdAt: clock }));
  return client(`?code=fixture-code&state=${state}`);
};
test('pending code exchange cannot recreate authentication after sign-out', async () => {
  const pending = deferred(); fetchMock.mockReturnValue(pending.promise);
  const auth = callbackClient(); const work = auth.getEvents(); const rejected = expect(work).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
  await Promise.resolve(); auth.signOut();
  pending.resolve(response({ access_token: 'fixture-token', token_type: 'Bearer', expires_in: 3600 }));
  await rejected; expect(session.getItem(SESSION)).toBeNull();
});

test('failed credential persistence does not leave an authenticated in-memory session', async () => {
  const auth = callbackClient();
  const write = session.setItem;
  session.setItem = (key, value) => { if (key === SESSION) throw new Error('quota'); write(key, value); };
  fetchMock.mockResolvedValue(response({ access_token: 'fixture-token', token_type: 'Bearer', expires_in: 3600 }));
  await expect(auth.getEvents()).rejects.toMatchObject({ code: 'SESSION_UNAVAILABLE' });
  expect(session.getItem(SESSION)).toBeNull();
  await expect(auth.getAccessToken()).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
});

test('offline cached data requires a valid restored session and stops after sign-out', async () => {
  seed(); online = false; cache.setItem('lastEvents', '[{"id":"cached"}]');
  const auth = client();
  await expect(auth.getEvents()).resolves.toEqual([{ id: 'cached' }]);
  expect(fetchMock).not.toHaveBeenCalled();
  auth.signOut(); await expect(auth.getEvents()).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
});

test.each(['missing', 'expired', 'malformed'])('offline cache cannot bypass %s authentication', async (kind) => {
  online = false; cache.setItem('lastEvents', '[{"id":"cached"}]');
  if (kind === 'expired') seed(clock + 30000);
  if (kind === 'malformed') session.setItem(SESSION, 'broken');
  await expect(client().getEvents()).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
  expect(fetchMock).not.toHaveBeenCalled(); expect(navigate).not.toHaveBeenCalled();
});

test('reauthorization removes the previous credentials and cache before requesting an auth URL', async () => {
  seed(); const auth = client(); await auth.getAccessToken(); cache.setItem('lastEvents', '[]');
  const pending = deferred(); fetchMock.mockReturnValue(pending.promise);
  const work = auth.startAuthentication({ explicit: true });
  const rejected = expect(work).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
  expect(session.getItem(SESSION)).toBeNull(); expect(cache.getItem('lastEvents')).toBeNull();
  auth.signOut(); pending.resolve(response({ authUrl: 'invalid' })); await rejected;
  expect(navigate).not.toHaveBeenCalled();
});


test('a signed-out status prevents restoration if credential removal fails', async () => {
  seed(); const auth = client(); await auth.getAccessToken();
  const remove = session.removeItem;
  session.removeItem = (key) => { if (key === SESSION) throw new Error('blocked removal'); remove(key); };
  auth.signOut();
  await expect(auth.getAccessToken()).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
  await expect(client().getAccessToken()).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
  expect(fetchMock).not.toHaveBeenCalled();
});
