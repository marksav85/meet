import "./App.css";
import { EVENT_CATEGORIES, getEventCategory } from "./event-categories";
import { useEffect, useMemo, useState } from "react";
import EventErrorBoundary from "./components/EventErrorBoundary";
import CitySearch from "./components/CitySearch";
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

  return (
    <div className="App">
      <div className="alerts-container">
        {infoAlert.length ? <InfoAlert text={infoAlert} /> : null}
        {warningAlert ? <WarningAlert text={warningAlert} /> : null}
      </div>
      <CitySearch
        allLocations={allLocations}
        setCurrentCity={setCurrentCity}
        setInfoAlert={setInfoAlert}
      />
      <div id="category-filter">
        <select aria-label="Event category" value={currentCategory} onChange={(event) => setCurrentCategory(event.target.value)}>
          <option>All Categories</option>
          {EVENT_CATEGORIES.map(({ name }) => <option key={name}>{name}</option>)}
        </select>
      </div>
      {loading && <p role="status">Loading events…</p>}
      {loadError && (
        <div role="alert">
          {loadError} {canAuthorize ? <button onClick={authorize}>Authorize with Google</button> : <button onClick={retry}>Try again</button>}
        </div>
      )}
      {!loading && !loadError && <p role="status" id="results-count">{events.length} upcoming {events.length === 1 ? "event" : "events"} found</p>}
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
