import { createAuthClient } from '../auth';
const { webcrypto } = require('crypto');
const redirectUri = 'https://marksav85.github.io/meet/';
const storage = () => { const map = new Map(); return { getItem: (key) => map.get(key) || null, setItem: (key, value) => map.set(key, value), removeItem: (key) => map.delete(key) }; };
const response = (body, status = 200) => ({ ok: status === 200, status, json: async () => body });
let session, cache, fetchMock, navigate, clock;
const client = (query = '') => {
  const location = new URL(redirectUri + query);
  const history = { replaceState: jest.fn() };
  const auth = createAuthClient({ location, history, config: { mode: 'oauth', apiBase: 'https://api.example.test/stage', redirectUri }, sessionStorage: session, localStorage: cache, crypto: webcrypto, fetch: fetchMock, navigate, now: () => clock, isOnline: () => true });
  return { auth, history };
};
beforeEach(() => {
  session = storage(); cache = storage(); navigate = jest.fn(); clock = 1000000;
  fetchMock = jest.fn(async (url, init) => {
    if (url.endsWith('/api/get-auth-url')) {
      const input = JSON.parse(init.body);
      return response({ authUrl: 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({ state: input.state, redirect_uri: input.redirectUri, code_challenge: input.codeChallenge, code_challenge_method: 'S256', response_type: 'code', access_type: 'online' }) });
    }
    if (url.endsWith('/api/token')) return response({ access_token: 'fake-bearer', token_type: 'Bearer', expires_in: 3600 });
    return response({ events: [{ id: 'one' }] });
  });
});
const begin = async () => { await client().auth.startAuthentication(); return JSON.parse(session.getItem('meet.oauth.attempt')); };
test('starts a random session-bound transaction with S256 via Lambda POST', async () => {
  const attempt = await begin(); expect(attempt.state).toMatch(/^[a-f0-9]{64}$/); expect(attempt.codeVerifier).toHaveLength(43); expect(navigate).toHaveBeenCalledTimes(1);
  const [url, init] = fetchMock.mock.calls[0]; expect(url).toBe('https://api.example.test/stage/api/get-auth-url'); expect(init.method).toBe('POST'); expect(JSON.parse(init.body).codeVerifier).toBeUndefined();
});
test('exchanges callback once, cleans parameters and uses bearer headers persisting only a bounded tab session', async () => {
  const attempt = await begin(); cache.setItem('access_token', 'legacy');
  const { auth, history } = client(`?code=fake-code&state=${attempt.state}&scope=calendar&keep=yes`);
  expect(await auth.getEvents()).toEqual([{ id: 'one' }]); expect(history.replaceState).toHaveBeenCalledWith(null, '', '/meet/?keep=yes');
  expect(cache.getItem('access_token')).toBeNull(); expect(session.getItem('meet.oauth.attempt')).toBeNull();
  expect(fetchMock.mock.calls[1][1].method).toBe('POST'); expect(JSON.parse(fetchMock.mock.calls[1][1].body).code).toBe('fake-code');
  expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer fake-bearer');
  expect(fetchMock.mock.calls.map(([url]) => url).join(' ')).not.toMatch(/fake-code|fake-bearer|tokeninfo/);
  expect(JSON.parse(session.getItem("meet.oauth.session"))).toEqual({ value: "fake-bearer", expiresAt: clock + 3600000 });
  expect(JSON.stringify([session.getItem('meet.oauth.status'), cache.getItem('lastEvents')])).not.toMatch(/fake-bearer/);
});
test.each(['', 'wrong'])('rejects missing/mismatched state %p without exchange', async (state) => {
  await begin(); const auth = client(`?code=fake-code${state ? `&state=${state}` : ''}`).auth;
  await expect(auth.getEvents()).rejects.toMatchObject({ code: 'INVALID_STATE' }); expect(fetchMock).toHaveBeenCalledTimes(1); expect(session.getItem('meet.oauth.attempt')).toBeNull();
});
test('denial consumes state and does not redirect again', async () => {
  const attempt = await begin(); const auth = client(`?error=access_denied&state=${attempt.state}`).auth;
  await expect(auth.getEvents()).rejects.toMatchObject({ code: 'AUTH_DENIED' }); await expect(auth.getEvents()).rejects.toMatchObject({ code: 'AUTH_REQUIRED' }); expect(navigate).toHaveBeenCalledTimes(1);
});
test('replayed callback is rejected', async () => { const attempt = await begin(); const query = `?code=fake-code&state=${attempt.state}`; await client(query).auth.getEvents(); await expect(client(query).auth.getEvents()).rejects.toMatchObject({ code: 'INVALID_STATE' }); });
test('missing code is controlled', async () => { const attempt = await begin(); await expect(client(`?state=${attempt.state}`).auth.getEvents()).rejects.toMatchObject({ code: 'MISSING_CODE' }); });
test('expired transaction is rejected', async () => { const attempt = await begin(); clock += 600001; await expect(client(`?code=fake-code&state=${attempt.state}`).auth.getEvents()).rejects.toMatchObject({ code: 'INVALID_STATE' }); });
test('duplicate callback parameters fail closed', async () => { const attempt = await begin(); await expect(client(`?code=one&code=two&state=${attempt.state}`).auth.getEvents()).rejects.toMatchObject({ code: 'INVALID_STATE' }); });
test('expired memory token requires explicit reauthorization without redirect loop', async () => {
  const attempt = await begin(); const auth = client(`?code=fake-code&state=${attempt.state}`).auth; await auth.getEvents(); clock += 3600000;
  await expect(auth.getEvents()).rejects.toMatchObject({ code: 'AUTH_REQUIRED' }); expect(navigate).toHaveBeenCalledTimes(1);
  await auth.startAuthentication({ explicit: true }); expect(navigate).toHaveBeenCalledTimes(2);
});
test('calendar rejection invalidates token and requires explicit authorization', async () => { const attempt = await begin(); const auth = client(`?code=fake-code&state=${attempt.state}`).auth; await auth.getAccessToken(); fetchMock.mockResolvedValue(response({ error: { message: 'private-token' } }, 401)); await expect(auth.getEvents()).rejects.toMatchObject({ code: 'AUTH_REQUIRED' }); await expect(auth.getAccessToken()).rejects.toMatchObject({ code: 'AUTH_REQUIRED' }); });
test('network errors are sanitized and do not cause repeated redirects', async () => { fetchMock.mockRejectedValue(new Error('private-code')); const auth = client().auth; await expect(auth.startAuthentication({ explicit: true })).rejects.toMatchObject({ code: 'AUTH_NETWORK' }); await expect(auth.getEvents()).rejects.toMatchObject({ code: 'AUTH_REQUIRED' }); expect(navigate).not.toHaveBeenCalled(); });
test('malformed response is controlled', async () => { fetchMock.mockResolvedValue(response(null)); await expect(client().auth.startAuthentication({ explicit: true })).rejects.toMatchObject({ code: 'INVALID_RESPONSE' }); });
test('unavailable session storage fails before network or navigation', async () => { session.getItem = () => { throw new Error('blocked'); }; await expect(client().auth.getEvents()).rejects.toMatchObject({ code: 'SESSION_UNAVAILABLE' }); expect(fetchMock).not.toHaveBeenCalled(); });
test('concurrent event loads share one callback exchange', async () => { const attempt = await begin(); const auth = client(`?code=fake-code&state=${attempt.state}`).auth; await Promise.all([auth.getEvents(), auth.getEvents()]); expect(fetchMock.mock.calls.filter(([url]) => url.endsWith('/api/token'))).toHaveLength(1); });
test('mock mode makes no authentication requests', async () => {
  const auth = createAuthClient({ config: { mode: 'mock' }, location: new URL('http://localhost:3000/'), history: { replaceState: jest.fn() }, mockData: [{ id: 'fixture' }], fetch: fetchMock, localStorage: cache });
  expect(await auth.getEvents()).toEqual([{ id: 'fixture' }]); expect(fetchMock).not.toHaveBeenCalled();
});
test('callback exchange network failure consumes transaction without replay', async () => {
  const attempt = await begin(); fetchMock.mockRejectedValue(new Error('fake-code'));
  const auth = client(`?code=fake-code&state=${attempt.state}`).auth;
  await expect(auth.getEvents()).rejects.toMatchObject({ code: 'AUTH_NETWORK' }); expect(session.getItem('meet.oauth.attempt')).toBeNull(); await expect(auth.getEvents()).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
});
test('invalid token response is rejected without persisting credentials', async () => {
  const attempt = await begin(); fetchMock.mockResolvedValue(response({ access_token: 'fake-bearer', token_type: 'Bearer', expires_in: 0 }));
  await expect(client(`?code=fake-code&state=${attempt.state}`).auth.getEvents()).rejects.toMatchObject({ code: 'INVALID_TOKEN_RESPONSE' }); expect(cache.getItem('access_token')).toBeNull();
});

test('fresh visits require a button action without requesting an auth URL or redirecting', async () => {
  await expect(client().auth.getEvents()).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
  expect(fetchMock).not.toHaveBeenCalled();
  expect(navigate).not.toHaveBeenCalled();
});
