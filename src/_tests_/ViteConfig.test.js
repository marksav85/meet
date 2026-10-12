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

test('non-local hosts have no legacy API or callback fallback', () => {
  expect(getAuthConfig(new URL('https://release.example.test/'))).toEqual({ mode: 'oauth', apiBase: '', redirectUri: '' });
});
const { validateFrontendBuild } = require('../../scripts/check-frontend-build.cjs');
const release = { VITE_DATA_MODE: 'oauth', VITE_API_BASE_URL: 'https://api.example.test/prod', VITE_OAUTH_REDIRECT_URI: 'https://release.example.test/' };
test('explicit production build settings pass validation', () => expect(() => validateFrontendBuild(release)).not.toThrow());
test.each([
  {}, { ...release, VITE_DATA_MODE: 'mock' }, { ...release, VITE_DATA_MODE: undefined },
  { ...release, VITE_API_BASE_URL: 'https://api.example.test/dev' },
  { ...release, VITE_API_BASE_URL: 'https://api.example.test/localtest' },
  { ...release, VITE_API_BASE_URL: 'https://api.example.test/prod/api/get-events' },
  { ...release, VITE_OAUTH_REDIRECT_URI: 'https://marksav85.github.io/meet/' },
  { ...release, VITE_OAUTH_REDIRECT_URI: 'http://localhost:3000/' },
  { ...release, VITE_OAUTH_REDIRECT_URI: 'https://release.example.test' },
  { ...release, VITE_OAUTH_REDIRECT_URI: 'https://release.example.test/?code=fixture' },
])('release configuration fails closed for unsafe/missing settings %p', (env) => {
  expect(() => validateFrontendBuild(env)).toThrow();
});
