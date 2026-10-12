'use strict';

// Vite embeds public environment values; reject a release with development defaults.
function validateFrontendBuild(env) {
  if (env.VITE_DATA_MODE !== 'oauth') throw new Error('Release builds require VITE_DATA_MODE=oauth.');
  for (const key of ['VITE_API_BASE_URL', 'VITE_OAUTH_REDIRECT_URI']) {
    let url;
    try { url = new URL(env[key]); } catch { throw new Error(`Release builds require a valid ${key}.`); }
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
        ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.hostname.endsWith('.github.io')) {
      throw new Error(`${key} must use a production HTTPS URL without credentials, query or fragment.`);
    }
    if (key === 'VITE_API_BASE_URL' && !/^\/prod\/?$/.test(url.pathname)) {
      throw new Error('VITE_API_BASE_URL must select the prod stage, without an API route suffix.');
    }
    if (key === 'VITE_OAUTH_REDIRECT_URI' && (url.pathname !== '/' || !env[key].endsWith('/'))) {
      throw new Error('VITE_OAUTH_REDIRECT_URI must be an exact root callback including the trailing slash.');
    }
  }
}
module.exports = { validateFrontendBuild };
