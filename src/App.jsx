import "./App.css";
import { getEventCategory } from "./event-categories";
import { useEffect, useMemo, useState } from "react";
import EventErrorBoundary from "./components/EventErrorBoundary";
import CitySearch from "./components/CitySearch";
import CategoryFilter from "./components/CategoryFilter";
import ThemeToggle from "./components/ThemeToggle";
import Icon from "./components/Icon";
import EventList from "./components/EventList";
import CityEventsChart from "./components/CityEventsChart";
import EventGenresChart from "./components/EventGenresChart";
import { extractLocations, getEvents, AuthError, startAuthentication } from "./api";
import { InfoAlert, WarningAlert } from "./components/Alert";

const MAX_EVENTS = 50;
const eventStartTime = (event) => {
  const time = Date.parse(event.start?.dateTime || event.start?.date);
  return Number.isFinite(time) ? time : Infinity;
};

const App = () => {
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [canAuthorize, setCanAuthorize] = useState(false);
  const [reload, setReload] = useState(0);
  const [currentCategory, setCurrentCategory] = useState("All Categories");
  const [currentCity, setCurrentCity] = useState("See all cities");
  const [infoAlert, setInfoAlert] = useState("");
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

  // Google supplies upcoming events; keep mock/offline feeds in chronological order too.
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
    try { await startAuthentication({ explicit: true }); }
    catch (error) {
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
          <ThemeToggle />
        </div>
        <span className="hero-eyebrow"><span className="status-dot" />Discover. Connect. Create.</span>
        <h1 id="hero-title">Discover tech gatherings<br className="hero-break" /> across the globe</h1>
        <p>Curated community summits, engineering exchanges, and developer workshops. Purely exploratory and open to all builders.</p>
      </section>
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
              <EventGenresChart events={events} />
            </section>
            <section className="analytics-panel" aria-labelledby="city-chart-heading">
              <div className="analytics-heading"><div><h2 id="city-chart-heading">Events by City</h2><p>Locations in your filtered results</p></div><Icon name="bars" /></div>
              <CityEventsChart allLocations={allLocations} events={events} />
            </section>
          </aside>
        </div>
      </EventErrorBoundary>
    </main>
  );
};

export default App;
