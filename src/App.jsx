import "./App.css";
import { getEventCategory } from "./event-categories";
import { useEffect, useMemo, useState, useRef, lazy, Suspense } from "react";
import EventErrorBoundary from "./components/EventErrorBoundary";
import CitySearch from "./components/CitySearch";
import CategoryFilter from "./components/CategoryFilter";
import ThemeToggle from "./components/ThemeToggle";
import Icon from "./components/Icon";
import EventList from "./components/EventList";
import { extractLocations, getEvents, AuthError, startAuthentication, signOut, subscribeAuthentication, isMockMode } from "./api";
import { InfoAlert, WarningAlert } from "./components/Alert";

// Keep the charting library out of the initial UI/authentication bundle.
const CityEventsChart = lazy(() => import("./components/CityEventsChart"));
const EventGenresChart = lazy(() => import("./components/EventGenresChart"));

const MAX_EVENTS = 50;
const eventStartTime = (event) => {
  const time = Date.parse(event.start?.dateTime || event.start?.date);
  return Number.isFinite(time) ? time : Infinity;
};

const App = () => {
  const loadVersion = useRef(0);
  const [authenticated, setAuthenticated] = useState(false);
  const [requiresSignIn, setRequiresSignIn] = useState(() => !isMockMode());
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [canAuthorize, setCanAuthorize] = useState(false);
  const [reload, setReload] = useState(0);
  const [currentCategory, setCurrentCategory] = useState("All Categories");
  const [currentCity, setCurrentCity] = useState("See all cities");
  const [infoAlert, setInfoAlert] = useState("");
  const [warningAlert, setWarningAlert] = useState("");

  useEffect(() => subscribeAuthentication(({ authenticated: signedIn, error }) => {
    setAuthenticated(signedIn);
    if (error) {
      setRequiresSignIn(true);
      loadVersion.current += 1;
      setAllEvents([]);
      setLoading(false);
      setLoadError(error.message);
      setCanAuthorize(error.canAuthorize);
      setInfoAlert("");
    }
  }), []);

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
    const version = ++loadVersion.current;
    const isCurrent = () => active && version === loadVersion.current;
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
        if (isCurrent()) setAllEvents(normalized);
      } catch (error) {
        if (isCurrent()) {
          setAllEvents([]);
          if (error instanceof AuthError && error.code === "AUTH_REQUIRED") setRequiresSignIn(true);
          setLoadError(error instanceof AuthError ? error.message : "Events could not be loaded. Please check your connection and try again.");
          setCanAuthorize(error instanceof AuthError && error.canAuthorize);
        }
      } finally {
        if (isCurrent()) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [reload]);

  // Bound the chronological feed before filtering: filters must not pull in event 51+.
  // Google supplies upcoming events; sorting also keeps cached/mock feeds predictable.
  const upcomingEvents = useMemo(() => [...allEvents]
    .sort((a, b) => {
      const first = eventStartTime(a);
      const second = eventStartTime(b);
      return first === second ? 0 : first < second ? -1 : 1;
    })
    .slice(0, MAX_EVENTS), [allEvents]);
  const allLocations = useMemo(() => extractLocations(upcomingEvents), [upcomingEvents]);
  const events = upcomingEvents.filter((event) =>
    (currentCity === "See all cities" || event.location === currentCity) &&
    (currentCategory === "All Categories" || getEventCategory(event) === currentCategory)
  );
  const authorize = async () => {
    setCanAuthorize(false);
    const pending = startAuthentication({ explicit: true });
    setLoading(true);
    setLoadError("");
    const version = loadVersion.current;
    try { await pending; }
    catch (error) {
      if (version !== loadVersion.current) return;
      setLoading(false);
      setLoadError(error instanceof AuthError ? error.message : "Authorization could not be started. Please try again.");
      setCanAuthorize(error instanceof AuthError && error.canAuthorize);
    }
  };
  const retry = () => setReload((value) => value + 1);

  const cityEvents = upcomingEvents.filter((event) => currentCity === "See all cities" || event.location === currentCity);
  const cityName = currentCity === "See all cities" ? "all cities" : currentCity.split(/, | - /)[0];

  return (
    <main className="App">
      <section className="hero" aria-labelledby="hero-title">
        <div className="brand-row">
          <div className="brand"><span className="brand-mark" aria-hidden="true">m</span><span>Meet</span></div>
          <div className="brand-actions">
            {authenticated && <button className="sign-out-btn" type="button" onClick={signOut}>Sign out</button>}
            <ThemeToggle />
          </div>
        </div>
        <span className="hero-eyebrow"><span className="status-dot" />Discover. Connect. Create.</span>
        <h1 id="hero-title">Discover tech gatherings<br className="hero-break" /> across the globe</h1>
        <p>Curated community summits, engineering exchanges, and developer workshops. Purely exploratory and open to all builders.</p>
      </section>
      {requiresSignIn && !authenticated ? (
        <section className="load-state welcome-panel" aria-labelledby="welcome-title" aria-busy={loading}>
          <h2 id="welcome-title">{loading ? "Loading Meet" : "Your next connection starts here"}</h2>
          {!loading && <p>Sign in with Google to explore upcoming tech events and discover your community.</p>}
          {loading ? <p role="status">Checking your session or completing Google sign-in…</p> : <>
            {loadError && loadError !== "Please authorize with Google to continue." && <div role="alert" className="error-state"><p>{loadError}</p></div>}
            <button className="continue-google-btn" type="button" onClick={authorize}>Continue with Google</button>
            {loadError && !canAuthorize && <p className="chart-note">Try signing in again. If this continues, check browser session storage or contact the site owner about authentication configuration.</p>}
          </>}
        </section>
      ) : (<>
      <section className="filter-panel" aria-label="Event filters">
        <div className="filter-row">
          <CitySearch allLocations={allLocations} setCurrentCity={setCurrentCity} setInfoAlert={setInfoAlert} />
          {!loading && !loadError && <p role="status" id="results-count"><span className="status-dot" aria-hidden="true" />{events.length} upcoming {events.length === 1 ? "event" : "events"} found</p>}
        </div>
        <CategoryFilter events={cityEvents} currentCategory={currentCategory} setCurrentCategory={setCurrentCategory} />
        <div className="alerts-container">
          {infoAlert.length ? <InfoAlert text={infoAlert} /> : null}
          {warningAlert ? <WarningAlert text={warningAlert} /> : null}
        </div>
      </section>
      {loading && <p role="status" className="load-state">Loading events…</p>}
      {loadError && (
        <div role="alert" className="load-state error-state">
          <p>{loadError}</p>
          {canAuthorize ? <button onClick={authorize}>Authorize with Google</button> : <button onClick={retry}>Try again</button>}
        </div>
      )}
      <EventErrorBoundary resetKey={allEvents} onRetry={retry}>
        <div className="content-layout">
          <section className="event-feed" aria-labelledby="events-heading">
            <div className="feed-heading">
              <h2 id="events-heading">Upcoming Events{currentCity === "See all cities" ? "" : ` in ${cityName}`}</h2>
              <span>Sorted chronologically</span>
            </div>
            {!loading && !loadError && events.length === 0 && <div className="load-state empty-state"><p role="status">No events found.</p><p>Try another city or category.</p></div>}
            <EventList events={events} />
          </section>
          <aside className="charts-container" aria-label="Event analytics">
            <section className="analytics-panel" aria-labelledby="category-chart-heading">
              <div className="analytics-heading"><div><h2 id="category-chart-heading">Events by Category</h2><p>Topic distribution in {cityName}</p></div><Icon name="pie" /></div>
              <Suspense fallback={<p className="chart-note" role="status">Loading analytics…</p>}><EventGenresChart events={events} /></Suspense>
            </section>
            <section className="analytics-panel" aria-labelledby="city-chart-heading">
              <div className="analytics-heading"><div><h2 id="city-chart-heading">Events by City</h2><p>Locations in your filtered results</p></div><Icon name="bars" /></div>
              <Suspense fallback={<p className="chart-note" role="status">Loading analytics…</p>}><CityEventsChart allLocations={allLocations} events={events} /></Suspense>
            </section>
          </aside>
        </div>
      </EventErrorBoundary>
      </>)}
    </main>
  );
};

export default App;
