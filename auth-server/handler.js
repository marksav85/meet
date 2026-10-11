"use strict";
const { google } = require("googleapis");
const SCOPES = ["https://www.googleapis.com/auth/calendar.events.public.readonly"];
const PRODUCTION_CALLBACK = "https://marksav85.github.io/meet/";

class RequestError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
const header = (event, name) => {
  if (Object.entries(event.multiValueHeaders || {}).some(([key, values]) => key.toLowerCase() === name.toLowerCase() && (!Array.isArray(values) || values.length !== 1))) return undefined;
  const entries = Object.entries(event.headers || {}).filter(([key]) => key.toLowerCase() === name.toLowerCase());
  return entries.length === 1 && typeof entries[0][1] === "string" ? entries[0][1] : undefined;
};
const callbacks = () => {
  let values;
  try { values = JSON.parse(process.env.OAUTH_REDIRECT_URIS || JSON.stringify([PRODUCTION_CALLBACK])); } catch { values = null; }
  if (!Array.isArray(values) || !values.length || values.some((value) => {
    try {
      const url = new URL(value);
      return typeof value !== "string" || url.href !== value || url.username || url.password || url.search || url.hash ||
        (url.protocol !== "https:" && value !== "http://localhost:3000/");
    } catch { return true; }
  })) throw new RequestError(500, "SERVER_CONFIGURATION", "Authentication configuration is unavailable.");
  return values;
};
const response = (statusCode, data, origin) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json", "Cache-Control": "no-store", "Pragma": "no-cache", "Vary": "Origin",
    ...(origin ? {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    } : {}),
  },
  body: statusCode === 204 ? "" : JSON.stringify(data),
});
const body = (event) => {
  if (header(event, "Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json" ||
      event.isBase64Encoded || typeof event.body !== "string" || event.body.length > 8192) {
    throw new RequestError(400, "INVALID_REQUEST", "A JSON request body is required.");
  }
  let result;
  try { result = JSON.parse(event.body); } catch { /* Invalid JSON is handled below. */ }
  if (!result || typeof result !== "object" || Array.isArray(result)) throw new RequestError(400, "INVALID_REQUEST", "A JSON object is required.");
  return result;
};
const redirectFor = (value, origin, approved) => {
  if (typeof value !== "string" || !approved.includes(value) || new URL(value).origin !== origin) {
    throw new RequestError(400, "INVALID_REDIRECT", "The callback is not approved for this origin.");
  }
  return value;
};
const oauthClient = (redirectUri) => {
  if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET) throw new RequestError(500, "SERVER_CONFIGURATION", "Authentication configuration is unavailable.");
  // Request-scoped credentials cannot leak between reused Lambda invocations.
  return new google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, redirectUri);
};
const upstreamError = (error, operation) => {
  const status = error?.response?.status || (Number.isInteger(error?.code) ? error.code : undefined);
  const providerCode = error?.response?.data?.error;
  if (providerCode === "invalid_client") return new RequestError(500, "SERVER_CONFIGURATION", "Authentication configuration is unavailable.");
  if (operation === "token" && (status === 400 || status === 401 || providerCode === "invalid_grant")) {
    return new RequestError(401, "AUTHORIZATION_FAILED", "Authorization could not be completed. Please authorize again.");
  }
  if (status === 401) return new RequestError(401, "UNAUTHORIZED", "Authorization has expired or is invalid.");
  if (status === 403) return new RequestError(403, "ACCESS_DENIED", "Access to the calendar is not permitted.");
  if (status === 429) return new RequestError(503, "UPSTREAM_BUSY", "Google is temporarily unavailable. Please try again.");
  if (status || ["ENOTFOUND", "ETIMEDOUT", "ECONNRESET"].includes(error?.code)) {
    return new RequestError(502, "UPSTREAM_ERROR", "Google could not complete the request.");
  }
  return new RequestError(500, "INTERNAL_ERROR", "The request could not be completed.");
};
const handle = (operation, method, action) => async (event = {}) => {
  let origin;
  try {
    const approved = callbacks();
    const requestedOrigin = header(event, "Origin");
    if (!requestedOrigin || !approved.some((uri) => new URL(uri).origin === requestedOrigin)) {
      throw new RequestError(403, "ORIGIN_NOT_ALLOWED", "This origin is not permitted.");
    }
    origin = requestedOrigin;
    if (event.httpMethod === "OPTIONS") {
      const requestedMethod = header(event, "Access-Control-Request-Method");
      const requestedHeaders = (header(event, "Access-Control-Request-Headers") || "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
      if (requestedMethod !== method || requestedHeaders.some((value) => !["content-type", "authorization"].includes(value))) {
        throw new RequestError(400, "INVALID_PREFLIGHT", "The requested method or headers are not permitted.");
      }
      return response(204, null, origin);
    }
    if (event.httpMethod !== method) throw new RequestError(405, "METHOD_NOT_ALLOWED", "This method is not permitted.");
    return response(200, await action(event, origin, approved), origin);
  } catch (error) {
    const safe = error instanceof RequestError ? error : new RequestError(500, "INTERNAL_ERROR", "The request could not be completed.");
    // Never pass SDK errors or request objects to the logger.
    if (safe.status >= 500) console.warn(JSON.stringify({ operation, code: safe.code, status: safe.status }));
    return response(safe.status, { error: { code: safe.code, message: safe.message } }, origin);
  }
};

module.exports.getAuthURL = handle("authorization", "POST", async (event, origin, approved) => {
  const input = body(event);
  const redirectUri = redirectFor(input.redirectUri, origin, approved);
  if (typeof input.state !== "string" || !/^[a-f0-9]{64}$/.test(input.state) ||
      typeof input.codeChallenge !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(input.codeChallenge)) {
    throw new RequestError(400, "INVALID_REQUEST", "A valid state and PKCE challenge are required.");
  }
  return { authUrl: oauthClient(redirectUri).generateAuthUrl({
    access_type: "online", scope: SCOPES, state: input.state,
    code_challenge: input.codeChallenge, code_challenge_method: "S256",
  }) };
});

module.exports.getAccessToken = handle("token", "POST", async (event, origin, approved) => {
  const input = body(event);
  const redirectUri = redirectFor(input.redirectUri, origin, approved);
  if (typeof input.code !== "string" || !input.code.trim() || input.code.length > 4096 || /[\x00-\x20\x7f]/.test(input.code) ||
      typeof input.codeVerifier !== "string" || !/^[A-Za-z0-9_-]{43,128}$/.test(input.codeVerifier)) {
    throw new RequestError(400, "INVALID_REQUEST", "A valid code and PKCE verifier are required.");
  }
  const client = oauthClient(redirectUri);
  let tokens;
  try {
    ({ tokens } = await client.getToken({ code: input.code, redirect_uri: redirectUri, codeVerifier: input.codeVerifier }));
  } catch (error) { throw upstreamError(error, "token"); }
  if (!tokens || typeof tokens.access_token !== "string" || !tokens.access_token || /\s/.test(tokens.access_token) ||
      !Number.isFinite(tokens.expiry_date) || tokens.expiry_date < Date.now() + 1000) {
    throw new RequestError(502, "INVALID_UPSTREAM_RESPONSE", "Google returned an invalid authorization response.");
  }
  return { access_token: tokens.access_token, token_type: "Bearer", expires_in: Math.floor((tokens.expiry_date - Date.now()) / 1000) };
});

module.exports.getCalendarEvents = handle("calendar", "GET", async (event) => {
  const authorization = header(event, "Authorization");
  const match = typeof authorization === "string" && /^Bearer ([A-Za-z0-9._~+/-]+=*)$/i.exec(authorization);
  if (!match || match[1].length > 4096) throw new RequestError(401, "UNAUTHORIZED", "A valid bearer token is required.");
  if (!process.env.CALENDAR_ID) throw new RequestError(500, "SERVER_CONFIGURATION", "Calendar configuration is unavailable.");
  const client = oauthClient();
  client.setCredentials({ access_token: match[1] });
  let result;
  try {
    result = await google.calendar("v3").events.list({
      calendarId: process.env.CALENDAR_ID, auth: client,
      timeMin: new Date().toISOString(), singleEvents: true, orderBy: "startTime",
    });
  } catch (error) { throw upstreamError(error, "calendar"); }
  if (!result?.data || (result?.data?.items !== undefined && !Array.isArray(result.data.items))) throw new RequestError(502, "INVALID_UPSTREAM_RESPONSE", "Google returned an invalid event response.");
  return { events: result?.data?.items || [] };
});
