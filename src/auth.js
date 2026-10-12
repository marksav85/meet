const ATTEMPT_KEY = "meet.oauth.attempt";
const STATUS_KEY = "meet.oauth.status";
const SESSION_KEY = "meet.oauth.session";
const EXPIRY_MARGIN = 30000;
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
    // Missing release settings fail closed; local OAuth still needs an explicit API.
    apiBase: import.meta.env.VITE_API_BASE_URL || "",
    redirectUri: import.meta.env.VITE_OAUTH_REDIRECT_URI || (local ? "http://localhost:3000/" : ""),
  };
};

// Injectable browser facilities let tests exercise the real flow without navigation
// or network access. Credentials persist only for the current tab and token lifetime.
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
  let generation = 0;
  let expiryTimer;
  let lastError;
  let storageError;
  const listeners = new Set();
  const schedule = options.setTimeout || ((...args) => window.setTimeout(...args));
  const cancel = options.clearTimeout || ((id) => window.clearTimeout(id));
  const isOnline = options.isOnline || (() => navigator.onLine);
  const required = () => new AuthError("AUTH_REQUIRED", "Please authorize with Google to continue.");
  const validToken = (token) => typeof token === "string" && token.length > 0 && token.length <= 4096 && !/\s/.test(token);
  const usable = () => Boolean(accessToken && accessToken.expiresAt > now() + EXPIRY_MARGIN);
  const emit = () => listeners.forEach((listener) => listener({ authenticated: usable(), error: lastError }));
  // Logout/expiry invalidate every outstanding operation, even if fetch cannot be cancelled.
  const checkGeneration = (expected) => { if (generation !== expected) throw required(); };
  const clearAuthentication = (error = required(), notify = true) => {
    generation += 1;
    cancel(expiryTimer);
    expiryTimer = undefined;
    accessToken = undefined;
    authInFlight = undefined;
    eventsInFlight = undefined;
    lastError = error;
    // Always clear memory/UI even if browser storage has become inaccessible.
    try { session().removeItem(SESSION_KEY); } catch { /* Fail closed in memory. */ }
    try { session().setItem(STATUS_KEY, "reauthorize"); } catch { /* Reads will fail closed. */ }
    try { cache().removeItem("lastEvents"); } catch { /* Cache is never authorization. */ }
    if (notify) emit();
  };
  const expire = () => clearAuthentication(new AuthError("AUTH_REQUIRED", "Your authorization has expired. Please authorize again."));
  const armExpiry = () => {
    cancel(expiryTimer);
    // A delayed background timer must recheck the absolute expiry, not renew it.
    expiryTimer = schedule(() => {
      if (usable()) armExpiry(); else expire();
    }, Math.max(0, accessToken.expiresAt - now() - EXPIRY_MARGIN));
  };
  const restoreSession = () => {
    let saved, status;
    try {
      saved = session().getItem(SESSION_KEY);
      status = session().getItem(STATUS_KEY);
    } catch {
      storageError = sessionError();
      clearAuthentication(storageError, false);
      return;
    }
    if (saved === null) return;
    let record;
    try { record = JSON.parse(saved); } catch { /* Invalid data is discarded below. */ }
    if (status === "reauthorize" || status === "pending" || !record || typeof record !== "object" || Array.isArray(record) || Object.keys(record).length !== 2 ||
        !validToken(record.value) || !Number.isFinite(record.expiresAt) || record.expiresAt <= now() + EXPIRY_MARGIN ||
        record.expiresAt > now() + 86400000) {
      clearAuthentication(required(), false);
      return;
    }
    // Reuse the recorded deadline; recalculating from a duration would extend each reload.
    accessToken = record;
    lastError = undefined;
    armExpiry();
    emit();
  };
  const subscribe = (listener) => {
    listeners.add(listener);
    listener({ authenticated: usable(), error: lastError });
    return () => listeners.delete(listener);
  };
  const signOut = () => {
    callback = undefined;
    try { session().removeItem(ATTEMPT_KEY); } catch { /* Sign-out still clears memory. */ }
    clearAuthentication(new AuthError("AUTH_REQUIRED", "You have signed out. Please authorize with Google to continue."));
  };

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
    if (config.mode === "oauth") {
      if (hadCallback) clearAuthentication(required(), false);
      else restoreSession();
    }
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
    const expected = generation;
    let response;
    try {
      response = await fetchRequest(`${config.apiBase.replace(/\/$/, "")}${path}`, {
        ...init, credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer",
      });
    } catch {
      checkGeneration(expected);
      throw new AuthError("AUTH_NETWORK", "The authentication service could not be reached. Please try again.");
    }
    checkGeneration(expected);
    if (response.status === 401) {
      const error = new AuthError("AUTH_REQUIRED", "Your authorization has expired or was rejected. Please authorize again.");
      clearAuthentication(error);
      throw error;
    }
    let body;
    try { body = await response.json(); } catch {
      checkGeneration(expected);
      throw new AuthError("INVALID_RESPONSE", "The service returned an invalid response.");
    }
    checkGeneration(expected);
    if (!response.ok) {
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
    if (storageError) throw storageError;
    if (authInFlight) return authInFlight;
    if (!explicit && getStatus()) throw new AuthError("AUTH_REQUIRED", "Please authorize with Google to continue.");
    clearAuthentication(required(), Boolean(accessToken) || explicit);
    const expected = generation;
    const work = (async () => {
      callback = undefined;
      clearAttempt();
      setStatus("pending");
      try {
        if (!crypto?.getRandomValues || !crypto?.subtle?.digest) throw new AuthError("CRYPTO_UNAVAILABLE", "Secure browser cryptography is required to authorize.", false);
        // State binds this tab to the callback; PKCE binds the code to its private verifier.
        const state = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, "0")).join("");
        const codeVerifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
        const codeChallenge = base64url(new Uint8Array(await crypto.subtle.digest("SHA-256", Uint8Array.from(codeVerifier, (char) => char.charCodeAt(0)))));
        checkGeneration(expected);
        const attempt = { state, codeVerifier, redirectUri: config.redirectUri, createdAt: now() };
        try { session().setItem(ATTEMPT_KEY, JSON.stringify(attempt)); } catch { throw sessionError(); }
        const result = await post("/api/get-auth-url", { state, redirectUri: config.redirectUri, codeChallenge });
        checkGeneration(expected);
        const url = new URL(result.authUrl);
        if (url.origin !== "https://accounts.google.com" || url.pathname !== "/o/oauth2/v2/auth" || url.searchParams.get("state") !== state ||
            url.searchParams.get("redirect_uri") !== config.redirectUri || url.searchParams.get("code_challenge") !== codeChallenge ||
            url.searchParams.get("code_challenge_method") !== "S256" || url.searchParams.get("response_type") !== "code" || url.searchParams.get("access_type") !== "online") {
          throw new AuthError("INVALID_AUTH_URL", "The authorization service returned an invalid response.", false);
        }
        navigate(url.href);
      } catch (error) {
        checkGeneration(expected);
        clearAttempt();
        setStatus("reauthorize");
        throw error instanceof AuthError ? error : new AuthError("INVALID_AUTH_URL", "Authorization could not be started. Please try again.");
      }
    })();
    authInFlight = work;
    try { await work; } finally { if (authInFlight === work) authInFlight = undefined; }
  };

  const processCallback = async () => {
    const expected = generation;
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
    checkGeneration(expected);
    if (!validToken(result.access_token) || result.token_type !== "Bearer" ||
        !Number.isFinite(result.expires_in) || result.expires_in <= 0 || result.expires_in > 86400) {
      throw new AuthError("INVALID_TOKEN_RESPONSE", "The authorization service returned an invalid response.");
    }
    if (result.expires_in * 1000 <= EXPIRY_MARGIN) throw new AuthError("INVALID_TOKEN_RESPONSE", "The service returned an invalid response.");
    // Persist only this short-lived bearer credential; no refresh token or account data.
    const record = { value: result.access_token, expiresAt: now() + result.expires_in * 1000 };
    try {
      session().setItem(SESSION_KEY, JSON.stringify(record));
      setStatus("authorized");
    } catch {
      clearAuthentication(sessionError());
      throw sessionError();
    }
    accessToken = record;
    lastError = undefined;
    armExpiry();
    emit();
    return accessToken.value;
  };
  const getAccessToken = async () => {
    prepare();
    validateConfig();
    if (storageError) throw storageError;
    if (callback) {
      if (authInFlight) return authInFlight;
      const work = processCallback();
      authInFlight = work;
      try { return await work; } finally { if (authInFlight === work) authInFlight = undefined; }
    }
    if (authInFlight) return authInFlight;
    if (usable()) return accessToken.value;
    if (accessToken) expire();
    if (getStatus()) throw new AuthError("AUTH_REQUIRED", "Please authorize with Google to continue.");
    if (!isOnline()) throw required();
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
    if (eventsInFlight) return eventsInFlight;
    const expected = generation;
    const work = (async () => {
      const token = await getAccessToken();
      checkGeneration(expected);
      if (!usable()) { expire(); throw required(); }
      // Cached events are data, never proof of authentication. Authorize before reading them.
      if (!isOnline()) return readCachedEvents(cache());
      const result = await request("/api/get-events", { method: "GET", headers: { Authorization: `Bearer ${token}` } });
      if (!Array.isArray(result.events) || result.events.some((event) => !event || typeof event !== "object" || Array.isArray(event))) {
        throw new AuthError("INVALID_EVENTS", "The service returned invalid events.", false);
      }
      checkGeneration(expected);
      if (!usable()) { expire(); throw required(); }
      try { cache().setItem("lastEvents", JSON.stringify(result.events)); } catch { /* Fresh events remain usable when cache storage is unavailable. */ }
      return result.events;
    })();
    eventsInFlight = work;
    try { return await work; } finally { if (eventsInFlight === work) eventsInFlight = undefined; }
  };
  return { prepare, getEvents, getAccessToken, signOut, subscribeAuthentication: subscribe, startAuthentication: start, isMockMode: () => config.mode === "mock" };
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
