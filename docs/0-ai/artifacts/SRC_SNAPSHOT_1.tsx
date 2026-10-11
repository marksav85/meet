// ARTIFACT_META: {"artifactId":"SRC_SNAPSHOT_1","packId":"2026-10-11T12:00:32Z","generatedAt":"2026-10-11T12:00:32Z","generator":"prompt--artifact--generate-snapshot.md"}
// ===== FILE: src/App.js =====
import "./App.css";
import { useEffect, useMemo, useState } from "react";
import EventErrorBoundary from "./components/EventErrorBoundary";
import CitySearch from "./components/CitySearch";
import EventList from "./components/EventList";
import NumberOfEvents from "./components/NumberOfEvents";
import CityEventsChart from "./components/CityEventsChart";
import EventGenresChart from "./components/EventGenresChart";
import { extractLocations, getEvents, AuthError, startAuthentication } from "./api";
import { InfoAlert, ErrorAlert, WarningAlert } from "./components/Alert";

const App = () => {
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [canAuthorize, setCanAuthorize] = useState(false);
  const [reload, setReload] = useState(0);
  const [currentNOE, setCurrentNOE] = useState(32);
  const [currentCity, setCurrentCity] = useState("See all cities");
  const [infoAlert, setInfoAlert] = useState("");
  const [errorAlert, setErrorAlert] = useState("");
  const [warningAlert, setWarningAlert] = useState("");

  useEffect(() => {
    const updateConnection = () => {
      setWarningAlert(navigator.onLine ? "" : "You are offline. Data may not be up-to-date");
      setReload((value) => value + 1);
    };
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    setCanAuthorize(false);
    setWarningAlert(navigator.onLine ? "" : "You are offline. Data may not be up-to-date");
    const load = async () => {
      try {
        const result = await getEvents();
        if (!Array.isArray(result) || result.some((event) => !event || typeof event !== "object" || Array.isArray(event))) {
          throw new Error("Invalid event response");
        }
        const normalized = result.map((event, index) => ({
          ...event,
          id: typeof event.id === "string" ? event.id : `event-${index}`,
          summary: typeof event.summary === "string" ? event.summary : "",
          location: typeof event.location === "string" ? event.location : "",
          description: typeof event.description === "string" ? event.description : "",
        }));
        if (active) setAllEvents(normalized);
      } catch (error) {
        if (active) {
          setAllEvents([]);
          setLoadError(error instanceof AuthError ? error.message : "Events could not be loaded. Please check your connection and try again.");
          setCanAuthorize(error instanceof AuthError && error.canAuthorize);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [reload]);

  const allLocations = useMemo(() => extractLocations(allEvents), [allEvents]);
  const filteredEvents = currentCity === "See all cities"
    ? allEvents
    : allEvents.filter((event) => event.location === currentCity);
  const events = filteredEvents.slice(0, currentNOE);
  const authorize = async () => {
    setCanAuthorize(false);
    try { await startAuthentication({ explicit: true }); }
    catch (error) {
      setLoadError(error instanceof AuthError ? error.message : "Authorization could not be started. Please try again.");
      setCanAuthorize(error instanceof AuthError && error.canAuthorize);
    }
  };
  const retry = () => setReload((value) => value + 1);

  return (
    <div className="App">
      <div className="alerts-container">
        {infoAlert.length ? <InfoAlert text={infoAlert} /> : null}
        {errorAlert.length ? <ErrorAlert text={errorAlert} /> : null}
        {warningAlert ? <WarningAlert text={warningAlert} /> : null}
      </div>
      <CitySearch
        allLocations={allLocations}
        setCurrentCity={setCurrentCity}
        setInfoAlert={setInfoAlert}
      />
      <NumberOfEvents
        setCurrentNOE={setCurrentNOE}
        setErrorAlert={setErrorAlert}
      />
      {loading && <p role="status">Loading events…</p>}
      {loadError && (
        <div role="alert">
          {loadError} {canAuthorize ? <button onClick={authorize}>Authorize with Google</button> : <button onClick={retry}>Try again</button>}
        </div>
      )}
      {!loading && !loadError && events.length === 0 && <p role="status">No events found.</p>}
      <EventErrorBoundary resetKey={allEvents} onRetry={retry}>
        <div className="charts-container">
          <EventGenresChart events={events} />
          <CityEventsChart allLocations={allLocations} events={events} />
        </div>
        <EventList events={events} />
      </EventErrorBoundary>
    </div>
  );
};

export default App;

// ===== FILE: src/components/Alert.js =====
// src/components/Alert.js

import { Component } from "react";

class Alert extends Component {
  constructor(props) {
    super(props);
    this.color = null;
    this.bgColor = null;
  }

  getStyle = () => {
    return {
      color: this.color,
      backgroundColor: this.bgColor,
      borderWidth: "2px",
      borderStyle: "solid",
      fontWeight: "bolder",
      borderRadius: "7px",
      borderColor: this.color,
      textAlign: "center",
      fontSize: "12px",
      margin: "10px 0",
      padding: "10px",
    };
  };

  render() {
    return (
      <div className="Alert">
        <p style={this.getStyle()}>{this.props.text}</p>
      </div>
    );
  }
}

class InfoAlert extends Alert {
  constructor(props) {
    super(props);
    this.color = "rgb(0, 0, 255)"; // blue
    this.bgColor = "rgb(220, 220, 255)"; // light blue
  }
}
class ErrorAlert extends Alert {
  constructor(props) {
    super(props);
    this.color = "rgb(203, 57, 90)"; // red
    this.bgColor = "rgb(249, 242, 244)"; // light red
  }
}
class WarningAlert extends Alert {
  constructor(props) {
    super(props);
    this.color = "rgb(239, 122, 21)"; // orange
    this.bgColor = "rgb(255, 244, 229)"; // light orange
  }
}

export { InfoAlert, ErrorAlert, WarningAlert };

// ===== FILE: src/components/CityEventsChart.js =====
// src/components/CityEventsChart.js

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CityEventsChart = ({ allLocations, events }) => {
  const data = allLocations.filter((location) => typeof location === "string" && location.trim()).map((location) => ({
    city: location.split(/, | - /)[0],
    count: events.filter((event) => event.location === location).length,
  }));

  return (
    <ResponsiveContainer width="99%" height={400}>
      <ScatterChart
        margin={{
          top: 20,
          right: 20,
          bottom: 60,
          left: -30,
        }}
      >
        <CartesianGrid />
        <XAxis
          type="category"
          dataKey="city"
          name="City"
          angle={60}
          interval={0}
          tick={{ dx: 20, dy: 40, fontSize: 14 }}
        />
        <YAxis
          type="number"
          dataKey="count"
          name="Number of Events"
          allowDecimals={false}
        />
        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
        <Scatter name="A school" data={data} fill="#8884d8" />
      </ScatterChart>
    </ResponsiveContainer>
  );
};

export default CityEventsChart;

// ===== FILE: src/components/CitySearch.js =====
// src/components/CitySearch.js
import { useState } from "react";

const CitySearch = ({ allLocations, setCurrentCity, setInfoAlert }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [query, setQuery] = useState("");
  const suggestions = allLocations.filter((location) => typeof location === "string" && (
    query === "See all cities" || location.toUpperCase().includes(query.toUpperCase())
  ));

  const handleInputChanged = (event) => {
    const value = event.target.value;
    const filteredLocations = allLocations
      ? allLocations.filter((location) => {
          return typeof location === "string" && location.toUpperCase().indexOf(value.toUpperCase()) > -1;
        })
      : [];

    setQuery(value);

    let infoText;
    if (filteredLocations.length === 0) {
      infoText =
        "We can not find the city you are looking for. Please try another city";
    } else {
      infoText = "";
    }
    setInfoAlert(infoText);
  };

  const handleItemClicked = (event) => {
    const value = event.target.textContent;
    setQuery(value);
    setShowSuggestions(false); // to hide the list
    setCurrentCity(value);
    setInfoAlert("");
  };

  return (
    <div id="city-search">
      <input
        type="text"
        className="city"
        placeholder="Search for a city"
        value={query}
        onFocus={() => setShowSuggestions(true)}
        onChange={handleInputChanged}
      />
      {showSuggestions ? (
        <ul className="suggestions">
          {suggestions.map((suggestion) => {
            return (
              <li onClick={handleItemClicked} key={suggestion}>
                {suggestion}
              </li>
            );
          })}
          <li key="See all cities" onClick={handleItemClicked}>
            <b>See all cities</b>
          </li>
        </ul>
      ) : null}
    </div>
  );
};

export default CitySearch;

// ===== FILE: src/components/Event.js =====
import { useState } from "react";

export const formatEventStart = (start) => {
  if (start?.dateTime) {
    const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
    if (typeof start.dateTime !== "string" || !timestampPattern.test(start.dateTime)) {
      return "Date unavailable";
    }
    const day = new Date(`${start.dateTime.slice(0, 10)}T00:00:00Z`);
    if (Number.isNaN(day.getTime()) || day.toISOString().slice(0, 10) !== start.dateTime.slice(0, 10)) return "Date unavailable";
    const date = new Date(start.dateTime);
    return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString("en-US");
  }
  if (typeof start?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(start.date)) {
    const date = new Date(`${start.date}T00:00:00Z`);
    if (!Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === start.date) {
      return `${date.toLocaleDateString("en-US", { timeZone: "UTC" })} (all day)`;
    }
  }
  return "Date unavailable";
};

const Event = ({ event }) => {
  const [isHidden, setIsHidden] = useState(true);
  return (
    <li className="event">
      <h1 className="event_summary">{event.summary || "Untitled event"}</h1>
      <p className="event_start">{formatEventStart(event.start)}</p>
      <p className="event_location">{event.location || "Location unavailable"}</p>
      {!isHidden && <div className="event_details"><p>{event.description || "No description available"}</p></div>}
      <button className="details-btn" aria-expanded={!isHidden} onClick={() => setIsHidden((hidden) => !hidden)}>
        {isHidden ? "Show details" : "Hide details"}
      </button>
    </li>
  );
};
export default Event;

// ===== FILE: src/components/EventErrorBoundary.js =====
import { Component } from "react";

class EventErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.failed) {
      this.setState({ failed: false });
    }
  }
  render() {
    return this.state.failed ? (
      <div role="alert">Events could not be displayed. <button onClick={this.props.onRetry}>Try again</button></div>
    ) : this.props.children;
  }
}
export default EventErrorBoundary;

// ===== FILE: src/components/EventGenresChart.js =====
import { ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const EventGenresChart = ({ events }) => {
  const genres = ["React", "JavaScript", "Node", "jQuery", "Angular"];
  const colors = ["#DD0000", "#00DD00", "#0000DD", "#DDDD00", "#DD00DD"];

  const data = genres.map((genre) => ({
    name: genre,
    value: events.filter((event) => typeof event.summary === "string" && event.summary.includes(genre)).length,
  }));

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    outerRadius,
    percent,
    index,
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius;
    const x = cx + radius * Math.cos(-midAngle * RADIAN) * 1.07;
    const y = cy + radius * Math.sin(-midAngle * RADIAN) * 1.07;
    return percent ? (
      <text
        x={x}
        y={y}
        fill="#8884d8"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
      >
        {`${genres[index]} ${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  return (
    <ResponsiveContainer width="99%" height={400}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          fill="#8884d8"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={130}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index]} />
          ))}
        </Pie>

        <Legend
          verticalAlign="top"
          align="center"
          layout="horizontal"
          iconType="circle"
          wrapperStyle={{ paddingLeft: "50px" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default EventGenresChart;

// ===== FILE: src/components/EventList.js =====
// src/components/EventList.js
import Event from "./Event";

const EventList = ({ events }) => {
  return (
    <ul id="event-list" aria-label="Events">
      {events
        ? events.map((event) => <Event key={event.id} event={event} />)
        : null}
    </ul>
  );
};

export default EventList;

// ===== FILE: src/components/NumberOfEvents.js =====
import { useState } from "react";

const NumberOfEvents = ({ setCurrentNOE, setErrorAlert }) => {
  const [input, setInput] = useState("32");
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) {
      setErrorAlert("Please enter a whole number from 1 to 32");
    } else if (Number(value) < 1 || Number(value) > 32) {
      setErrorAlert("Please enter a whole number from 1 to 32");
    } else {
      setErrorAlert("");
      setCurrentNOE(Number(value));
    }
  };
  return (
    <div id="event-number">
      <input aria-label="Number of events" type="text" inputMode="numeric" value={input} onChange={handleInputChange} />
    </div>
  );
};
export default NumberOfEvents;

// ===== FILE: src/api.js =====
import mockData from "./mock-data";
import { createAuthClient } from "./auth";

export { AuthError, readCachedEvents } from "./auth";
export const extractLocations = (events) => [...new Set(events
  .map((event) => event.location)
  .filter((location) => typeof location === "string" && location.trim()))];

const client = createAuthClient({ mockData });
export const prepareAuthentication = client.prepare;
export const isMockMode = client.isMockMode;
export const startAuthentication = client.startAuthentication;
export const getAccessToken = client.getAccessToken;
export const getEvents = client.getEvents;

// ===== FILE: src/auth.js =====
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
    mode: process.env.REACT_APP_DATA_MODE || (local ? "mock" : "oauth"),
    // Live localhost mode must explicitly select the future isolated testing API.
    apiBase: process.env.REACT_APP_API_BASE_URL || (local ? "" : "https://joocz3kndl.execute-api.eu-central-1.amazonaws.com/dev"),
    redirectUri: process.env.REACT_APP_OAUTH_REDIRECT_URI || (local ? "http://localhost:3000/" : "https://marksav85.github.io/meet/"),
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

