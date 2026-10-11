const ATTEMPT_KEY = "meet.oauth.attempt";
const STATUS_KEY = "meet.oauth.status";
const ATTEMPT_TTL = 10 * 60 * 1000;
const CALLBACK_KEYS = ["code", "state", "error", "error_description", "error_uri", "scope", "authuser", "prompt", "hd", "session_state"];

export class AuthError extends Error {
  constructor(code, message, canAuthorize = true) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.canAuthorize = canAuthorize;
  }
}

export const getAuthConfig = (location = window.location) => {
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
  return {
    mode: import.meta.env.VITE_DATA_MODE || (local ? "mock" : "oauth"),
    // Live localhost mode must explicitly select the future isolated testing API.
    apiBase: import.meta.env.VITE_API_BASE_URL || (local ? "" : "https://joocz3kndl.execute-api.eu-central-1.amazonaws.com/dev"),
    redirectUri: import.meta.env.VITE_OAUTH_REDIRECT_URI || (local ? "http://localhost:3000/" : "https://marksav85.github.io/meet/"),
  };
};

// Injectable browser facilities let tests exercise the real flow without navigation
// or network access. Only the short-lived transaction survives the Google redirect.
export const createAuthClient = (options = {}) => {
  const location = options.location || window.location;
  const history = options.history || window.history;
  const config = options.config || getAuthConfig(location);
  const fetchRequest = options.fetch || ((...args) => fetch(...args));
  const crypto = options.crypto || window.crypto;
  const now = options.now || Date.now;
  const navigate = options.navigate || ((url) => window.location.assign(url));
  const session = () => options.sessionStorage || window.sessionStorage;
  const cache = () => options.localStorage || window.localStorage;
  let callback;
  let prepared = false;
  let hadCallback = false;
  let accessToken;
  let authInFlight;
  let eventsInFlight;

  const sessionError = () => new AuthError("SESSION_UNAVAILABLE", "Browser session storage is required to authorize safely.", false);
  const getStatus = () => {
    try { return session().getItem(STATUS_KEY); } catch { throw sessionError(); }
  };
  const setStatus = (status) => {
    try { session().setItem(STATUS_KEY, status); } catch { throw sessionError(); }
  };
  const clearAttempt = () => {
    try { session().removeItem(ATTEMPT_KEY); } catch { throw sessionError(); }
  };
  const prepare = () => {
    if (prepared) return hadCallback;
    prepared = true;
    const url = new URL(location.href);
    hadCallback = ["code", "state", "error"].some((key) => url.searchParams.has(key));
    if (hadCallback) {
      callback = {
        code: url.searchParams.get("code"),
        state: url.searchParams.get("state"),
        denied: url.searchParams.has("error"),
        duplicate: ["code", "state", "error"].some((key) => url.searchParams.getAll(key).length > 1),
      };
    }
    CALLBACK_KEYS.forEach((key) => url.searchParams.delete(key));
    if (url.href !== location.href) {
      history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
    // Remove legacy persistent tokens without reading their values.
    try { cache().removeItem("access_token"); } catch { /* Storage may be disabled. */ }
    return hadCallback;
  };
  const validateConfig = () => {
    try {
      const api = new URL(config.apiBase);
      const redirect = new URL(config.redirectUri);
      const localApi = api.protocol === "http:" && ["localhost", "127.0.0.1"].includes(api.hostname);
      if (config.mode !== "oauth" || (api.protocol !== "https:" && !localApi) || api.username || api.password || api.search || api.hash ||
          redirect.origin !== location.origin || redirect.pathname !== location.pathname || redirect.search || redirect.hash || redirect.username || redirect.password) {
        throw new Error();
      }
    } catch {
      throw new AuthError("AUTH_CONFIGURATION", "Authentication is not configured for this environment.", false);
    }
  };
  const request = async (path, init = {}) => {
    let response;
    try {
      response = await fetchRequest(`${config.apiBase.replace(/\/$/, "")}${path}`, {
        ...init, credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer",
      });
    } catch {
      throw new AuthError("AUTH_NETWORK", "The authentication service could not be reached. Please try again.");
    }
    let body;
    try { body = await response.json(); } catch {
      throw new AuthError("INVALID_RESPONSE", "The service returned an invalid response.");
    }
    if (!response.ok) {
      if (response.status === 401) {
        accessToken = undefined;
        setStatus("reauthorize");
        throw new AuthError("AUTH_REQUIRED", "Your authorization has expired or was rejected. Please authorize again.");
      }
      if (response.status === 403) throw new AuthError("ACCESS_DENIED", "Access to this calendar or application is not permitted.", false);
      throw new AuthError("SERVICE_ERROR", "The service could not complete the request. Please try again.", false);
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new AuthError("INVALID_RESPONSE", "The service returned an invalid response.");
    return body;
  };
  const post = (path, body) => request(path, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const base64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const start = async ({ explicit = false } = {}) => {
    prepare();
    validateConfig();
    if (authInFlight) return authInFlight;
    if (!explicit && getStatus()) throw new AuthError("AUTH_REQUIRED", "Please authorize with Google to continue.");
    authInFlight = (async () => {
      accessToken = undefined;
      callback = undefined;
      clearAttempt();
      setStatus("pending");
      try {
        if (!crypto?.getRandomValues || !crypto?.subtle?.digest) throw new AuthError("CRYPTO_UNAVAILABLE", "Secure browser cryptography is required to authorize.", false);
        const state = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, "0")).join("");
        const codeVerifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
        const codeChallenge = base64url(new Uint8Array(await crypto.subtle.digest("SHA-256", Uint8Array.from(codeVerifier, (char) => char.charCodeAt(0)))));
        const attempt = { state, codeVerifier, redirectUri: config.redirectUri, createdAt: now() };
        try { session().setItem(ATTEMPT_KEY, JSON.stringify(attempt)); } catch { throw sessionError(); }
        const result = await post("/api/get-auth-url", { state, redirectUri: config.redirectUri, codeChallenge });
        const url = new URL(result.authUrl);
        if (url.origin !== "https://accounts.google.com" || url.pathname !== "/o/oauth2/v2/auth" || url.searchParams.get("state") !== state ||
            url.searchParams.get("redirect_uri") !== config.redirectUri || url.searchParams.get("code_challenge") !== codeChallenge ||
            url.searchParams.get("code_challenge_method") !== "S256" || url.searchParams.get("response_type") !== "code" || url.searchParams.get("access_type") !== "online") {
          throw new AuthError("INVALID_AUTH_URL", "The authorization service returned an invalid response.", false);
        }
        navigate(url.href);
      } catch (error) {
        clearAttempt();
        setStatus("reauthorize");
        throw error instanceof AuthError ? error : new AuthError("INVALID_AUTH_URL", "Authorization could not be started. Please try again.");
      }
    })();
    try { await authInFlight; } finally { authInFlight = undefined; }
  };

  const processCallback = async () => {
    const incoming = callback;
    callback = undefined;
    let attempt;
    try { attempt = JSON.parse(session().getItem(ATTEMPT_KEY)); } catch { /* Fail closed below. */ }
    clearAttempt(); // Consume before awaiting an exchange; replay can never reuse it.
    setStatus("reauthorize");
    if (!attempt || incoming.duplicate || !incoming.state || incoming.state !== attempt.state ||
        !/^[a-f0-9]{64}$/.test(attempt.state) || !/^[A-Za-z0-9_-]{43}$/.test(attempt.codeVerifier) ||
        !Number.isFinite(attempt.createdAt) || now() - attempt.createdAt > ATTEMPT_TTL || attempt.createdAt > now() ||
        attempt.redirectUri !== config.redirectUri) {
      throw new AuthError("INVALID_STATE", "This authorization response is invalid or has expired. Please authorize again.");
    }
    if (incoming.denied) throw new AuthError("AUTH_DENIED", "Google authorization was declined. You can authorize again when ready.");
    if (typeof incoming.code !== "string" || !incoming.code.trim() || incoming.code.length > 4096) {
      throw new AuthError("MISSING_CODE", "Google did not return an authorization code. Please authorize again.");
    }
    const result = await post("/api/token", { code: incoming.code, redirectUri: attempt.redirectUri, codeVerifier: attempt.codeVerifier });
    if (typeof result.access_token !== "string" || !result.access_token || /\s/.test(result.access_token) || result.token_type !== "Bearer" ||
        !Number.isFinite(result.expires_in) || result.expires_in <= 0 || result.expires_in > 86400) {
      throw new AuthError("INVALID_TOKEN_RESPONSE", "The authorization service returned an invalid response.");
    }
    accessToken = { value: result.access_token, expiresAt: now() + result.expires_in * 1000 };
    setStatus("authorized");
    return accessToken.value;
  };
  const getAccessToken = async () => {
    prepare();
    validateConfig();
    if (callback) {
      if (authInFlight) return authInFlight;
      authInFlight = processCallback();
      try { return await authInFlight; } finally { authInFlight = undefined; }
    }
    if (authInFlight) return authInFlight;
    if (accessToken && accessToken.expiresAt > now() + 30000) return accessToken.value;
    if (accessToken) {
      accessToken = undefined;
      setStatus("reauthorize");
    }
    if (getStatus()) throw new AuthError("AUTH_REQUIRED", "Please authorize with Google to continue.");
    await start();
    throw new AuthError("AUTH_REDIRECT", "Redirecting to Google…", false);
  };
  const getEvents = async () => {
    prepare();
    if (config.mode === "mock") {
      if (hadCallback) {
        clearAttempt();
        setStatus("reauthorize");
        throw new AuthError("MOCK_CALLBACK", "Enable the configured OAuth development mode before authorizing.", false);
      }
      return options.mockData || [];
    }
    if (!(options.isOnline || (() => navigator.onLine))()) return readCachedEvents(cache());
    if (eventsInFlight) return eventsInFlight;
    eventsInFlight = (async () => {
      const token = await getAccessToken();
      const result = await request("/api/get-events", { method: "GET", headers: { Authorization: `Bearer ${token}` } });
      if (!Array.isArray(result.events) || result.events.some((event) => !event || typeof event !== "object" || Array.isArray(event))) {
        throw new AuthError("INVALID_EVENTS", "The service returned invalid events.", false);
      }
      try { cache().setItem("lastEvents", JSON.stringify(result.events)); } catch { /* Fresh events remain usable when cache storage is unavailable. */ }
      return result.events;
    })();
    try { return await eventsInFlight; } finally { eventsInFlight = undefined; }
  };
  return { prepare, getEvents, getAccessToken, startAuthentication: start, isMockMode: () => config.mode === "mock" };
};

export const readCachedEvents = (storage) => {
  try {
    const cached = (storage || window.localStorage).getItem("lastEvents");
    if (!cached) return [];
    const events = JSON.parse(cached);
    if (!Array.isArray(events)) throw new Error();
    return events;
  } catch {
    throw new Error("Saved events could not be read. Please reconnect and try again.");
  }
};
