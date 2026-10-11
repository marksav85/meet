import { webcrypto } from 'node:crypto';
import { getAuthConfig, createAuthClient } from '../auth';

const keys = ['VITE_DATA_MODE', 'VITE_API_BASE_URL', 'VITE_OAUTH_REDIRECT_URI'];
let original;
beforeEach(() => { original = keys.map((key) => process.env[key]); keys.forEach((key) => delete process.env[key]); });
afterEach(() => keys.forEach((key, index) => { if (original[index] === undefined) delete process.env[key]; else process.env[key] = original[index]; }));
test('localhost defaults to fixtures without selecting an AWS API', () => {
  expect(getAuthConfig(new URL('http://localhost:3000/'))).toEqual({ mode: 'mock', apiBase: '', redirectUri: 'http://localhost:3000/' });
});
test('public Vite variables configure local OAuth with no live requests', async () => {
  process.env.VITE_DATA_MODE = 'oauth';
  process.env.VITE_API_BASE_URL = 'https://example.invalid/localtest';
  process.env.VITE_OAUTH_REDIRECT_URI = 'http://localhost:3000/';
  const config = getAuthConfig(new URL('http://localhost:3000/'));
  const fetch = jest.fn().mockRejectedValue(new Error('offline test'));
  const auth = createAuthClient({ config, crypto: webcrypto, location: new URL('http://localhost:3000/'), fetch, sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } });
  await expect(auth.getEvents()).rejects.toMatchObject({ code: 'AUTH_NETWORK' });
  expect(fetch.mock.calls[0][0]).toBe('https://example.invalid/localtest/api/get-auth-url');
});
test('local OAuth fails closed when its API is absent', async () => {
  process.env.VITE_DATA_MODE = 'oauth';
  const fetch = jest.fn();
  const auth = createAuthClient({ location: new URL('http://localhost:3000/'), fetch, sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } });
  await expect(auth.getEvents()).rejects.toMatchObject({ code: 'AUTH_CONFIGURATION' });
  expect(fetch).not.toHaveBeenCalled();
});
